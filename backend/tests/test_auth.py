import pytest
from fastapi.testclient import TestClient

from app.auth import deps, oidc
from app.auth.session import MemorySessionStore, Session, now
from app.config import settings
from app.main import app

client = TestClient(app, follow_redirects=False)


@pytest.fixture(autouse=True)
def fresh_store(monkeypatch: pytest.MonkeyPatch) -> MemorySessionStore:
    store = MemorySessionStore()
    monkeypatch.setattr(deps, "store", store)
    monkeypatch.setattr(settings, "SESSION_COOKIE_SECURE", False)  # the test client speaks plain HTTP
    client.cookies.clear()  # the client is shared: no cookie may leak from a previous test
    return store


def make_session(**kwargs) -> Session:
    defaults = {
        "user": {"sub": "1", "name": "Ada", "email": "ada@example.com", "preferred_username": "ada"},
        "access_token": "at",
        "expires_at": now() + 3600,
        "refresh_token": "rt",
        "id_token": "idt",
        "created_at": now(),
    }
    return Session(**{**defaults, **kwargs})


class FakeClient:
    def __init__(self, end_session: str | None = "https://idp/logout") -> None:
        self.end_session = end_session

    async def authorize_redirect(self, request, redirect_uri):
        from fastapi.responses import RedirectResponse

        return RedirectResponse(f"https://idp/auth?redirect_uri={redirect_uri}")

    async def authorize_access_token(self, request):
        return {
            "access_token": "at",
            "expires_in": 300,
            "refresh_token": "rt",
            "id_token": "idt",
            "userinfo": {"sub": "1", "name": "Ada"},
        }

    async def fetch_access_token(self, **kwargs):
        return {"access_token": "new-at", "expires_in": 300}

    async def load_server_metadata(self):
        return {"end_session_endpoint": self.end_session} if self.end_session else {}


@pytest.fixture
def idp(monkeypatch: pytest.MonkeyPatch) -> FakeClient:
    fake = FakeClient()
    monkeypatch.setattr(settings, "OIDC_ISSUER", "https://idp")
    monkeypatch.setattr(oidc, "get_oidc_client", lambda: fake)
    return fake


def login(store: MemorySessionStore, session: Session | None = None) -> None:
    store.set("sid1", session or make_session())
    client.cookies.set(settings.SESSION_COOKIE_NAME, "sid1")


def test_me_requires_a_session() -> None:
    client.cookies.clear()
    assert client.get("/api/auth/me").status_code == 401


def test_me_returns_the_user(fresh_store: MemorySessionStore) -> None:
    login(fresh_store)
    body = client.get("/api/auth/me").json()
    assert body["user_id"] == "1" and body["email"] == "ada@example.com" and body["username"] == "ada"
    assert "access_token" not in body


def test_expired_session_is_rejected(fresh_store: MemorySessionStore) -> None:
    login(fresh_store, make_session(created_at=now() - settings.SESSION_TTL_SECONDS - 1))
    assert client.get("/api/auth/me").status_code == 401
    assert fresh_store.get("sid1") is None


def test_access_token_is_refreshed(fresh_store: MemorySessionStore, idp: FakeClient) -> None:
    login(fresh_store, make_session(expires_at=now() - 1))
    assert client.get("/api/auth/me").status_code == 200
    refreshed = fresh_store.get("sid1")
    assert refreshed is not None and refreshed.access_token == "new-at"
    assert refreshed.refresh_token == "rt"  # kept: the provider did not rotate it
    assert refreshed.user["name"] == "Ada"


def test_expired_without_refresh_token(fresh_store: MemorySessionStore) -> None:
    login(fresh_store, make_session(expires_at=now() - 1, refresh_token=None))
    assert client.get("/api/auth/me").status_code == 401


def test_failed_refresh_ends_the_session(fresh_store: MemorySessionStore, idp: FakeClient, monkeypatch) -> None:
    async def boom(**kwargs):
        raise RuntimeError("revoked")

    monkeypatch.setattr(idp, "fetch_access_token", boom)
    login(fresh_store, make_session(expires_at=now() - 1))
    assert client.get("/api/auth/me").status_code == 401
    assert fresh_store.get("sid1") is None


def test_login_is_unavailable_without_config() -> None:
    assert client.get("/api/auth/login").status_code == 503


def test_login_redirects_to_the_provider(idp: FakeClient) -> None:
    response = client.get("/api/auth/login")
    assert response.status_code in (302, 307)
    assert response.headers["location"].startswith("https://idp/auth")
    assert "/api/auth/callback" in response.headers["location"]


def test_callback_creates_a_session(fresh_store: MemorySessionStore, idp: FakeClient) -> None:
    client.cookies.clear()
    response = client.get("/api/auth/callback")
    assert response.headers["location"] == settings.FRONTEND_URL + "/"
    cookie = response.headers["set-cookie"]
    assert "HttpOnly" in cookie and "SameSite=lax" in cookie
    assert client.get("/api/auth/me").json()["name"] == "Ada"


def test_callback_failure(idp: FakeClient, monkeypatch) -> None:
    async def boom(request):
        raise RuntimeError("bad state")

    monkeypatch.setattr(idp, "authorize_access_token", boom)
    assert client.get("/api/auth/callback").status_code == 400


def test_logout_returns_provider_url(fresh_store: MemorySessionStore, idp: FakeClient) -> None:
    login(fresh_store)
    response = client.post("/api/auth/logout")
    assert response.json()["logout_url"].startswith("https://idp/logout?")
    assert "id_token_hint=idt" in response.json()["logout_url"]
    assert fresh_store.get("sid1") is None


def test_logout_without_provider_endpoint(fresh_store: MemorySessionStore, idp: FakeClient) -> None:
    idp.end_session = None
    login(fresh_store)
    assert client.post("/api/auth/logout").json() == {"logout_url": None}


def test_logout_without_session() -> None:
    client.cookies.clear()
    assert client.post("/api/auth/logout").json() == {"logout_url": None}


def test_roles_and_groups_come_from_configurable_claims(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.auth.context import context_from_claims

    monkeypatch.setattr(settings, "OIDC_ROLES_CLAIM", "realm_access.roles")
    claims = {"sub": "1", "realm_access": {"roles": ["admin", "user"]}, "groups": "team-a"}
    context = context_from_claims(claims, access_token="secret")
    assert context.roles == ["admin", "user"] and context.is_admin and context.groups == ["team-a"]
    assert "secret" not in repr(context)
    assert context_from_claims({"sub": "2"}).roles == []


def test_bearer_token(idp: FakeClient, monkeypatch: pytest.MonkeyPatch) -> None:
    async def userinfo(token):
        assert token["access_token"] == "tok"
        return {"sub": "9", "email": "bot@example.com"}

    monkeypatch.setattr(idp, "userinfo", userinfo, raising=False)
    client.cookies.clear()
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer tok"})
    assert response.json()["user_id"] == "9"


def test_invalid_bearer_token(idp: FakeClient, monkeypatch: pytest.MonkeyPatch) -> None:
    async def userinfo(token):
        raise RuntimeError("invalid")

    monkeypatch.setattr(idp, "userinfo", userinfo, raising=False)
    client.cookies.clear()
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer nope"}).status_code == 401


def test_full_access_mode(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "AUTH_MODE", "full-access")
    client.cookies.clear()
    body = client.get("/api/auth/me").json()
    assert body["user_id"] == "dev-user" and body["is_admin"]


def test_login_only_keeps_internal_redirects(idp: FakeClient) -> None:
    client.cookies.clear()
    assert client.get("/api/auth/login?redirect=//evil.com").status_code in (302, 307)
    assert client.get("/api/auth/login?redirect=/settings").status_code in (302, 307)
