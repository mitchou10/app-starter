import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.schemas.attachment import AttachmentOut


class MessageOut(BaseModel):
    """An answer, or a change of status (then `body` is empty and `old_status_id` and `new_status_id` say which)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    kind: Literal["comment", "status_change"]
    body: str
    author_username: str
    author_is_staff: bool
    created_at: datetime
    old_status_id: uuid.UUID | None
    new_status_id: uuid.UUID | None
    attachments: list[AttachmentOut]


class MessagesPageOut(BaseModel):
    items: list[MessageOut]  # oldest first
    total: int
    # Pass it as `before` to get the older messages; null when there are no more.
    next_before: str | None
