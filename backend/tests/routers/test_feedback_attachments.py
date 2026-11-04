import uuid

from tests.conftest import MemoryStore
from tests.helpers import JPEG, PNG, answer, send, shot


def url(feedback_id: str, attachment_id: str) -> str:
    return f"/api/feedback/{feedback_id}/attachments/{attachment_id}"


async def test_a_screenshot_is_served_as_the_image_it_is(client, login) -> None:
    login()
    sent = await send(client, files=[shot("a.png"), shot("b.jpg", JPEG, "image/jpeg")])
    png, jpeg = sent["attachments"]
    first = await client.get(png["url"])
    assert first.status_code == 200 and first.content == PNG
    assert first.headers["content-type"] == "image/png"
    assert first.headers["x-content-type-options"] == "nosniff"
    assert "private" in first.headers["cache-control"]
    second = await client.get(jpeg["url"])
    assert second.content == JPEG and second.headers["content-type"] == "image/jpeg"


async def test_the_screenshot_of_an_answer_is_served_too(client, login) -> None:
    login()
    sent = await send(client)
    created = await answer(client, sent["id"], "look", files=[shot()])
    assert (await client.get(created["attachments"][0]["url"])).content == PNG


async def test_only_the_author_and_the_admins_see_the_screenshots(client, login) -> None:
    login("u1", "ada")
    sent = await send(client, files=[shot()])
    address = sent["attachments"][0]["url"]
    login("u2", "bob")
    assert (await client.get(address)).status_code == 404
    login("a1", "grace", admin=True)
    assert (await client.get(address)).status_code == 200


async def test_the_screenshot_of_another_feedback_cannot_be_reached_through_this_one(client, login) -> None:
    login()
    mine = await send(client, files=[shot()])
    other = await send(client)
    assert (await client.get(url(other["id"], mine["attachments"][0]["id"]))).status_code == 404


async def test_an_unknown_screenshot_and_a_missing_object_are_404s(client, login, store: MemoryStore) -> None:
    login()
    sent = await send(client, files=[shot()])
    assert (await client.get(url(sent["id"], str(uuid.uuid4())))).status_code == 404
    store.objects.clear()  # the row is there, the image is gone
    assert (await client.get(sent["attachments"][0]["url"])).status_code == 404


async def test_screenshots_need_a_login(client) -> None:
    assert (await client.get(url(str(uuid.uuid4()), str(uuid.uuid4())))).status_code == 401
