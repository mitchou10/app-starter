import uuid
from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

Tone = Literal["gray", "blue", "green", "amber", "red", "violet"]
Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=60)]
Description = Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)]


class FeedbackTypeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str
    tone: Tone
    position: int
    created_by: str | None
    created_by_username: str | None
    created_at: datetime
    archived: bool


class FeedbackStatusOut(FeedbackTypeOut):
    key: str | None
    is_closed: bool


class FeedbackTypeIn(BaseModel):
    name: Name
    description: Description = ""
    tone: Tone = "gray"


class FeedbackStatusIn(FeedbackTypeIn):
    is_closed: bool = False


class FeedbackTypeUpdate(BaseModel):
    """What to change: the fields that are not sent stay as they are."""

    name: Name | None = None
    description: Description | None = None
    tone: Tone | None = None
    position: int | None = Field(default=None, ge=0)
    archived: bool | None = None


class FeedbackStatusUpdate(FeedbackTypeUpdate):
    is_closed: bool | None = None
