import uuid
from datetime import UTC, datetime

from app.models import Notification
from app.repositories.notifications import NotificationRepository
from app.services.errors import InvalidUrl, NotificationNotFound


def check_url(url: str | None) -> str | None:
    """A link is a path of this app, or an http(s) address of another application. Nothing else is followed."""
    if url is None:
        return None
    url = url.strip()
    if not url:
        return None
    is_path = url.startswith("/") and not url.startswith("//")
    if not (is_path or url.startswith(("http://", "https://"))):
        raise InvalidUrl
    return url


class NotificationService:
    """What a user is told: read it, mark it read, and (for the applications that emit them) send it."""

    def __init__(self, notifications: NotificationRepository) -> None:
        self._notifications = notifications

    async def emit(self, source: str, *, user_ids: list[str], title: str, description: str, url: str | None) -> int:
        """Tells each of the users, once even if they are listed twice. Returns how many were told."""
        url = check_url(url)
        recipients = list(dict.fromkeys(user_ids))  # no duplicates, the order kept
        self._notifications.add_all(
            [
                Notification(
                    id=uuid.uuid4(), user_id=user_id, source=source, title=title, description=description, url=url
                )
                for user_id in recipients
            ]
        )
        await self._notifications.commit()
        return len(recipients)

    async def page(self, user_id: str, *, unread_only: bool, limit: int, offset: int) -> tuple[list[Notification], int]:
        return await self._notifications.page(user_id, unread_only=unread_only, limit=limit, offset=offset)

    async def unread_count(self, user_id: str) -> int:
        return await self._notifications.unread_count(user_id)

    async def set_read(self, user_id: str, notification_id: uuid.UUID, *, read: bool) -> Notification:
        """Marks one read, or unread. Raises NotificationNotFound if it is not the user's."""
        notification = await self._notifications.get(user_id, notification_id)
        if notification is None:
            raise NotificationNotFound
        if read and not notification.read:
            notification.read_at = datetime.now(UTC)
        elif not read:
            notification.read_at = None
        await self._notifications.commit()
        return notification

    async def mark_all_read(self, user_id: str) -> int:
        return await self._notifications.mark_all_read(user_id)
