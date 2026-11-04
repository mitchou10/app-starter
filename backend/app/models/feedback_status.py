import uuid

from sqlalchemy import Boolean, CheckConstraint, String, Uuid, false
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.reference import TONE_CHECK, ReferenceColumns

# The two statuses the app itself puts on a feedback, found by their key so an admin can rename them.
NEW = "new"  # a feedback that was just sent, or that its author reopened
CLOSED = "closed"  # a feedback its author closed
PROTECTED_KEYS = (NEW, CLOSED)


class FeedbackStatus(ReferenceColumns, Base):
    """New, In review, Done... The first ones come with the migration, an admin adds the others."""

    __tablename__ = "feedback_statuses"
    __table_args__ = (CheckConstraint(TONE_CHECK, name="tone"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    # Stable name of a status the app depends on (see NEW and CLOSED); none for the ones an admin adds.
    key: Mapped[str | None] = mapped_column(String(30), unique=True)
    # A closed status is a final one: the feedback is done with.
    is_closed: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false())
