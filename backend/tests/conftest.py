import os

# The database the tests run against (docker compose -f docker-compose.test.yaml up -d --wait). Set before the app
# is imported: its settings are read once.
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://app:app@localhost:55433/app")

from collections.abc import AsyncIterator, Iterator  # noqa: E402

import pytest  # noqa: E402
from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from sqlalchemy import text  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine  # noqa: E402
from sqlalchemy.pool import NullPool  # noqa: E402

from app.config import settings  # noqa: E402
from app.db import get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.storage import StoredObject, get_store  # noqa: E402


@pytest.fixture(scope="session")
def migrated_database() -> None:
    """The schema comes from the migrations, so they are tested too."""
    command.upgrade(Config("alembic.ini"), "head")


@pytest.fixture
async def db(migrated_database: None) -> AsyncIterator[AsyncSession]:
    # NullPool: a connection belongs to the event loop of the test that opened it.
    engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool)
    async with engine.begin() as connection:
        await connection.execute(text("TRUNCATE user_profiles"))
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
