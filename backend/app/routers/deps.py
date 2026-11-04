"""How the services are built for a request. The only place that wires a database session and a store together."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import CurrentUser
from app.config import settings
from app.db import get_db
from app.repositories.feedback_statuses import FeedbackStatusRepository
from app.repositories.feedback_types import FeedbackTypeRepository
from app.repositories.user_profile import UserProfileRepository
from app.services.actor import Actor
from app.services.feedback_statuses import FeedbackStatusService
from app.services.feedback_types import FeedbackTypeService
from app.services.profile import ProfileService
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
