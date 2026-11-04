from typing import Protocol

from pydantic import BaseModel, ConfigDict


class StoredObject(BaseModel):
    model_config = ConfigDict(frozen=True)

    data: bytes
    content_type: str


class ObjectStore(Protocol):
    """What the services need from an object storage. Nothing here is specific to S3."""

    async def put(self, key: str, data: bytes, content_type: str) -> None: ...

    async def get(self, key: str) -> StoredObject | None:
        """The object, or None when it does not exist."""
        ...

    async def delete(self, key: str) -> None: ...
