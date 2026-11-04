from dataclasses import asdict

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse, RedirectResponse, Response

from app.auth import deps, oidc
from app.auth.session import new_session_id
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _require_oidc() -> None:
    if settings.AUTH_MODE != "oidc" or not settings.OIDC_ISSUER:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Authentication is not configured")


def _is_safe_internal_path(path: str) -> bool:
    """Rejects anything that could send the browser off-site after login ("//evil.com", "https://evil.com")."""
    return path.startswith("/") and not path.startswith("//")


@router.get(
    "/login", dependencies=[Depends(_require_oidc)], summary="Redirect the browser to the provider's login page"
)
async def login(request: Request, redirect: str = "/") -> Response:
    request.session["next"] = redirect if _is_safe_internal_path(redirect) else "/"
    return await oidc.get_oidc_client().authorize_redirect(request, settings.callback_url)


@router.get("/callback", dependencies=[Depends(_require_oidc)], summary="Exchange the authorization code for a session")
async def callback(request: Request) -> Response:
    try:
        token = await oidc.get_oidc_client().authorize_access_token(request)
    except Exception:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Login failed") from None
    next_path = request.session.pop("next", "/")
    sid = new_session_id()
    deps.store.set(sid, oidc.session_from_token(token))
    response = RedirectResponse(settings.FRONTEND_URL.rstrip("/") + next_path)
    deps.set_session_cookie(response, sid)
    return response


@router.get("/me", summary="The logged-in user")
async def me(user: deps.CurrentUser) -> dict:
    return asdict(user) | {"access_token": None}


@router.post("/logout", summary="End the session; `logout_url` (when present) also ends the provider's")
async def logout(request: Request) -> Response:
    sid = request.cookies.get(settings.SESSION_COOKIE_NAME)
    session = deps.store.get(sid) if sid else None
    url = None
    if session is not None:
        try:
            url = await oidc.logout_url(session)
        except Exception:
            url = None
    if sid:
        deps.store.delete(sid)
    response = JSONResponse({"logout_url": url})
    response.delete_cookie(settings.SESSION_COOKIE_NAME, path="/")
    return response
