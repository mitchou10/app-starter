import uuid

from tests.conftest import MemoryStore
from tests.helpers import JPEG, PNG, answer, move, ref_id, send, shot

FEEDBACK = "/api/feedback"


# ---- sending


async def test_sending_a_feedback_puts_it_in_the_new_status_and_keeps_who_sent_it(client, login) -> None:
    login("u1", "ada")
    sent = await send(client, title="  Save does nothing ", description="Nothing happens.", page="/settings?tab=1")
    assert sent["title"] == "Save does nothing"  # trimmed
    assert (sent["created_by"], sent["created_by_username"]) == ("u1", "ada")
    assert sent["page"] == "/settings?tab=1"
    assert sent["status_id"] == await ref_id(client, "statuses", "New")
    assert sent["type_id"] == await ref_id(client, "types", "Bug")
    assert sent["attachments"] == [] and sent["created_at"] and sent["updated_at"]


async def test_the_screenshots_are_stored_and_listed_with_where_to_get_them(client, login, store: MemoryStore) -> None:
    login()
    sent = await send(client, files=[shot("a.png"), shot("b.jpg", JPEG, "image/jpeg")])
    assert [a["filename"] for a in sent["attachments"]] == ["a.png", "b.jpg"]
    assert [a["content_type"] for a in sent["attachments"]] == ["image/png", "image/jpeg"]
    assert all(
        a["size_bytes"] > 0 and a["url"].startswith(f"/api/feedback/{sent['id']}/attachments/")
        for a in sent["attachments"]
    )
    assert len(store.objects) == 2


async def test_the_page_is_optional(client, login) -> None:
    login()
    assert (await send(client))["page"] is None


async def test_nothing_is_sent_without_a_login(client) -> None:
    response = await client.post(FEEDBACK, data={"title": "t", "description": "d", "type_id": str(uuid.uuid4())})
    assert response.status_code == 401


async def test_the_required_fields_are_checked(client, login) -> None:
    login()
    type_id = await ref_id(client, "types", "Bug")
    good = {"title": "t", "description": "d", "type_id": type_id}
    for missing in ("title", "description", "type_id"):
        data = {k: v for k, v in good.items() if k != missing}
        assert (await client.post(FEEDBACK, data=data)).status_code == 422, missing
    for blank in ("title", "description"):
        assert (await client.post(FEEDBACK, data={**good, blank: "   "})).status_code == 422, blank
    assert (await client.post(FEEDBACK, data={**good, "title": "x" * 201})).status_code == 422
    assert (await client.post(FEEDBACK, data={**good, "type_id": "nope"})).status_code == 422


async def test_an_unknown_or_archived_type_is_refused(client, login) -> None:
    login(admin=True)
    base = {"title": "t", "description": "d"}
    assert (await client.post(FEEDBACK, data={**base, "type_id": str(uuid.uuid4())})).status_code == 422
    other = await ref_id(client, "types", "Other")
    await client.patch(f"/api/admin/feedback-types/{other}", json={"archived": True})
    assert (await client.post(FEEDBACK, data={**base, "type_id": other})).status_code == 422


async def test_the_page_must_be_a_path_of_the_app(client, login) -> None:
    login()
    type_id = await ref_id(client, "types", "Bug")
    for page in ("https://evil.example/x", "//evil.example", "settings", "javascript:alert(1)"):
        response = await client.post(
            FEEDBACK, data={"title": "t", "description": "d", "type_id": type_id, "page": page}
        )
        assert response.status_code == 422, page


async def test_a_bad_screenshot_stops_everything_and_stores_nothing(client, login, store: MemoryStore) -> None:
    login()
    data = {"title": "t", "description": "d", "type_id": await ref_id(client, "types", "Bug")}
    mixed = [shot("ok.png"), shot("notes.txt", b"hello", "text/plain")]
    assert (await client.post(FEEDBACK, data=data, files=mixed)).status_code == 415
    svg = shot("x.svg", b"<svg><script>alert(1)</script></svg>", "image/svg+xml")
    assert (await client.post(FEEDBACK, data=data, files=[shot("ok.png"), svg])).status_code == 415
    assert store.objects == {}
    assert (await client.get(FEEDBACK)).json()["total"] == 0  # and no feedback was created either


async def test_at_most_five_screenshots(client, login, store: MemoryStore) -> None:
    login()
    data = {"title": "t", "description": "d", "type_id": await ref_id(client, "types", "Bug")}
    assert (await client.post(FEEDBACK, data=data, files=[shot(f"{i}.png") for i in range(6)])).status_code == 422
    assert store.objects == {}
    assert (await client.post(FEEDBACK, data=data, files=[shot(f"{i}.png") for i in range(5)])).status_code == 201


async def test_a_screenshot_is_too_large_above_the_limit(client, login, store, monkeypatch) -> None:
    from app.config import settings

    login()
    monkeypatch.setattr(settings, "FEEDBACK_ATTACHMENT_MAX_BYTES", 40)
    data = {"title": "t", "description": "d", "type_id": await ref_id(client, "types", "Bug")}
    assert (await client.post(FEEDBACK, data=data, files=[shot(data=PNG + b"\x00" * 10)])).status_code == 413
    assert store.objects == {}
    assert (await client.post(FEEDBACK, data=data, files=[shot()])).status_code == 201  # 40 bytes: allowed


async def test_the_name_of_a_file_cannot_carry_a_path(client, login) -> None:
    login()
    sent = await send(client, files=[shot("../../etc/passwd.png")])
    assert [a["filename"] for a in sent["attachments"]] == ["passwd.png"]


# ---- reading


async def test_an_author_reads_their_feedback_and_nobody_else_but_the_admins(client, login) -> None:
    login("u1", "ada")
    sent = await send(client)
    url = f"{FEEDBACK}/{sent['id']}"
    assert (await client.get(url)).status_code == 200

    login("u2", "bob")
    assert (await client.get(url)).status_code == 404  # looks like it does not exist

    login("a1", "grace", admin=True)
    assert (await client.get(url)).json()["created_by_username"] == "ada"


async def test_an_unknown_feedback_is_a_404_and_a_bad_id_a_422(client, login) -> None:
    login()
    assert (await client.get(f"{FEEDBACK}/{uuid.uuid4()}")).status_code == 404
    assert (await client.get(f"{FEEDBACK}/nope")).status_code == 422


# ---- listing


async def test_the_list_is_mine_only_the_most_recently_updated_first(client, login) -> None:
    login("u1", "ada")
    first = await send(client, title="first")
    second = await send(client, title="second")
    login("u2", "bob")
    await send(client, title="not mine")

    login("u1", "ada")
    page = (await client.get(FEEDBACK)).json()
    assert [i["title"] for i in page["items"]] == ["second", "first"]
    assert (page["total"], page["limit"], page["offset"]) == (2, 10, 0)
    assert set(page["items"][0]) == {
        "id",
        "title",
        "type_id",
        "status_id",
        "created_by",
        "created_by_username",
        "created_at",
        "updated_at",
        "replies_count",
    }  # no description, no screenshots in a list

    await answer(client, first["id"])  # an answer brings it back to the top
    assert [i["title"] for i in (await client.get(FEEDBACK)).json()["items"]] == ["first", "second"]
    assert second["id"]


async def test_the_list_is_paginated(client, login) -> None:
    login()
    for i in range(5):
        await send(client, title=f"n{i}")
    first = (await client.get(FEEDBACK, params={"limit": 2})).json()
    assert [i["title"] for i in first["items"]] == ["n4", "n3"]
    assert (first["total"], first["limit"], first["offset"]) == (5, 2, 0)
    last = (await client.get(FEEDBACK, params={"limit": 2, "offset": 4})).json()
    assert [i["title"] for i in last["items"]] == ["n0"]
    assert (await client.get(FEEDBACK, params={"limit": 2, "offset": 10})).json()["items"] == []


async def test_the_page_size_and_the_offset_are_bounded(client, login) -> None:
    login()
    for params in ({"limit": 0}, {"limit": 51}, {"offset": -1}, {"limit": "x"}):
        assert (await client.get(FEEDBACK, params=params)).status_code == 422, params


async def test_the_list_can_be_filtered_by_status_by_open_and_by_type(client, login) -> None:
    login("u1", "ada")
    bug = await send(client, title="a bug", type_name="Bug")
    idea = await send(client, title="an idea", type_name="Suggestion")
    await move(client, idea["id"], "Closed")

    async def listed(**params) -> list[str]:
        return [i["title"] for i in (await client.get(FEEDBACK, params=params)).json()["items"]]

    assert await listed(status="open") == ["a bug"]  # the closed one is not open
    assert await listed(status=await ref_id(client, "statuses", "Closed")) == ["an idea"]
    assert await listed(type_id=await ref_id(client, "types", "Suggestion")) == ["an idea"]
    assert await listed(status="open", type_id=await ref_id(client, "types", "Suggestion")) == []
    assert (await client.get(FEEDBACK, params={"status": "whatever"})).status_code == 422
    assert bug["id"]


async def test_the_list_counts_the_answers_but_not_the_changes_of_status(client, login) -> None:
    login("u1", "ada")
    sent = await send(client)
    await answer(client, sent["id"])
    await answer(client, sent["id"])
    await move(client, sent["id"], "Closed")  # a change of status: not an answer
    assert (await client.get(FEEDBACK)).json()["items"][0]["replies_count"] == 2


# ---- the admin's list


async def test_an_admin_lists_everybodys_feedback_and_filters_it(client, login) -> None:
    login("u1", "ada")
    await send(client, title="from ada")
    login("u2", "bob")
    done = await send(client, title="from bob")
    login("a1", "grace", admin=True)
    await move(client, done["id"], "Done")

    everything = (await client.get("/api/admin/feedback")).json()
    assert {i["title"] for i in everything["items"]} == {"from ada", "from bob"}
    assert {i["created_by_username"] for i in everything["items"]} == {"ada", "bob"}
    opened = (await client.get("/api/admin/feedback", params={"status": "open"})).json()
    assert [i["title"] for i in opened["items"]] == ["from ada"]
    assert (await client.get("/api/admin/feedback", params={"limit": 1})).json()["total"] == 2


async def test_a_user_cannot_list_everything(client, login) -> None:
    login("u1", "ada")
    assert (await client.get("/api/admin/feedback")).status_code == 403


# ---- changing the status and the type


async def test_an_admin_moves_a_feedback_and_the_follow_up_says_so(client, login) -> None:
    login("u1", "ada")
    sent = await send(client)
    login("a1", "grace", admin=True)
    planned = await ref_id(client, "statuses", "Planned")
    response = await client.patch(f"{FEEDBACK}/{sent['id']}", json={"status_id": planned})
    assert response.status_code == 200 and response.json()["status_id"] == planned

    (change,) = (await client.get(f"{FEEDBACK}/{sent['id']}/messages")).json()["items"]
    assert change["kind"] == "status_change" and change["body"] == ""
    assert (change["old_status_id"], change["new_status_id"]) == (sent["status_id"], planned)
    assert (change["author_username"], change["author_is_staff"]) == ("grace", True)


async def test_moving_to_the_status_it_already_has_changes_nothing(client, login) -> None:
    login()
    sent = await send(client)
    assert (await move(client, sent["id"], "New")).status_code == 200
    assert (await client.get(f"{FEEDBACK}/{sent['id']}/messages")).json()["total"] == 0


async def test_an_admin_changes_the_type(client, login) -> None:
    login("u1", "ada")
    sent = await send(client, type_name="Bug")
    login("a1", "grace", admin=True)
    question = await ref_id(client, "types", "Question")
    response = await client.patch(f"{FEEDBACK}/{sent['id']}", json={"type_id": question})
    assert response.json()["type_id"] == question
    assert (await client.get(f"{FEEDBACK}/{sent['id']}/messages")).json()["total"] == 0  # only statuses are followed


async def test_an_archived_or_unknown_status_cannot_be_chosen(client, login) -> None:
    login("a1", "grace", admin=True)
    sent = await send(client)
    review = await ref_id(client, "statuses", "In review")
    await client.patch(f"/api/admin/feedback-statuses/{review}", json={"archived": True})
    assert (await client.patch(f"{FEEDBACK}/{sent['id']}", json={"status_id": review})).status_code == 422
    assert (await client.patch(f"{FEEDBACK}/{sent['id']}", json={"status_id": str(uuid.uuid4())})).status_code == 422


async def test_something_must_be_sent_to_change(client, login) -> None:
    login()
    sent = await send(client)
    assert (await client.patch(f"{FEEDBACK}/{sent['id']}", json={})).status_code == 422


async def test_an_author_can_close_and_reopen_their_feedback(client, login) -> None:
    login("u1", "ada")
    sent = await send(client)
    closed = await move(client, sent["id"], "Closed")
    assert closed.status_code == 200 and closed.json()["status_id"] == await ref_id(client, "statuses", "Closed")
    reopened = await move(client, sent["id"], "New")
    assert reopened.json()["status_id"] == sent["status_id"]
    changes = (await client.get(f"{FEEDBACK}/{sent['id']}/messages")).json()["items"]
    assert [c["author_is_staff"] for c in changes] == [False, False]  # written by the author, not the team


async def test_an_author_cannot_do_what_only_the_team_does(client, login) -> None:
    login("u1", "ada")
    sent = await send(client)
    assert (await move(client, sent["id"], "In review")).status_code == 403
    assert (await move(client, sent["id"], "Done")).status_code == 403
    assert (
        await client.patch(f"{FEEDBACK}/{sent['id']}", json={"type_id": await ref_id(client, "types", "Other")})
    ).status_code == 403
    # reopening a feedback the team closed as Done is not the author's call either
    login("a1", "grace", admin=True)
    await move(client, sent["id"], "Done")
    login("u1", "ada")
    assert (await move(client, sent["id"], "New")).status_code == 200  # a closed feedback can be reopened...
    assert (await move(client, sent["id"], "Planned")).status_code == 403  # ...but not moved elsewhere


async def test_nobody_changes_somebody_elses_feedback(client, login) -> None:
    login("u1", "ada")
    sent = await send(client)
    login("u2", "bob")
    assert (await move(client, sent["id"], "Closed")).status_code == 404


async def test_changing_a_feedback_brings_it_to_the_top_of_the_list(client, login) -> None:
    login("u1", "ada")
    old = await send(client, title="old")
    await send(client, title="new")
    await move(client, old["id"], "Closed")
    assert [i["title"] for i in (await client.get(FEEDBACK)).json()["items"]][0] == "old"
