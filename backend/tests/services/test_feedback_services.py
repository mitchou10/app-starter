"""The failure paths: when the storage or the database breaks halfway, nothing is left behind."""

import uuid

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.feedback import FeedbackRepository
from app.repositories.feedback_messages import FeedbackMessageRepository
from app.routers.deps import get_feedback_service, get_message_service, get_workflow
from app.services.actor import Actor
from app.services.errors import NotAllowed, ReferenceNotFound
from app.services.feedback import FeedbackService
from app.services.messages import MessageService
from app.services.uploads import Upload
from tests.conftest import MemoryStore
from tests.helpers import PNG

ADA = Actor(user_id="u1", username="ada")
ADMIN = Actor(user_id="a1", username="grace", is_admin=True)


class BreaksAfter(MemoryStore):
    """A storage that fails on its n-th write."""

    def __init__(self, working_writes: int) -> None:
        super().__init__()
        self.remaining = working_writes

    async def put(self, key: str, data: bytes, content_type: str) -> None:
        if self.remaining == 0:
            raise ConnectionError("storage down")
        self.remaining -= 1
        await super().put(key, data, content_type)


def images(count: int) -> list[Upload]:
    return [Upload(filename=f"{i}.png", data=PNG) for i in range(count)]


async def type_id(db: AsyncSession) -> uuid.UUID:
    return (await db.execute(text("SELECT id FROM feedback_types WHERE name = 'Bug'"))).scalar_one()


async def count(db: AsyncSession, table: str) -> int:
    return (await db.execute(text(f"SELECT count(*) FROM {table}"))).scalar_one()


async def sent(service: FeedbackService, db: AsyncSession):
    return await service.create(ADA, title="t", description="d", type_id=await type_id(db), page=None, uploads=[])


# ---- sending a feedback


async def test_when_the_storage_fails_midway_the_screenshots_already_stored_are_taken_back(db: AsyncSession) -> None:
    store = BreaksAfter(working_writes=2)
    service = get_feedback_service(db, store)
    with pytest.raises(ConnectionError):
        await service.create(ADA, title="t", description="d", type_id=await type_id(db), page=None, uploads=images(3))
    assert store.objects == {}  # the two that were written are gone
    await db.rollback()
    assert await count(db, "feedbacks") == 0


async def test_when_the_database_fails_the_screenshots_are_taken_back(db: AsyncSession, monkeypatch) -> None:
    store = MemoryStore()
    service = get_feedback_service(db, store)

    async def fail(self) -> None:
        raise RuntimeError("database down")

    monkeypatch.setattr(FeedbackRepository, "commit", fail)
    with pytest.raises(RuntimeError):
        await service.create(ADA, title="t", description="d", type_id=await type_id(db), page=None, uploads=images(2))
    assert store.objects == {}  # no row points to them


# ---- answering


async def test_a_failed_answer_leaves_no_screenshot_behind(db: AsyncSession, monkeypatch) -> None:
    store = MemoryStore()
    feedback = await sent(get_feedback_service(db, store), db)
    messages: MessageService = get_message_service(db, store)

    async def fail(self) -> None:
        raise RuntimeError("database down")

    monkeypatch.setattr(FeedbackMessageRepository, "commit", fail)
    with pytest.raises(RuntimeError):
        await messages.add_comment(ADA, feedback.id, body="hi", uploads=images(2))
    assert store.objects == {}


# ---- who may do what, below the routes


async def test_listing_everybodys_feedback_is_for_admins_only(db: AsyncSession) -> None:
    service = get_feedback_service(db, MemoryStore())
    with pytest.raises(NotAllowed):
        await service.list_page(ADA, everyone=True, status=None, type_id=None, limit=10, offset=0)
    rows, total = await service.list_page(ADMIN, everyone=True, status=None, type_id=None, limit=10, offset=0)
    assert (rows, total) == ([], 0)


async def test_changing_to_the_type_it_already_has_changes_nothing(db: AsyncSession) -> None:
    store = MemoryStore()
    feedback = await sent(get_feedback_service(db, store), db)
    before = feedback.updated_at
    changed = await get_workflow(db).change(ADMIN, feedback.id, status_id=None, type_id=feedback.type_id)
    assert changed.updated_at == before


async def test_a_status_the_app_needs_must_exist(db: AsyncSession) -> None:
    from app.routers.deps import get_status_service

    with pytest.raises(ReferenceNotFound):
        await get_status_service(db).get_by_key("no-such-key")
