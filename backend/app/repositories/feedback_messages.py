import uuid
from datetime import datetime

from sqlalchemy import func, select, tuple_
from sqlalchemy.orm import selectinload

from app.models import FeedbackMessage
from app.repositories.base import Repository


class FeedbackMessageRepository(Repository):
    def add(self, message: FeedbackMessage) -> None:
        self._db.add(message)

    async def get(self, message_id: uuid.UUID) -> FeedbackMessage | None:
        result = await self._db.execute(
            select(FeedbackMessage)
            .where(FeedbackMessage.id == message_id)
            .options(selectinload(FeedbackMessage.attachments))
        )
        return result.scalar_one_or_none()

    async def latest(
        self, feedback_id: uuid.UUID, *, limit: int, before: tuple[datetime, uuid.UUID] | None
    ) -> tuple[list[FeedbackMessage], bool]:
        """The `limit` messages just before `before` (the newest ones when it is None), oldest first, and whether
        there are older ones. Keyset pagination on (created_at, id): a message added meanwhile moves nothing."""
        query = select(FeedbackMessage).where(FeedbackMessage.feedback_id == feedback_id)
        if before is not None:
            query = query.where(tuple_(FeedbackMessage.created_at, FeedbackMessage.id) < tuple_(*before))
        result = await self._db.execute(
            query.options(selectinload(FeedbackMessage.attachments))
            .order_by(FeedbackMessage.created_at.desc(), FeedbackMessage.id.desc())
            .limit(limit + 1)  # one more, to know whether there is a page before
        )
        found = list(result.scalars().all())
        return found[:limit][::-1], len(found) > limit

    async def count(self, feedback_id: uuid.UUID) -> int:
        result = await self._db.execute(
            select(func.count()).select_from(FeedbackMessage).where(FeedbackMessage.feedback_id == feedback_id)
        )
        return result.scalar_one()
