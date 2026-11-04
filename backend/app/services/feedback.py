import uuid
from typing import Literal

from app.models import Feedback
from app.models.feedback_status import NEW
from app.repositories.feedback import FeedbackRepository, FeedbackRow
from app.services.access import FeedbackAccess
from app.services.actor import Actor
from app.services.attachments import AttachmentService
from app.services.errors import InvalidPage, NotAllowed
from app.services.feedback_statuses import FeedbackStatusService
from app.services.feedback_types import FeedbackTypeService
from app.services.uploads import Upload
from app.storage import StoredObject


class FeedbackService:
    """Send a feedback, read one, list them."""

    def __init__(
        self,
        feedbacks: FeedbackRepository,
        access: FeedbackAccess,
        types: FeedbackTypeService,
        statuses: FeedbackStatusService,
        attachments: AttachmentService,
    ) -> None:
        self._feedbacks = feedbacks
        self._access = access
        self._types = types
        self._statuses = statuses
        self._attachments = attachments

    async def create(
        self,
        actor: Actor,
        *,
        title: str,
        description: str,
        type_id: uuid.UUID,
        page: str | None,
        uploads: list[Upload],
    ) -> Feedback:
        """Raises InvalidReference or ReferenceArchived (the type), InvalidPage, and the errors of the screenshots."""
        feedback_type = await self._types.resolve(type_id)
        status = await self._statuses.get_by_key(NEW)
        if page is not None and not (page.startswith("/") and not page.startswith("//")):
            raise InvalidPage
        screenshots = self._attachments.check(uploads)  # all checked before anything is stored

        feedback = Feedback(
            id=uuid.uuid4(),
            title=title,
            description=description,
            type_id=feedback_type.id,
            status_id=status.id,
            created_by=actor.user_id,
            created_by_username=actor.username,
            page_path=page,
        )
        self._feedbacks.add(feedback)
        await self._feedbacks.flush()  # the screenshots point to it: it is written first
        keys = await self._attachments.save(actor, feedback.id, None, screenshots)
        try:
            await self._feedbacks.commit()
        except Exception:
            await self._attachments.discard(keys)  # no row points to them
            raise
        return await self.get(actor, feedback.id)

    async def get(self, actor: Actor, feedback_id: uuid.UUID) -> Feedback:
        return await self._access.get_visible(actor, feedback_id)

    async def get_screenshot(self, actor: Actor, feedback_id: uuid.UUID, attachment_id: uuid.UUID) -> StoredObject:
        """A screenshot, for whoever may see its feedback."""
        await self._access.get_visible(actor, feedback_id)
        return await self._attachments.read(feedback_id, attachment_id)

    async def list_page(
        self,
        actor: Actor,
        *,
        everyone: bool,
        status: Literal["open"] | uuid.UUID | None,
        type_id: uuid.UUID | None,
        limit: int,
        offset: int,
    ) -> tuple[list[FeedbackRow], int]:
        """The feedback of the actor, or (`everyone`, admins only) all of it."""
        if everyone and not actor.is_admin:
            raise NotAllowed
        return await self._feedbacks.page(
            author_id=None if everyone else actor.user_id, status=status, type_id=type_id, limit=limit, offset=offset
        )
