import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Index, String, Text, Uuid, func, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base

# A link is a path of this app, or an address of another application. Nothing else: not `javascript:`, not `//host`.
URL_CHECK = "url IS NULL OR (url LIKE '/%' AND url NOT LIKE '//%') OR url LIKE 'http://%' OR url LIKE 'https://%'"


class Notification(Base):
    """Something an application tells a user. One row per recipient: each has their own read state."""

    __tablename__ = "notifications"
    __table_args__ = (
        CheckConstraint(URL_CHECK, name="url"),
        Index("ix_notifications_user_id_created_at", "user_id", "created_at"),
        # The badge counts the unread ones all the time: only those are indexed.
        Index("ix_notifications_unread", "user_id", postgresql_where=text("read_at IS NULL")),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    # The recipient: the `sub` claim of the identity provider.
    user_id: Mapped[str] = mapped_column(String(255))
    # The application that emitted it, known by its API key (an emitter cannot claim to be another).
    source: Mapped[str] = mapped_column(String(100))
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="", server_default="")
    # Where it leads: a path of this app or the address of another application. None: nothing to open.
    url: Mapped[str | None] = mapped_column(String(2048))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    # When the user read it; None while it is unread.
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    @property
    def read(self) -> bool:
        return self.read_at is not None
