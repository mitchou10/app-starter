from sqlalchemy import select

from app.models import FeedbackStatus
from app.repositories.reference import ReferenceRepository


class FeedbackStatusRepository(ReferenceRepository[FeedbackStatus]):
    model = FeedbackStatus

    async def get_by_key(self, key: str) -> FeedbackStatus | None:
        result = await self._db.execute(select(FeedbackStatus).where(FeedbackStatus.key == key))
        return result.scalar_one_or_none()
