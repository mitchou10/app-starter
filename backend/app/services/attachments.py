import os
import uuid

from pydantic import BaseModel

from app.models import FeedbackAttachment
from app.repositories.feedback_attachments import FeedbackAttachmentRepository
from app.services.actor import Actor
from app.services.errors import AttachmentNotFound, TooManyAttachments
from app.services.images import validate_image
from app.services.uploads import Upload
from app.storage import ObjectStore, StoredObject


class Checked(BaseModel):
    """A screenshot that passed the checks, ready to be stored."""

    filename: str
    data: bytes
    content_type: str


class AttachmentService:
    """The screenshots of a feedback or of an answer. Checks them all first, then stores them: a bad one among five
    must not leave the other four in the storage."""

    def __init__(
        self, attachments: FeedbackAttachmentRepository, store: ObjectStore, *, max_files: int, max_bytes: int
    ) -> None:
        self._attachments = attachments
        self._store = store
        self._max_files = max_files
        self._max_bytes = max_bytes

    def check(self, uploads: list[Upload]) -> list[Checked]:
        """Raises TooManyAttachments, ImageTooLarge or UnsupportedImage; nothing is stored yet."""
        if len(uploads) > self._max_files:
            raise TooManyAttachments
        return [
            Checked(
                filename=os.path.basename(upload.filename) or "screenshot",
                data=upload.data,
                content_type=validate_image(upload.data, self._max_bytes),
            )
            for upload in uploads
        ]

    async def save(
        self, actor: Actor, feedback_id: uuid.UUID, message_id: uuid.UUID | None, files: list[Checked]
    ) -> list[str]:
        """Puts the images in the storage and adds their rows (committed by the caller). Returns the keys, so the
        caller can `discard` them if the commit fails."""
        keys: list[str] = []
        try:
            for file in files:
                key = f"feedback/{feedback_id}/{uuid.uuid4().hex}"
                await self._store.put(key, file.data, file.content_type)
                keys.append(key)
                self._attachments.add(
                    FeedbackAttachment(
                        feedback_id=feedback_id,
                        message_id=message_id,
                        storage_key=key,
                        filename=file.filename[:255],
                        content_type=file.content_type,
                        size_bytes=len(file.data),
                        created_by=actor.user_id,
                    )
                )
        except Exception:
            await self.discard(keys)
            raise
        return keys

    async def discard(self, keys: list[str]) -> None:
        """Takes images back out of the storage, after something failed."""
        for key in keys:
            await self._store.delete(key)

    async def read(self, feedback_id: uuid.UUID, attachment_id: uuid.UUID) -> StoredObject:
        attachment = await self._attachments.get(feedback_id, attachment_id)
        if attachment is None:
            raise AttachmentNotFound
        stored = await self._store.get(attachment.storage_key)
        if stored is None:
            raise AttachmentNotFound
        return StoredObject(data=stored.data, content_type=attachment.content_type)
