import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select, update

from app.models import Notification
from app.repositories.base import Repository


class NotificationRepository(Repository):
    def add_all(self, notifications: list[Notification]) -> None:
        self._db.add_all(notifications)

    async def get(self, user_id: str, notification_id: uuid.UUID) -> Notification | None:
        """Looked up with its recipient: somebody else's notification finds nothing."""
        result = await self._db.execute(
            select(Notification).where(Notification.id == notification_id, Notification.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def page(self, user_id: str, *, unread_only: bool, limit: int, offset: int) -> tuple[list[Notification], int]:
        """One page of the user's notifications, the newest first, and how many there are in all."""
        conditions = [Notification.user_id == user_id]
        if unread_only:
            conditions.append(Notification.read_at.is_(None))
        rows = await self._db.execute(
            select(Notification)
            .where(*conditions)
            .order_by(Notification.created_at.desc(), Notification.id.desc())
            .limit(limit)
            .offset(offset)
        )
        total = await self._db.execute(select(func.count()).select_from(Notification).where(*conditions))
        return list(rows.scalars().all()), total.scalar_one()

    async def unread_count(self, user_id: str) -> int:
        result = await self._db.execute(
            select(func.count())
            .select_from(Notification)
            .where(Notification.user_id == user_id, Notification.read_at.is_(None))
        )
        return result.scalar_one()

    async def mark_all_read(self, user_id: str) -> int:
        """Reads everything unread of the user, and says how many that was."""
        result = await self._db.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.read_at.is_(None))
            .values(read_at=datetime.now(UTC))
        )
        await self._db.commit()
        return result.rowcount  # ty: ignore[unresolved-attribute]
