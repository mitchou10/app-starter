from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware

from app.auth.router import router as auth_router
from app.config import settings
from app.routers import admin_feedback_references, feedback_references, health, profile
from app.routers.errors import register_error_handlers

app = FastAPI(title=settings.APP_NAME, docs_url="/api/docs", openapi_url="/api/openapi.json")

# Only carries state/PKCE during the login redirect (short-lived, signed).
# The real session lives server-side, in app.auth.deps.store.
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.LOGIN_STATE_SECRET,
    session_cookie="login_state",
    max_age=600,
    same_site="lax",
    https_only=settings.SESSION_COOKIE_SECURE,
)

app.include_router(auth_router)
register_error_handlers(app)

app.include_router(health.router)
app.include_router(profile.router)
app.include_router(feedback_references.router)
app.include_router(admin_feedback_references.router)
