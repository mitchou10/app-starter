from app.models import FeedbackStatus
from app.models.feedback_status import PROTECTED_KEYS
from app.repositories.feedback_statuses import FeedbackStatusRepository
from app.services.errors import ProtectedStatus, ReferenceNotFound
from app.services.reference import ReferenceService


class FeedbackStatusService(ReferenceService[FeedbackStatus]):
    def __init__(self, repository: FeedbackStatusRepository) -> None:
        super().__init__(repository)
        self._statuses = repository

    def _before_archiving(self, item: FeedbackStatus) -> None:
        # The app puts `new` on every feedback it receives and `closed` when an author closes one.
        if item.key in PROTECTED_KEYS:
            raise ProtectedStatus

    async def get_by_key(self, key: str) -> FeedbackStatus:
        """A status the app itself uses (see models/feedback_status.py)."""
        status = await self._statuses.get_by_key(key)
        if status is None:
            raise ReferenceNotFound
        return status
