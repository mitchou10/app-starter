from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import UserProfile


class UserProfileRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get(self, user_id: str) -> UserProfile | None:
        return await self._db.get(UserProfile, user_id)

    async def set_avatar(self, user_id: str, key: str, content_type: str) -> UserProfile:
        profile = await self.get(user_id) or UserProfile(user_id=user_id)
        profile.avatar_key = key
        profile.avatar_content_type = content_type
        profile.avatar_updated_at = datetime.now(UTC)
        self._db.add(profile)
        await self._db.commit()
        return profile

    async def clear_avatar(self, profile: UserProfile) -> None:
        profile.avatar_key = None
        profile.avatar_content_type = None
        profile.avatar_updated_at = None
        await self._db.commit()
