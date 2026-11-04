import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.feedback_attachment import FeedbackAttachment


class Feedback(Base):
    __tablename__ = "feedbacks"
    __table_args__ = (Index("ix_feedbacks_updated_at", "updated_at"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    type_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("feedback_types.id"), index=True)
    status_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("feedback_statuses.id"), index=True)
    # The `sub` claim of the identity provider, and the name the author had when they wrote it (there is no users
    # table: the identity provider owns the accounts, so what was shown then is kept).
    created_by: Mapped[str] = mapped_column(String(255), index=True)
    created_by_username: Mapped[str] = mapped_column(String(255))
    # The page the author was on, when they agreed to attach it.
    page_path: Mapped[str | None] = mapped_column(String(2048))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # The screenshots of the feedback itself (those of a message hang on the message). Loaded on purpose, never lazily.
    attachments: Mapped[list["FeedbackAttachment"]] = relationship(
        "FeedbackAttachment",
        primaryjoin="and_(FeedbackAttachment.feedback_id == Feedback.id, FeedbackAttachment.message_id.is_(None))",
        order_by="FeedbackAttachment.created_at",
        viewonly=True,
        lazy="raise",
    )
