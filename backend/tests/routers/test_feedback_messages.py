import uuid

from tests.conftest import MemoryStore
from tests.helpers import answer, move, send, shot

FEEDBACK = "/api/feedback"


def messages(feedback_id: str) -> str:
    return f"{FEEDBACK}/{feedback_id}/messages"


# ---- answering


async def test_an_author_answers_their_feedback(client, login) -> None:
    login("u1", "ada")
    sent = await send(client)
    created = await answer(client, sent["id"], "  More details.  ")
    assert created["kind"] == "comment" and created["body"] == "More details."  # trimmed
    assert (created["author_username"], created["author_is_staff"]) == ("ada", False)
    assert created["old_status_id"] is None and created["new_status_id"] is None and created["attachments"] == []


async def test_an_admin_answers_as_the_team(client, login) -> None:
    login("u1", "ada")
    sent = await send(client)
    login("a1", "grace", admin=True)
    created = await answer(client, sent["id"], "We are on it.")
    assert (created["author_username"], created["author_is_staff"]) == ("grace", True)


async def test_an_answer_can_carry_screenshots(client, login, store: MemoryStore) -> None:
    login()
    sent = await send(client)
    created = await answer(client, sent["id"], "Here it is.", files=[shot("a.png"), shot("b.png")])
    assert [a["filename"] for a in created["attachments"]] == ["a.png", "b.png"]
    assert len(store.objects) == 2
    assert [a["filename"] for a in (await client.get(messages(sent["id"]))).json()["items"][0]["attachments"]] == [
        "a.png",
        "b.png",
    ]


async def test_an_empty_answer_is_refused(client, login) -> None:
    login()
    sent = await send(client)
    for body in ("", "   "):
        assert (await client.post(messages(sent["id"]), data={"body": body})).status_code == 422, repr(body)
    assert (await client.post(messages(sent["id"]), data={})).status_code == 422


async def test_a_bad_screenshot_stops_the_answer_and_stores_nothing(client, login, store: MemoryStore) -> None:
    login()
    sent = await send(client)
    bad = [shot("ok.png"), shot("notes.txt", b"hello", "text/plain")]
    assert (await client.post(messages(sent["id"]), data={"body": "hi"}, files=bad)).status_code == 415
    too_many = [shot(f"{i}.png") for i in range(6)]
    assert (await client.post(messages(sent["id"]), data={"body": "hi"}, files=too_many)).status_code == 422
    assert store.objects == {}
    assert (await client.get(messages(sent["id"]))).json()["total"] == 0


async def test_only_the_author_and_the_admins_can_read_or_answer(client, login) -> None:
    login("u1", "ada")
    sent = await send(client)
    login("u2", "bob")
    assert (await client.get(messages(sent["id"]))).status_code == 404
    assert (await client.post(messages(sent["id"]), data={"body": "hi"})).status_code == 404
    assert (await client.get(messages(str(uuid.uuid4())))).status_code == 404


async def test_the_follow_up_needs_a_login(client) -> None:
    assert (await client.get(messages(str(uuid.uuid4())))).status_code == 401


# ---- the follow-up, in order


async def test_the_follow_up_mixes_answers_and_changes_of_status_in_order(client, login) -> None:
    login("u1", "ada")
    sent = await send(client)
    await answer(client, sent["id"], "first")
    login("a1", "grace", admin=True)
    await move(client, sent["id"], "In review")
    await answer(client, sent["id"], "second")
    items = (await client.get(messages(sent["id"]))).json()["items"]
    assert [(m["kind"], m["body"]) for m in items] == [
        ("comment", "first"),
        ("status_change", ""),
        ("comment", "second"),
    ]


# ---- pagination


async def conversation(client, login, count: int) -> str:
    login("u1", "ada")
    sent = await send(client)
    for n in range(1, count + 1):
        await answer(client, sent["id"], f"m{n}")
    return sent["id"]


async def test_the_newest_messages_come_first_in_a_page_read_oldest_first(client, login) -> None:
    feedback_id = await conversation(client, login, 25)
    page = (await client.get(messages(feedback_id))).json()  # 10 by default
    assert [m["body"] for m in page["items"]] == [f"m{n}" for n in range(16, 26)]
    assert page["total"] == 25 and page["next_before"]


async def test_older_pages_follow_the_cursor_until_the_first_message(client, login) -> None:
    feedback_id = await conversation(client, login, 25)
    seen: list[str] = []
    cursor = None
    pages = 0
    while True:
        params = {"limit": 10} | ({"before": cursor} if cursor else {})
        page = (await client.get(messages(feedback_id), params=params)).json()
        seen = [m["body"] for m in page["items"]] + seen  # each page is older than the last one
        pages += 1
        cursor = page["next_before"]
        if cursor is None:
            break
    assert pages == 3
    assert seen == [f"m{n}" for n in range(1, 26)]  # every message once, in order, none missed


async def test_a_message_added_while_reading_moves_nothing(client, login) -> None:
    feedback_id = await conversation(client, login, 12)
    first = (await client.get(messages(feedback_id), params={"limit": 5})).json()
    await answer(client, feedback_id, "arrived meanwhile")
    older = (await client.get(messages(feedback_id), params={"limit": 5, "before": first["next_before"]})).json()
    assert [m["body"] for m in older["items"]] == [f"m{n}" for n in range(3, 8)]  # no shift, no repeat


async def test_a_page_that_reaches_the_start_has_no_cursor(client, login) -> None:
    feedback_id = await conversation(client, login, 10)
    page = (await client.get(messages(feedback_id), params={"limit": 10})).json()
    assert len(page["items"]) == 10 and page["next_before"] is None


async def test_a_feedback_without_messages_has_an_empty_page(client, login) -> None:
    login()
    sent = await send(client)
    assert (await client.get(messages(sent["id"]))).json() == {"items": [], "total": 0, "next_before": None}


async def test_the_page_size_is_bounded_and_the_cursor_checked(client, login) -> None:
    feedback_id = await conversation(client, login, 2)
    for params in ({"limit": 0}, {"limit": 51}, {"before": "not-a-cursor"}, {"before": "bm90fHRoaXM"}):
        assert (await client.get(messages(feedback_id), params=params)).status_code == 422, params
