import uuid
from dataclasses import dataclass
from typing import Literal

from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.models import Feedback, FeedbackMessage, FeedbackStatus
from app.models.feedback_message import COMMENT
from app.repositories.base import Repository


@dataclass(frozen=True)
class FeedbackRow:
    """A feedback as the list shows it: with how many answers it got (the changes of status do not count)."""

    feedback: Feedback
    replies: int


class FeedbackRepository(Repository):
    def add(self, feedback: Feedback) -> None:
        self._db.add(feedback)

    async def get(self, feedback_id: uuid.UUID) -> Feedback | None:
        """With its screenshots loaded: nothing is loaded lazily."""
        result = await self._db.execute(
            select(Feedback).where(Feedback.id == feedback_id).options(selectinload(Feedback.attachments))
        )
        return result.scalar_one_or_none()

    async def page(
        self,
        *,
        author_id: str | None,
        status: Literal["open"] | uuid.UUID | None,
        type_id: uuid.UUID | None,
        limit: int,
        offset: int,
    ) -> tuple[list[FeedbackRow], int]:
        """One page of the list, the most recently updated first, and how many there are in all.

        `author_id` limits to one person's feedback, `status` is a status or "open" (every status that is not final)."""
        conditions = []
        if author_id is not None:
            conditions.append(Feedback.created_by == author_id)
        if status == "open":
            final = select(FeedbackStatus.id).where(FeedbackStatus.is_closed.is_(True))
            conditions.append(Feedback.status_id.not_in(final))
        elif status is not None:
            conditions.append(Feedback.status_id == status)
        if type_id is not None:
            conditions.append(Feedback.type_id == type_id)

        replies = (
            select(func.count())
            .where(FeedbackMessage.feedback_id == Feedback.id, FeedbackMessage.kind == COMMENT)
            .correlate(Feedback)
            .scalar_subquery()
        )
        rows = await self._db.execute(
            select(Feedback, replies)
            .where(*conditions)
            .order_by(Feedback.updated_at.desc(), Feedback.id.desc())
            .limit(limit)
            .offset(offset)
        )
        total = await self._db.execute(select(func.count()).select_from(Feedback).where(*conditions))
        return [FeedbackRow(feedback, count) for feedback, count in rows.all()], total.scalar_one()
