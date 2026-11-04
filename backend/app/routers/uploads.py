from fastapi import UploadFile

from app.config import settings
from app.services.errors import TooManyAttachments
from app.services.uploads import Upload


async def read_uploads(files: list[UploadFile] | None) -> list[Upload]:
    """The files of a request, read, never more than the limit per file (a huge one must not end up in memory)."""
    files = files or []
    if len(files) > settings.FEEDBACK_MAX_ATTACHMENTS:
        raise TooManyAttachments
    return [
        Upload(filename=file.filename or "", data=await file.read(settings.FEEDBACK_ATTACHMENT_MAX_BYTES + 1))
        for file in files
    ]
