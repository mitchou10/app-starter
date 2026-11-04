from pydantic import BaseModel


class Upload(BaseModel):
    """A file a request brought, already read: the services never see the web framework's file objects."""

    filename: str
    data: bytes
