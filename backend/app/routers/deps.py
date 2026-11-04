"""How the services are built for a request. The only place that wires a database session and a store together."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.repositories.user_profile import UserProfileRepository
from app.services.profile import ProfileService
from app.storage import ObjectStore, get_store


def get_profile_service(
    db: Annotated[AsyncSession, Depends(get_db)],
    store: Annotated[ObjectStore, Depends(get_store)],
) -> ProfileService:
    return ProfileService(UserProfileRepository(db), store, settings.AVATAR_MAX_BYTES)


ProfileServiceDep = Annotated[ProfileService, Depends(get_profile_service)]
