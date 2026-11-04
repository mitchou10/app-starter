import asyncio
import os

# The database the tests run against (docker compose -f docker-compose.test.yaml up -d --wait). Set before the app
# is imported: its settings are read once.
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://app:app@localhost:55433/app")

from collections.abc import AsyncIterator, Callable, Iterator  # noqa: E402

import httpx2  # noqa: E402
import pytest  # noqa: E402
from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from sqlalchemy import text  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine  # noqa: E402
from sqlalchemy.pool import NullPool  # noqa: E402

from app.auth.context import RequestContext  # noqa: E402
from app.auth.deps import get_current_user  # noqa: E402
from app.config import settings  # noqa: E402
from app.db import get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.storage import StoredObject, get_store  # noqa: E402

SEEDED = ("feedback_types", "feedback_statuses")
RESET = (
    "TRUNCATE feedback_attachments, feedback_messages, feedbacks, feedback_types, feedback_statuses, "
    "user_profiles, notifications"
)


async def _sql(*statements: str) -> None:
    engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool)
    async with engine.begin() as connection:
        for statement in statements:
            await connection.execute(text(statement))
    await engine.dispose()


@pytest.fixture(scope="session")
def migrated_database() -> Iterator[None]:
    """The schema comes from the migrations, so they are tested too: from scratch, with the default types and statuses.

    A copy of those defaults is kept (`_seed_*`), so each test can start from them without repeating them here."""
    config = Config("alembic.ini")
    asyncio.run(_sql(*(f"DROP TABLE IF EXISTS _seed_{table}" for table in SEEDED)))
    command.downgrade(config, "base")
    command.upgrade(config, "head")
    asyncio.run(_sql(*(f"CREATE TABLE _seed_{table} AS TABLE {table}" for table in SEEDED)))
    yield
    # `alembic check` must not find tables the models do not know.
    asyncio.run(_sql(*(f"DROP TABLE IF EXISTS _seed_{table}" for table in SEEDED)))


@pytest.fixture
async def db(migrated_database: None) -> AsyncIterator[AsyncSession]:
    # NullPool: a connection belongs to the event loop of the test that opened it.
    engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool)
    async with engine.begin() as connection:
        await connection.execute(text(RESET))
        for table in SEEDED:
            await connection.execute(text(f"INSERT INTO {table} SELECT * FROM _seed_{table}"))
    async with async_sessionmaker(engine, expire_on_commit=False)() as session:
        app.dependency_overrides[get_db] = lambda: session
        yield session
    app.dependency_overrides.pop(get_db, None)
    await engine.dispose()


class MemoryStore:
    """In place of RustFS."""

    def __init__(self) -> None:
        self.objects: dict[str, StoredObject] = {}

    async def put(self, key: str, data: bytes, content_type: str) -> None:
        self.objects[key] = StoredObject(data=data, content_type=content_type)

    async def get(self, key: str) -> StoredObject | None:
        return self.objects.get(key)

    async def delete(self, key: str) -> None:
        self.objects.pop(key, None)


@pytest.fixture
def store() -> Iterator[MemoryStore]:
    memory = MemoryStore()
    app.dependency_overrides[get_store] = lambda: memory
    yield memory
    app.dependency_overrides.pop(get_store, None)


@pytest.fixture
def as_user(monkeypatch: pytest.MonkeyPatch) -> None:
    """Every request is the fixed dev user (AUTH_MODE=full-access): no identity provider needed."""
    monkeypatch.setattr(settings, "AUTH_MODE", "full-access")


@pytest.fixture
def login() -> Iterator[Callable[..., RequestContext]]:
    """Choose who is logged in: `login("u1", "ada")`, or `login(admin=True)`. Call it again to switch user."""

    def _login(user_id: str = "u1", username: str = "ada", admin: bool = False) -> RequestContext:
        user = RequestContext(user_id=user_id, username=username, name=username, is_admin=admin)
        app.dependency_overrides[get_current_user] = lambda: user
        return user

    yield _login
    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture
async def client(db: AsyncSession, store: MemoryStore) -> AsyncIterator[httpx2.AsyncClient]:
    """The app over HTTP, on the test database and the in-memory store. Nobody is logged in until `login` is called."""
    async with httpx2.AsyncClient(transport=httpx2.ASGITransport(app=app), base_url="http://test") as client:
        yield client
