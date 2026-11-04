import uuid

from app.models import UserProfile
from app.repositories.user_profile import UserProfileRepository
from app.services.avatar import validate_avatar
from app.services.errors import AvatarNotFound
from app.storage import ObjectStore, StoredObject


class ProfileService:
    """The profile of a user: the rules, built on a repository (the database) and a store (the photos)."""

    def __init__(self, profiles: UserProfileRepository, store: ObjectStore, max_avatar_bytes: int) -> None:
        self._profiles = profiles
        self._store = store
        self.max_avatar_bytes = max_avatar_bytes

    async def get_profile(self, user_id: str) -> UserProfile:
        """The profile, or an empty one for a user who never set anything (it is not saved)."""
        return await self._profiles.get(user_id) or UserProfile(user_id=user_id)

    async def get_avatar(self, user_id: str) -> StoredObject:
        profile = await self._profiles.get(user_id)
        if profile is None or profile.avatar_key is None:
            raise AvatarNotFound
        stored = await self._store.get(profile.avatar_key)
        if stored is None:
            raise AvatarNotFound
        return StoredObject(data=stored.data, content_type=profile.avatar_content_type or stored.content_type)

    async def set_avatar(self, user_id: str, data: bytes) -> UserProfile:
        """Raises AvatarTooLarge or UnsupportedImage when the photo is not acceptable."""
        content_type = validate_avatar(data, self.max_avatar_bytes)
        previous = await self._profiles.get(user_id)
        previous_key = previous.avatar_key if previous else None

        # A new key each time: the old photo stays valid until the new one is recorded.
        key = f"avatars/{user_id}/{uuid.uuid4().hex}"
        await self._store.put(key, data, content_type)
        try:
            profile = await self._profiles.set_avatar(user_id, key, content_type)
        except Exception:
            await self._store.delete(key)  # do not leave an object nobody points to
            raise
        if previous_key:
            await self._store.delete(previous_key)
        return profile

    async def delete_avatar(self, user_id: str) -> None:
        profile = await self._profiles.get(user_id)
        if profile is None or profile.avatar_key is None:
            return
        key = profile.avatar_key
        await self._profiles.clear_avatar(profile)
        await self._store.delete(key)
