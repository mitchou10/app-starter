import uuid
from collections.abc import Sequence

from sqlalchemy import func, select

from app.models import FeedbackStatus, FeedbackType
from app.repositories.base import Repository


class ReferenceRepository[M: (FeedbackType, FeedbackStatus)](Repository):
    """The queries the types and the statuses have in common. A subclass names its model."""

    model: type[M]

    async def list(self) -> Sequence[M]:
        result = await self._db.execute(select(self.model).order_by(self.model.position, self.model.name))
        return result.scalars().all()

    async def get(self, item_id: uuid.UUID) -> M | None:
        return await self._db.get(self.model, item_id)

    async def find_by_name(self, name: str) -> M | None:
        """Names are unique whatever their case."""
        result = await self._db.execute(select(self.model).where(func.lower(self.model.name) == name.lower()))
        return result.scalar_one_or_none()

    async def next_position(self) -> int:
        result = await self._db.execute(select(func.coalesce(func.max(self.model.position), 0)))
        return result.scalar_one() + 1

    def add(self, item: M) -> None:
        self._db.add(item)
