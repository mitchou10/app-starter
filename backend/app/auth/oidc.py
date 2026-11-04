"""The only module that talks to the identity provider, through standard OIDC (Authlib)."""

from functools import lru_cache
from typing import Any
from urllib.parse import urlencode

from authlib.integrations.starlette_client import OAuth

from app.auth.session import Session, now
from app.config import settings


@lru_cache
def get_oidc_client() -> Any:
    oauth = OAuth()
    oauth.register(
        name="oidc",
        client_id=settings.OIDC_CLIENT_ID,
        client_secret=settings.OIDC_CLIENT_SECRET,
        server_metadata_url=settings.discovery_url,
        client_kwargs={"scope": settings.OIDC_SCOPES, "code_challenge_method": "S256"},
    )
    return oauth.oidc


def session_from_token(token: dict[str, Any], previous: Session | None = None) -> Session:
    userinfo = dict(token.get("userinfo") or (previous.user if previous else {}))
    return Session(
        user=userinfo,
        access_token=token["access_token"],
        expires_at=float(token.get("expires_at") or now() + int(token.get("expires_in", 300))),
        # A refresh may not return a new refresh/id token: keep the previous ones.
        refresh_token=token.get("refresh_token") or (previous.refresh_token if previous else None),
        id_token=token.get("id_token") or (previous.id_token if previous else None),
        created_at=previous.created_at if previous else now(),
    )


async def refresh(session: Session) -> Session:
    token = await get_oidc_client().fetch_access_token(grant_type="refresh_token", refresh_token=session.refresh_token)
    return session_from_token(token, previous=session)


async def userinfo(access_token: str) -> dict[str, Any]:
    """Claims of a bearer access token (non-browser clients), asked to the provider rather than decoded here."""
    token = {"access_token": access_token, "token_type": "Bearer"}
    return dict(await get_oidc_client().userinfo(token=token))


async def logout_url(session: Session) -> str | None:
    """RP-initiated logout URL, if the provider advertises one."""
    metadata = await get_oidc_client().load_server_metadata()
    endpoint = metadata.get("end_session_endpoint")
    if not endpoint:
        return None
    params = {"post_logout_redirect_uri": settings.FRONTEND_URL, "client_id": settings.OIDC_CLIENT_ID}
    if session.id_token:
        params["id_token_hint"] = session.id_token
    return f"{endpoint}?{urlencode(params)}"
