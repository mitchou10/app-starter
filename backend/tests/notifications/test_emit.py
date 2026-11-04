import pytest
from sqlalchemy import text

from app.config import Settings
from tests.notifications.helpers import EMIT, KEY, NOTIFICATIONS, OTHER_KEY, emit

# ---- who may emit


async def test_an_application_tells_users_with_its_key(client, login) -> None:
    response = await emit(client, ["u1", "u2", "u3"])
    assert response.status_code == 201
    assert response.json() == {"created": 3}


async def test_the_source_is_the_application_that_owns_the_key(client, login) -> None:
    await emit(client, ["u1"], key=KEY)
    await emit(client, ["u1"], key=OTHER_KEY, title="Report ready")
    login("u1", "ada")
    items = (await client.get(NOTIFICATIONS)).json()["items"]
    assert {(n["title"], n["source"]) for n in items} == {("Invoice ready", "billing"), ("Report ready", "reports")}


async def test_an_application_cannot_claim_to_be_another(client, login) -> None:
    body = {"user_ids": ["u1"], "title": "t", "source": "reports"}  # a `source` in the body is ignored
    await client.post(EMIT, json=body, headers={"X-Api-Key": KEY})
    login("u1", "ada")
    assert (await client.get(NOTIFICATIONS)).json()["items"][0]["source"] == "billing"


@pytest.mark.parametrize(
    "headers", [{}, {"X-Api-Key": ""}, {"X-Api-Key": "nope"}, {"X-Api-Key": KEY + "x"}, {"X-Api-Key": KEY[:-1]}]
)
async def test_a_missing_or_wrong_key_is_refused(client, headers) -> None:
    response = await client.post(EMIT, json={"user_ids": ["u1"], "title": "t"}, headers=headers)
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "ApiKey"


async def test_a_logged_in_user_is_not_an_emitter(client, login) -> None:
    login("a1", "grace", admin=True)  # not even an admin: only an application with a key emits
    assert (await client.post(EMIT, json={"user_ids": ["u1"], "title": "t"})).status_code == 401


async def test_nobody_can_emit_when_no_key_is_configured(client, monkeypatch) -> None:
    from app.config import settings

    monkeypatch.setattr(settings, "NOTIFICATION_API_KEYS", "")
    assert (await emit(client, ["u1"])).status_code == 401
    assert (
        await client.post(EMIT, json={"user_ids": ["u1"], "title": "t"}, headers={"X-Api-Key": ""})
    ).status_code == 401


def test_the_keys_are_read_from_the_setting() -> None:
    # spaces are ignored; a key under 16 characters, a name without key or a pair without "=" is dropped
    keys = (
        " billing = billing-key-0123456789 , short=abc,=nokey-0123456789012,noequals, reports=reports-key-9876543210 "
    )
    settings = Settings(NOTIFICATION_API_KEYS=keys)
    assert settings.notification_emitters == {
        "billing-key-0123456789": "billing",
        "reports-key-9876543210": "reports",
    }
    assert Settings(NOTIFICATION_API_KEYS="").notification_emitters == {}


# ---- what is sent


async def test_everybody_listed_is_told_once(client, login, db) -> None:
    response = await emit(client, ["u1", "u2", "u1", " u2 "])
    assert response.json() == {"created": 2}  # u1 twice is once, " u2 " is u2
    assert (await db.execute(text("SELECT count(*) FROM notifications"))).scalar_one() == 2


async def test_each_one_told_has_their_own_copy(client, login) -> None:
    await emit(client, ["u1", "u2"])
    login("u1", "ada")
    first = (await client.get(NOTIFICATIONS)).json()["items"][0]
    await client.patch(f"{NOTIFICATIONS}/{first['id']}", json={"read": True})
    login("u2", "bob")
    assert (await client.get(f"{NOTIFICATIONS}/unread-count")).json() == {"count": 1}  # u2 has not read theirs


@pytest.mark.parametrize(
    "url", ["/feedback/abc", "/settings?tab=1#x", "https://billing.example.com/invoices/42", "http://intranet/x"]
)
async def test_a_link_can_be_a_path_of_the_app_or_another_application(client, login, url) -> None:
    assert (await emit(client, ["u1"], url=url)).status_code == 201
    login("u1", "ada")
    assert (await client.get(NOTIFICATIONS)).json()["items"][0]["url"] == url


@pytest.mark.parametrize(
    "url",
    ["javascript:alert(1)", "//evil.example/x", "ftp://host/file", "data:text/html,x", "evil.example", "mailto:a@b.c"],
)
async def test_nothing_else_is_accepted_as_a_link(client, login, url) -> None:
    assert (await emit(client, ["u1"], url=url)).status_code == 422
    login("u1", "ada")
    assert (await client.get(NOTIFICATIONS)).json()["total"] == 0


async def test_a_notification_may_have_no_link_and_no_description(client, login) -> None:
    assert (
        await client.post(EMIT, json={"user_ids": ["u1"], "title": "Hello"}, headers={"X-Api-Key": KEY})
    ).status_code == 201
    login("u1", "ada")
    item = (await client.get(NOTIFICATIONS)).json()["items"][0]
    assert (item["url"], item["description"], item["read"], item["read_at"]) == (None, "", False, None)


async def test_an_empty_link_means_no_link(client, login) -> None:
    await emit(client, ["u1"], url="   ")
    login("u1", "ada")
    assert (await client.get(NOTIFICATIONS)).json()["items"][0]["url"] is None


async def test_what_is_sent_is_checked(client) -> None:
    headers = {"X-Api-Key": KEY}
    bad = [
        {"user_ids": [], "title": "t"},
        {"title": "t"},
        {"user_ids": ["u1"]},
        {"user_ids": ["u1"], "title": "   "},
        {"user_ids": ["u1"], "title": "x" * 201},
        {"user_ids": ["u1"], "title": "t", "description": "x" * 2001},
        {"user_ids": [""], "title": "t"},
        {"user_ids": [str(i) for i in range(501)], "title": "t"},
    ]
    for body in bad:
        assert (await client.post(EMIT, json=body, headers=headers)).status_code == 422, body
