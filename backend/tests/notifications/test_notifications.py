import uuid

from tests.notifications.helpers import NOTIFICATIONS, emit


async def seed(client, user: str, count: int, **kwargs) -> None:
    for n in range(1, count + 1):
        await emit(client, [user], title=f"n{n}", **kwargs)


# ---- reading


async def test_a_user_reads_their_notifications_newest_first(client, login) -> None:
    await seed(client, "u1", 3)
    await emit(client, ["u2"], title="for somebody else")
    login("u1", "ada")
    page = (await client.get(NOTIFICATIONS)).json()
    assert [n["title"] for n in page["items"]] == ["n3", "n2", "n1"]
    assert (page["total"], page["limit"], page["offset"]) == (3, 10, 0)
    assert set(page["items"][0]) == {"id", "source", "title", "description", "url", "created_at", "read", "read_at"}


async def test_the_list_is_paginated(client, login) -> None:
    await seed(client, "u1", 5)
    login("u1", "ada")
    first = (await client.get(NOTIFICATIONS, params={"limit": 2})).json()
    assert [n["title"] for n in first["items"]] == ["n5", "n4"] and first["total"] == 5
    last = (await client.get(NOTIFICATIONS, params={"limit": 2, "offset": 4})).json()
    assert [n["title"] for n in last["items"]] == ["n1"]
    assert (await client.get(NOTIFICATIONS, params={"offset": 99})).json()["items"] == []


async def test_the_page_size_and_the_offset_are_bounded(client, login) -> None:
    login("u1", "ada")
    for params in ({"limit": 0}, {"limit": 51}, {"offset": -1}, {"unread": "maybe"}):
        assert (await client.get(NOTIFICATIONS, params=params)).status_code == 422, params


async def test_only_the_unread_ones_can_be_asked_for(client, login) -> None:
    await seed(client, "u1", 3)
    login("u1", "ada")
    middle = next(n for n in (await client.get(NOTIFICATIONS)).json()["items"] if n["title"] == "n2")
    await client.patch(f"{NOTIFICATIONS}/{middle['id']}", json={"read": True})
    unread = (await client.get(NOTIFICATIONS, params={"unread": "true"})).json()
    assert [n["title"] for n in unread["items"]] == ["n3", "n1"] and unread["total"] == 2
    assert (await client.get(NOTIFICATIONS)).json()["total"] == 3  # all of them are still there


async def test_everything_needs_a_login(client) -> None:
    for call in (
        client.get(NOTIFICATIONS),
        client.get(f"{NOTIFICATIONS}/unread-count"),
        client.post(f"{NOTIFICATIONS}/read-all"),
        client.patch(f"{NOTIFICATIONS}/{uuid.uuid4()}", json={"read": True}),
    ):
        assert (await call).status_code == 401


# ---- the badge


async def test_the_badge_counts_what_is_unread(client, login) -> None:
    login("u1", "ada")
    assert (await client.get(f"{NOTIFICATIONS}/unread-count")).json() == {"count": 0}
    await seed(client, "u1", 3)
    await emit(client, ["u2"])
    assert (await client.get(f"{NOTIFICATIONS}/unread-count")).json() == {"count": 3}


# ---- reading one


async def test_a_notification_is_marked_read_and_can_be_marked_unread_again(client, login) -> None:
    await seed(client, "u1", 1)
    login("u1", "ada")
    first = (await client.get(NOTIFICATIONS)).json()["items"][0]
    assert (first["read"], first["read_at"]) == (False, None)

    read = (await client.patch(f"{NOTIFICATIONS}/{first['id']}", json={"read": True})).json()
    assert read["read"] is True and read["read_at"]
    assert (await client.get(f"{NOTIFICATIONS}/unread-count")).json() == {"count": 0}

    again = (await client.patch(f"{NOTIFICATIONS}/{first['id']}", json={"read": False})).json()
    assert (again["read"], again["read_at"]) == (False, None)
    assert (await client.get(f"{NOTIFICATIONS}/unread-count")).json() == {"count": 1}


async def test_reading_twice_keeps_the_first_time(client, login) -> None:
    await seed(client, "u1", 1)
    login("u1", "ada")
    item = (await client.get(NOTIFICATIONS)).json()["items"][0]
    first = (await client.patch(f"{NOTIFICATIONS}/{item['id']}", json={"read": True})).json()["read_at"]
    second = (await client.patch(f"{NOTIFICATIONS}/{item['id']}", json={"read": True})).json()["read_at"]
    assert first == second


async def test_somebody_elses_notification_does_not_exist(client, login) -> None:
    await emit(client, ["u2"])
    login("u2", "bob")
    theirs = (await client.get(NOTIFICATIONS)).json()["items"][0]["id"]
    login("u1", "ada")
    assert (await client.patch(f"{NOTIFICATIONS}/{theirs}", json={"read": True})).status_code == 404
    login("u2", "bob")
    assert (await client.get(f"{NOTIFICATIONS}/unread-count")).json() == {"count": 1}  # untouched


async def test_an_unknown_notification_is_a_404_and_a_bad_id_a_422(client, login) -> None:
    login("u1", "ada")
    assert (await client.patch(f"{NOTIFICATIONS}/{uuid.uuid4()}", json={"read": True})).status_code == 404
    assert (await client.patch(f"{NOTIFICATIONS}/nope", json={"read": True})).status_code == 422
    item = await emit(client, ["u1"])
    assert item.status_code == 201
    first = (await client.get(NOTIFICATIONS)).json()["items"][0]["id"]
    assert (await client.patch(f"{NOTIFICATIONS}/{first}", json={})).status_code == 422  # `read` is required


# ---- all of them


async def test_everything_of_mine_is_marked_read_at_once_and_nobody_elses(client, login) -> None:
    await seed(client, "u1", 3)
    await emit(client, ["u2"])
    login("u1", "ada")
    first = (await client.get(NOTIFICATIONS)).json()["items"][0]
    await client.patch(f"{NOTIFICATIONS}/{first['id']}", json={"read": True})  # one is read already

    response = await client.post(f"{NOTIFICATIONS}/read-all")
    assert response.json() == {"updated": 2}  # only the two that were unread
    assert (await client.get(f"{NOTIFICATIONS}/unread-count")).json() == {"count": 0}
    assert all(n["read"] for n in (await client.get(NOTIFICATIONS)).json()["items"])

    assert (await client.post(f"{NOTIFICATIONS}/read-all")).json() == {"updated": 0}
    login("u2", "bob")
    assert (await client.get(f"{NOTIFICATIONS}/unread-count")).json() == {"count": 1}
