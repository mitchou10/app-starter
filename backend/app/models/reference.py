from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

TONES = ("gray", "blue", "green", "amber", "red", "violet")
TONE_CHECK = "tone IN ('gray', 'blue', 'green', 'amber', 'red', 'violet')"


class ReferenceColumns:
    """What the feedback types and the feedback statuses have in common: a value an admin can add to or archive."""

    name: Mapped[str] = mapped_column(String(60), unique=True)
    description: Mapped[str] = mapped_column(String(500), default="", server_default="")
    # The color of the badge in the frontend.
    tone: Mapped[str] = mapped_column(String(20), default="gray", server_default="gray")
    # Display order, smallest first.
    position: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    # Who added it (the `sub` claim and the name they had), and when. None for the values shipped with the app.
    created_by: Mapped[str | None] = mapped_column(String(255))
    created_by_username: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    # Archived values stay on the feedback that has them, but are no longer offered.
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    @property
    def archived(self) -> bool:
        return self.archived_at is not None
