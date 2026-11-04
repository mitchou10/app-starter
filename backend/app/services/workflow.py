import uuid
from datetime import UTC, datetime

from app.models import Feedback, FeedbackMessage, FeedbackStatus
from app.models.feedback_message import STATUS_CHANGE
from app.models.feedback_status import CLOSED, NEW
from app.repositories.feedback import FeedbackRepository
from app.repositories.feedback_messages import FeedbackMessageRepository
from app.services.access import FeedbackAccess
from app.services.actor import Actor
from app.services.errors import NotAllowed
from app.services.feedback_statuses import FeedbackStatusService
from app.services.feedback_types import FeedbackTypeService


class FeedbackWorkflow:
    """Move a feedback forward: its status and its type.

    Admins change both freely. An author can only close their own feedback, or reopen it: they decide whether their
    question is settled, not how the team organizes its work."""

    def __init__(
        self,
        access: FeedbackAccess,
        feedbacks: FeedbackRepository,
        messages: FeedbackMessageRepository,
        types: FeedbackTypeService,
        statuses: FeedbackStatusService,
    ) -> None:
        self._access = access
        self._feedbacks = feedbacks
        self._messages = messages
        self._types = types
        self._statuses = statuses

    async def change(
        self, actor: Actor, feedback_id: uuid.UUID, *, status_id: uuid.UUID | None, type_id: uuid.UUID | None
    ) -> Feedback:
        feedback = await self._access.get_visible(actor, feedback_id)
        changed = False
        if type_id is not None:
            changed |= await self._set_type(actor, feedback, type_id)
        if status_id is not None:
            changed |= await self._set_status(actor, feedback, status_id)
        if changed:
            feedback.updated_at = datetime.now(UTC)
            await self._feedbacks.commit()
        return feedback

    async def _set_type(self, actor: Actor, feedback: Feedback, type_id: uuid.UUID) -> bool:
        if not actor.is_admin:
            raise NotAllowed
        feedback_type = await self._types.resolve(type_id)
        if feedback_type.id == feedback.type_id:
            return False
        feedback.type_id = feedback_type.id
        return True

    async def _set_status(self, actor: Actor, feedback: Feedback, status_id: uuid.UUID) -> bool:
        target = await self._statuses.resolve(status_id)
        if target.id == feedback.status_id:
            return False
        current = await self._statuses.get(feedback.status_id)
        if not actor.is_admin and not _author_may_move(current, target):
            raise NotAllowed
        # Written in the follow-up, so the timeline tells how the feedback went.
        self._messages.add(
            FeedbackMessage(
                id=uuid.uuid4(),
                feedback_id=feedback.id,
                kind=STATUS_CHANGE,
                author_id=actor.user_id,
                author_username=actor.username,
                author_is_staff=actor.is_admin,
                old_status_id=current.id,
                new_status_id=target.id,
            )
        )
        feedback.status_id = target.id
        return True


def _author_may_move(current: FeedbackStatus, target: FeedbackStatus) -> bool:
    closing = target.key == CLOSED and not current.is_closed
    reopening = target.key == NEW and current.is_closed
    return closing or reopening
