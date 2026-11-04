import uuid
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

UserId = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=255)]


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    # The application that emitted it.
    source: str
    title: str
    description: str
    # A path of this app (opened in the app) or the address of another application (opened elsewhere); none: no link.
    url: str | None
    created_at: datetime
    read: bool
    read_at: datetime | None


class UnreadCountOut(BaseModel):
    count: int


class NotificationRead(BaseModel):
    """What to set: read, or unread again."""

    read: bool


class MarkedReadOut(BaseModel):
    updated: int


class NotificationIn(BaseModel):
    """What an application sends to tell users something: the same words for each of them."""

    # Who is told (the `sub` of each user): up to 500 at once, each only once.
    user_ids: list[UserId] = Field(min_length=1, max_length=500)
    title: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
    description: Annotated[str, StringConstraints(strip_whitespace=True, max_length=2000)] = ""
    url: Annotated[str | None, StringConstraints(max_length=2048)] = None


class EmittedOut(BaseModel):
    created: int
