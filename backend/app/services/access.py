import uuid

from app.models import Feedback
from app.repositories.feedback import FeedbackRepository
from app.services.actor import Actor
from app.services.errors import FeedbackNotFound


class FeedbackAccess:
    """Who may see which feedback: its author, and the admins."""

    def __init__(self, feedbacks: FeedbackRepository) -> None:
        self._feedbacks = feedbacks

    async def get_visible(self, actor: Actor, feedback_id: uuid.UUID) -> Feedback:
        """The feedback, or FeedbackNotFound: somebody else's looks exactly like one that does not exist."""
        feedback = await self._feedbacks.get(feedback_id)
        if feedback is None or not (actor.is_admin or feedback.created_by == actor.user_id):
            raise FeedbackNotFound
        return feedback
