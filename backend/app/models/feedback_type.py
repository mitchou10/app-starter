import uuid

from sqlalchemy import CheckConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.reference import TONE_CHECK, ReferenceColumns


class FeedbackType(ReferenceColumns, Base):
    """Bug, Suggestion, Question... The first ones come with the migration, an admin adds the others."""

    __tablename__ = "feedback_types"
    __table_args__ = (CheckConstraint(TONE_CHECK, name="tone"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
