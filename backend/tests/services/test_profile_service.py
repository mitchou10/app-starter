import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.user_profile import UserProfileRepository
from app.services.errors import AvatarNotFound, AvatarTooLarge, UnsupportedImage
from app.services.profile import ProfileService
from tests.conftest import MemoryStore

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 8
JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 8


@pytest.fixture
def service(db: AsyncSession, store: MemoryStore) -> ProfileService:
    return ProfileService(UserProfileRepository(db), store, max_avatar_bytes=100)


async def test_a_new_user_has_an_empty_profile_that_is_not_saved(service: ProfileService, db: AsyncSession) -> None:
    profile = await service.get_profile("u1")
    assert profile.user_id == "u1" and profile.avatar_version is None
    assert await UserProfileRepository(db).get("u1") is None


async def test_set_then_get_the_avatar(service: ProfileService) -> None:
    profile = await service.set_avatar("u1", PNG)
    assert profile.avatar_version is not None
    avatar = await service.get_avatar("u1")
    assert (avatar.data, avatar.content_type) == (PNG, "image/png")


async def test_replacing_keeps_one_object(service: ProfileService, store: MemoryStore) -> None:
    await service.set_avatar("u1", PNG)
    await service.set_avatar("u1", JPEG)
    assert len(store.objects) == 1
    assert (await service.get_avatar("u1")).content_type == "image/jpeg"


async def test_nothing_is_stored_for_a_refused_photo(service: ProfileService, store: MemoryStore) -> None:
    with pytest.raises(UnsupportedImage):
        await service.set_avatar("u1", b"nope")
    with pytest.raises(AvatarTooLarge):
        await service.set_avatar("u1", PNG + b"\x00" * 100)
    assert store.objects == {}


async def test_no_avatar(service: ProfileService) -> None:
    with pytest.raises(AvatarNotFound):
        await service.get_avatar("u1")


async def test_delete(service: ProfileService, store: MemoryStore) -> None:
    await service.set_avatar("u1", PNG)
    await service.delete_avatar("u1")
    await service.delete_avatar("u1")  # nothing left: fine
    assert store.objects == {}
    assert (await service.get_profile("u1")).avatar_version is None


async def test_users_do_not_share_photos(service: ProfileService) -> None:
    await service.set_avatar("u1", PNG)
    with pytest.raises(AvatarNotFound):
        await service.get_avatar("u2")


async def test_the_object_is_removed_when_the_database_fails(
    service: ProfileService, store: MemoryStore, monkeypatch: pytest.MonkeyPatch
) -> None:
    async def fail(*args, **kwargs):
        raise RuntimeError("database down")

    monkeypatch.setattr(UserProfileRepository, "set_avatar", fail)
    with pytest.raises(RuntimeError):
        await service.set_avatar("u1", PNG)
    assert store.objects == {}


async def test_the_object_missing_from_the_storage(service: ProfileService, store: MemoryStore) -> None:
    await service.set_avatar("u1", PNG)
    store.objects.clear()
    with pytest.raises(AvatarNotFound):
        await service.get_avatar("u1")
