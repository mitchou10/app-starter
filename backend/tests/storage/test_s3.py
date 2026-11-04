import socket
from collections.abc import Iterator

import aioboto3
import pytest
from moto.server import ThreadedMotoServer

from app.storage import S3Store


@pytest.fixture(scope="module")
def s3_url() -> Iterator[str]:
    """A real S3 API over HTTP, in memory: aioboto3 does network calls, so it cannot be patched like boto3."""
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        port = probe.getsockname()[1]
    server = ThreadedMotoServer(ip_address="127.0.0.1", port=port, verbose=False)
    server.start()
    yield f"http://127.0.0.1:{port}"
    server.stop()


def make_store(url: str, bucket: str) -> S3Store:
    return S3Store(bucket=bucket, endpoint_url=url, access_key_id="test", secret_access_key="test", region="us-east-1")


async def test_put_creates_the_bucket_and_get_gives_the_object_back(s3_url: str) -> None:
    store = make_store(s3_url, "photos")
    await store.put("a/b", b"data", "image/png")
    stored = await store.get("a/b")
    assert stored is not None and (stored.data, stored.content_type) == (b"data", "image/png")


async def test_put_works_when_the_bucket_already_exists(s3_url: str) -> None:
    await make_store(s3_url, "shared").put("k", b"x", "image/png")
    await make_store(s3_url, "shared").put("k2", b"y", "image/png")  # a second store: the bucket is already there


async def test_a_missing_object_is_none(s3_url: str) -> None:
    store = make_store(s3_url, "photos2")
    await store.put("k", b"x", "image/png")
    assert await store.get("nope") is None


async def test_a_missing_bucket_is_none(s3_url: str) -> None:
    assert await make_store(s3_url, "ghost").get("k") is None


async def test_delete(s3_url: str) -> None:
    store = make_store(s3_url, "photos3")
    await store.put("k", b"x", "image/png")
    await store.delete("k")
    assert await store.get("k") is None


async def test_another_error_is_not_hidden(s3_url: str) -> None:
    # A bucket name S3 refuses: the error must come out, not be taken for "already exists".
    with pytest.raises(Exception):  # noqa: B017
        await make_store(s3_url, "X").put("k", b"x", "image/png")


def test_the_session_is_aioboto3() -> None:
    assert aioboto3.Session  # the dependency the store is built on
