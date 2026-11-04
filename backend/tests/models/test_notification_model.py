import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Notification


@pytest.mark.parametrize("url", ["javascript:alert(1)", "//evil.example", "ftp://x", "evil.example", ""])
async def test_the_database_refuses_a_link_that_is_not_a_path_or_an_http_address(db: AsyncSession, url: str) -> None:
    db.add(Notification(user_id="u1", source="s", title="t", url=url))
    with pytest.raises(IntegrityError):
        await db.commit()


@pytest.mark.parametrize("url", [None, "/a", "/a?b=1", "http://x", "https://x/y"])
async def test_the_database_accepts_these_links(db: AsyncSession, url: str | None) -> None:
    db.add(Notification(user_id="u1", source="s", title="t", url=url))
    await db.commit()


async def test_a_notification_is_unread_until_it_has_a_read_date(db: AsyncSession) -> None:
    notification = Notification(user_id="u1", source="s", title="t")
    db.add(notification)
    await db.commit()
    assert notification.read is False
