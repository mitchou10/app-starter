import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, computed_field


class AttachmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    feedback_id: uuid.UUID = Field(exclude=True)
    filename: str
    content_type: str
    size_bytes: int
    created_at: datetime

    @computed_field
    @property
    def url(self) -> str:
        """Where the image is served from: it needs a login and the right to see the feedback."""
        return f"/api/feedback/{self.feedback_id}/attachments/{self.id}"
