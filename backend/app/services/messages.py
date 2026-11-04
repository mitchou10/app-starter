import uuid
from dataclasses import dataclass
from datetime import UTC, datetime

from app.models import FeedbackMessage
from app.models.feedback_message import COMMENT
from app.repositories.feedback_messages import FeedbackMessageRepository
from app.services.access import FeedbackAccess
from app.services.actor import Actor
from app.services.attachments import AttachmentService
from app.services.cursor import decode_cursor, encode_cursor
from app.services.errors import EmptyMessage
from app.services.uploads import Upload


@dataclass(frozen=True)
class MessagePage:
    items: list[FeedbackMessage]  # oldest first, the way they are read
    total: int
    # Send it back as `before` to get the page of older messages; None when this one reaches the first message.
    next_before: str | None


class MessageService:
    """The follow-up of a feedback: read it by pages, answer."""

    def __init__(
        self, access: FeedbackAccess, messages: FeedbackMessageRepository, attachments: AttachmentService
    ) -> None:
        self._access = access
        self._messages = messages
        self._attachments = attachments

    async def page(self, actor: Actor, feedback_id: uuid.UUID, *, limit: int, before: str | None) -> MessagePage:
        """The newest `limit` messages, or the ones before the cursor `before`. Raises InvalidCursor."""
        await self._access.get_visible(actor, feedback_id)
        start = decode_cursor(before) if before else None
        items, has_more = await self._messages.latest(feedback_id, limit=limit, before=start)
        oldest = items[0] if items else None
        return MessagePage(
            items=items,
            total=await self._messages.count(feedback_id),
            next_before=encode_cursor(oldest.created_at, oldest.id) if has_more and oldest else None,
        )

    async def add_comment(
        self, actor: Actor, feedback_id: uuid.UUID, *, body: str, uploads: list[Upload]
    ) -> FeedbackMessage:
        """Raises EmptyMessage and the errors of the screenshots."""
        feedback = await self._access.get_visible(actor, feedback_id)
        body = body.strip()
        if not body:
            raise EmptyMessage
        screenshots = self._attachments.check(uploads)

        message = FeedbackMessage(
            id=uuid.uuid4(),
            feedback_id=feedback.id,
            kind=COMMENT,
            body=body,
            author_id=actor.user_id,
            author_username=actor.username,
            author_is_staff=actor.is_admin,
        )
        self._messages.add(message)
        await self._messages.flush()  # the screenshots point to it: it is written first
        keys = await self._attachments.save(actor, feedback.id, message.id, screenshots)
        feedback.updated_at = datetime.now(UTC)  # it moves to the top of the lists
        try:
            await self._messages.commit()
        except Exception:
            await self._attachments.discard(keys)
            raise
        created = await self._messages.get(message.id)
        assert created is not None
        return created
