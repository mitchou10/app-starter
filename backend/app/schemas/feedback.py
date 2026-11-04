import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.repositories.feedback import FeedbackRow
from app.schemas.attachment import AttachmentOut


class FeedbackOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: str
    type_id: uuid.UUID
    status_id: uuid.UUID
    created_by: str
    created_by_username: str
    # The page the author was on, when they attached it.
    page: str | None = Field(validation_alias="page_path")
    created_at: datetime
    updated_at: datetime
    attachments: list[AttachmentOut]


class FeedbackSummaryOut(BaseModel):
    """A line of a list: no description, no screenshots."""

    id: uuid.UUID
    title: str
    type_id: uuid.UUID
    status_id: uuid.UUID
    created_by: str
    created_by_username: str
    created_at: datetime
    updated_at: datetime
    # Answers only: the changes of status do not count.
    replies_count: int

    @classmethod
    def from_row(cls, row: FeedbackRow) -> "FeedbackSummaryOut":
        feedback = row.feedback
        return cls(
            id=feedback.id,
            title=feedback.title,
            type_id=feedback.type_id,
            status_id=feedback.status_id,
            created_by=feedback.created_by,
            created_by_username=feedback.created_by_username,
            created_at=feedback.created_at,
            updated_at=feedback.updated_at,
            replies_count=row.replies,
        )


class FeedbackChange(BaseModel):
    """What to change: the fields that are not sent stay as they are, and at least one is needed."""

    status_id: uuid.UUID | None = None
    type_id: uuid.UUID | None = None

    @model_validator(mode="after")
    def something_to_change(self) -> "FeedbackChange":
        if self.status_id is None and self.type_id is None:
            raise ValueError("Send a status_id, a type_id or both")
        return self
