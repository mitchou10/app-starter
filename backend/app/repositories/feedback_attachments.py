import uuid

from sqlalchemy import select

from app.models import FeedbackAttachment
from app.repositories.base import Repository


class FeedbackAttachmentRepository(Repository):
    def add(self, attachment: FeedbackAttachment) -> None:
        self._db.add(attachment)

    async def get(self, feedback_id: uuid.UUID, attachment_id: uuid.UUID) -> FeedbackAttachment | None:
        """Looked up with its feedback: an id of another feedback's screenshot finds nothing."""
        result = await self._db.execute(
            select(FeedbackAttachment).where(
                FeedbackAttachment.id == attachment_id, FeedbackAttachment.feedback_id == feedback_id
            )
        )
        return result.scalar_one_or_none()
