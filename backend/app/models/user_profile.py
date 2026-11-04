from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class UserProfile(Base):
    """What the app knows about a user beyond the identity provider. The photo itself is in the object storage."""

    __tablename__ = "user_profiles"

    # The `sub` claim of the identity provider.
    user_id: Mapped[str] = mapped_column(String(255), primary_key=True)
    avatar_key: Mapped[str | None] = mapped_column(String(512))
    avatar_content_type: Mapped[str | None] = mapped_column(String(100))
    avatar_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    @property
    def avatar_version(self) -> int | None:
        """Changes with every new photo: the frontend puts it in the URL, so the browser never shows an old one."""
        if self.avatar_updated_at is None:
            return None
        return int(self.avatar_updated_at.timestamp() * 1000)
