from typing import Annotated

from fastapi import Depends, HTTPException, Request, Response, status

from app.auth import oidc
from app.auth.context import RequestContext, context_from_claims
from app.auth.session import MemorySessionStore, Session, SessionStore, now
from app.config import settings

store: SessionStore = MemorySessionStore()

# Refresh a little before the access token really expires.
LEEWAY_SECONDS = 30


def set_session_cookie(response: Response, sid: str) -> None:
    response.set_cookie(
        settings.SESSION_COOKIE_NAME,
        sid,
        max_age=settings.SESSION_TTL_SECONDS,
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        path="/",
    )


async def session_of(request: Request) -> Session | None:
    """The session behind the cookie (access token refreshed if needed), or None."""
    sid = request.cookies.get(settings.SESSION_COOKIE_NAME)
    session = store.get(sid) if sid else None
    if sid is None or session is None:
        return None
    if now() - session.created_at > settings.SESSION_TTL_SECONDS:
        store.delete(sid)
        return None
    if session.expires_at - LEEWAY_SECONDS > now():
        return session
    if not session.refresh_token:
        store.delete(sid)
        return None
    try:
        session = await oidc.refresh(session)
    except Exception:
        store.delete(sid)
        return None
    store.set(sid, session)
    return session


async def bearer_context(request: Request) -> RequestContext | None:
    """Non-browser clients: `Authorization: Bearer <access token>`."""
    authorization = request.headers.get("Authorization", "")
    if not authorization.startswith("Bearer "):
        return None
    token = authorization.removeprefix("Bearer ")
    try:
        return context_from_claims(await oidc.userinfo(token), access_token=token)
    except Exception:
        return None


async def get_current_user(request: Request) -> RequestContext:
    if settings.AUTH_MODE == "full-access":
        return RequestContext(user_id="dev-user", email="dev@example.com", name="Dev", roles=["admin"], is_admin=True)
    context = await bearer_context(request)
    if context is None and (session := await session_of(request)) is not None:
        context = context_from_claims(session.user, access_token=session.access_token)
    if context is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    return context


CurrentUser = Annotated[RequestContext, Depends(get_current_user)]
