"""How the services are built for a request. The only place that wires a database session and a store together."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import CurrentUser
from app.config import settings
from app.db import get_db
from app.repositories.feedback import FeedbackRepository
from app.repositories.feedback_attachments import FeedbackAttachmentRepository
from app.repositories.feedback_messages import FeedbackMessageRepository
from app.repositories.feedback_statuses import FeedbackStatusRepository
from app.repositories.feedback_types import FeedbackTypeRepository
from app.repositories.user_profile import UserProfileRepository
from app.services.access import FeedbackAccess
from app.services.actor import Actor
from app.services.attachments import AttachmentService
from app.services.feedback import FeedbackService
from app.services.feedback_statuses import FeedbackStatusService
from app.services.feedback_types import FeedbackTypeService
from app.services.messages import MessageService
from app.services.profile import ProfileService
from app.services.workflow import FeedbackWorkflow
from app.storage import ObjectStore, get_store


def get_profile_service(
    db: Annotated[AsyncSession, Depends(get_db)],
    store: Annotated[ObjectStore, Depends(get_store)],
) -> ProfileService:
    return ProfileService(UserProfileRepository(db), store, settings.AVATAR_MAX_BYTES)


ProfileServiceDep = Annotated[ProfileService, Depends(get_profile_service)]


def get_actor(user: CurrentUser) -> Actor:
    """The logged-in user as the services see them. The name falls back on what the provider gives."""
    return Actor(user_id=user.user_id, username=user.username or user.name or user.user_id, is_admin=user.is_admin)


ActorDep = Annotated[Actor, Depends(get_actor)]


def get_type_service(db: Annotated[AsyncSession, Depends(get_db)]) -> FeedbackTypeService:
    return FeedbackTypeService(FeedbackTypeRepository(db))


def get_status_service(db: Annotated[AsyncSession, Depends(get_db)]) -> FeedbackStatusService:
    return FeedbackStatusService(FeedbackStatusRepository(db))


TypeServiceDep = Annotated[FeedbackTypeService, Depends(get_type_service)]
StatusServiceDep = Annotated[FeedbackStatusService, Depends(get_status_service)]


DB = Annotated[AsyncSession, Depends(get_db)]
Store = Annotated[ObjectStore, Depends(get_store)]


def _attachments(db: AsyncSession, store: ObjectStore) -> AttachmentService:
    return AttachmentService(
        FeedbackAttachmentRepository(db),
        store,
        max_files=settings.FEEDBACK_MAX_ATTACHMENTS,
        max_bytes=settings.FEEDBACK_ATTACHMENT_MAX_BYTES,
    )


def get_feedback_service(db: DB, store: Store) -> FeedbackService:
    feedbacks = FeedbackRepository(db)
    return FeedbackService(
        feedbacks,
        FeedbackAccess(feedbacks),
        FeedbackTypeService(FeedbackTypeRepository(db)),
        FeedbackStatusService(FeedbackStatusRepository(db)),
        _attachments(db, store),
    )


def get_workflow(db: DB) -> FeedbackWorkflow:
    feedbacks = FeedbackRepository(db)
    return FeedbackWorkflow(
        FeedbackAccess(feedbacks),
        feedbacks,
        FeedbackMessageRepository(db),
        FeedbackTypeService(FeedbackTypeRepository(db)),
        FeedbackStatusService(FeedbackStatusRepository(db)),
    )


def get_message_service(db: DB, store: Store) -> MessageService:
    return MessageService(
        FeedbackAccess(FeedbackRepository(db)), FeedbackMessageRepository(db), _attachments(db, store)
    )


FeedbackServiceDep = Annotated[FeedbackService, Depends(get_feedback_service)]
WorkflowDep = Annotated[FeedbackWorkflow, Depends(get_workflow)]
MessageServiceDep = Annotated[MessageService, Depends(get_message_service)]
