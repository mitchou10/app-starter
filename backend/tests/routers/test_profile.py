import httpx2
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.models import UserProfile
from tests.conftest import MemoryStore

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 32


@pytest.fixture
async def client(db: AsyncSession, store: MemoryStore, as_user: None):
    transport = httpx2.ASGITransport(app=app)
    async with httpx2.AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


def upload(client: httpx2.AsyncClient, data: bytes, name: str = "me.png", content_type: str = "image/png"):
    return client.put("/api/me/avatar", files={"file": (name, data, content_type)})


async def test_no_photo_at_first(client: httpx2.AsyncClient) -> None:
    assert (await client.get("/api/me/profile")).json() == {"avatar_version": None}
    assert (await client.get("/api/me/avatar")).status_code == 404


async def test_upload_then_read_the_photo(client: httpx2.AsyncClient, store: MemoryStore) -> None:
    response = await upload(client, PNG)
    assert response.status_code == 200
    version = response.json()["avatar_version"]
    assert isinstance(version, int)

    assert (await client.get("/api/me/profile")).json() == {"avatar_version": version}
    photo = await client.get("/api/me/avatar")
    assert photo.status_code == 200
    assert photo.content == PNG
    assert photo.headers["content-type"] == "image/png"
    assert photo.headers["x-content-type-options"] == "nosniff"
    assert "private" in photo.headers["cache-control"]
    assert len(store.objects) == 1


async def test_the_type_is_read_from_the_bytes_not_from_what_the_client_says(client: httpx2.AsyncClient) -> None:
    assert (await upload(client, JPEG, "me.png", "image/png")).status_code == 200
    assert (await client.get("/api/me/avatar")).headers["content-type"] == "image/jpeg"


async def test_replacing_the_photo_removes_the_old_object(client: httpx2.AsyncClient, store: MemoryStore) -> None:
    await upload(client, PNG)
    (old_key,) = store.objects
    await upload(client, JPEG)
    assert len(store.objects) == 1 and old_key not in store.objects
    assert (await client.get("/api/me/avatar")).content == JPEG


async def test_not_an_image_is_refused(client: httpx2.AsyncClient, store: MemoryStore) -> None:
    response = await upload(client, b"<svg><script>alert(1)</script></svg>", "me.svg", "image/svg+xml")
    assert response.status_code == 415
    assert store.objects == {}


async def test_too_large_is_refused(client: httpx2.AsyncClient, store: MemoryStore, monkeypatch) -> None:
    from app.config import settings

    monkeypatch.setattr(settings, "AVATAR_MAX_BYTES", 100)
    assert (await upload(client, PNG + b"\x00" * 100)).status_code == 413
    assert store.objects == {}
    assert (await upload(client, PNG)).status_code == 200  # 40 bytes: under the limit


async def test_a_missing_file_is_refused(client: httpx2.AsyncClient) -> None:
    assert (await client.put("/api/me/avatar")).status_code == 422


async def test_delete_removes_the_photo_and_the_object(client: httpx2.AsyncClient, store: MemoryStore) -> None:
    await upload(client, PNG)
    assert (await client.delete("/api/me/avatar")).status_code == 204
    assert store.objects == {}
    assert (await client.get("/api/me/avatar")).status_code == 404
    assert (await client.get("/api/me/profile")).json() == {"avatar_version": None}


async def test_delete_without_photo_is_fine(client: httpx2.AsyncClient) -> None:
    assert (await client.delete("/api/me/avatar")).status_code == 204


async def test_a_photo_missing_from_the_storage_is_a_404(client: httpx2.AsyncClient, store: MemoryStore) -> None:
    await upload(client, PNG)
    store.objects.clear()
    assert (await client.get("/api/me/avatar")).status_code == 404


async def test_each_user_has_their_own_photo(client: httpx2.AsyncClient, db: AsyncSession) -> None:
    await upload(client, PNG)
    db.add(UserProfile(user_id="someone-else", avatar_key="avatars/someone-else/x", avatar_content_type="image/png"))
    await db.commit()
    profile = await db.get(UserProfile, "dev-user")
    assert profile is not None and profile.avatar_key is not None and profile.avatar_key.startswith("avatars/dev-user/")


async def test_login_is_required(db: AsyncSession, store: MemoryStore) -> None:
    transport = httpx2.ASGITransport(app=app)
    async with httpx2.AsyncClient(transport=transport, base_url="http://test") as client:
        assert (await client.get("/api/me/profile")).status_code == 401
        assert (await client.get("/api/me/avatar")).status_code == 401
        assert (await upload(client, PNG)).status_code == 401
        assert (await client.delete("/api/me/avatar")).status_code == 401
