import uuid
from typing import Annotated, Literal

from fastapi import Query

from app.config import settings


class ListParams:
    """The query of a list of feedback: filters, and the page. Shared by the user's list and the admin's."""

    def __init__(
        self,
        status: Annotated[Literal["open"] | uuid.UUID | None, Query(description="A status id, or `open`")] = None,
        type_id: uuid.UUID | None = None,
        limit: Annotated[int, Query(ge=1, le=settings.PAGE_SIZE_MAX)] = 10,
        offset: Annotated[int, Query(ge=0)] = 0,
    ) -> None:
        self.status = status
        self.type_id = type_id
        self.limit = limit
        self.offset = offset
