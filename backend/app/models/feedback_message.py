import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Index, String, Text, Uuid, false, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.feedback_attachment import FeedbackAttachment

COMMENT = "comment"
STATUS_CHANGE = "status_change"


class FeedbackMessage(Base):
    """The follow-up of a feedback: answers and changes of status, in one list so the timeline is one query."""

    __tablename__ = "feedback_messages"
    __table_args__ = (
        CheckConstraint("kind IN ('comment', 'status_change')", name="kind"),
        # A change of status says which status it moved to; an answer does not.
        CheckConstraint("(kind = 'status_change') = (new_status_id IS NOT NULL)", name="status_change_has_new_status"),
        CheckConstraint("kind <> 'comment' OR length(body) > 0", name="comment_has_body"),
        Index("ix_feedback_messages_feedback_id_created_at", "feedback_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    feedback_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("feedbacks.id", ondelete="CASCADE"))
    kind: Mapped[str] = mapped_column(String(20))
    body: Mapped[str] = mapped_column(Text, default="", server_default="")
    author_id: Mapped[str] = mapped_column(String(255))
    author_username: Mapped[str] = mapped_column(String(255))
    # Whether the author was an admin when they wrote it: it is the team answering.
    author_is_staff: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false())
    old_status_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("feedback_statuses.id"))
    new_status_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("feedback_statuses.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    attachments: Mapped[list["FeedbackAttachment"]] = relationship(
        "FeedbackAttachment",
        primaryjoin="FeedbackAttachment.message_id == FeedbackMessage.id",
        order_by="FeedbackAttachment.created_at",
        viewonly=True,
        lazy="raise",
    )
