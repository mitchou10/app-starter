from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True, env_file=(".env", ".env.local"), extra="ignore")

    APP_NAME: str = "app"

    # PostgreSQL, through asyncpg.
    DATABASE_URL: str = "postgresql+asyncpg://app:app@localhost:5432/app"

    # Object storage: RustFS here, any S3-compatible service works. The usual AWS_* variables, like the SDKs read them.
    AWS_ENDPOINT_URL: str = "http://localhost:9000"
    AWS_ACCESS_KEY_ID: str = "rustfsadmin"
    AWS_SECRET_ACCESS_KEY: str = "rustfsadmin"
    AWS_REGION: str = "us-east-1"
    AWS_BUCKET: str = "app"
    AVATAR_MAX_BYTES: int = 2 * 1024 * 1024

    # Feedback: the screenshots of a feedback or of an answer, and the biggest page a list can ask for.
    FEEDBACK_MAX_ATTACHMENTS: int = 5
    FEEDBACK_ATTACHMENT_MAX_BYTES: int = 5 * 1024 * 1024
    PAGE_SIZE_MAX: int = 50

    # Notifications: the applications allowed to emit them, as `name=key` pairs separated by commas. The name becomes
    # the `source` of what they emit; a key shorter than 16 characters is ignored. Empty: nobody can emit.
    NOTIFICATION_API_KEYS: str = ""

    # "oidc": real authentication. "full-access": no identity provider, a fixed dev identity for every request
    # (local development without Keycloak, unit tests).
    AUTH_MODE: Literal["oidc", "full-access"] = "oidc"

    # OpenID Connect. Any compliant provider works (Keycloak, Entra ID, Auth0, Dex...): no code depends on one.
    OIDC_ISSUER: str = ""
    # Where to fetch the discovery document when the provider is not reached on its public address (Docker name,
    # internal URL...). Defaults to <issuer>/.well-known/openid-configuration.
    OIDC_DISCOVERY_URL: str = ""
    OIDC_CLIENT_ID: str = "app-backend"
    OIDC_CLIENT_SECRET: str = ""
    OIDC_SCOPES: str = "openid profile email"
    # Where the roles and groups are in the claims. Dotted path for nested claims: Keycloak puts the realm roles in
    # `realm_access.roles`, other providers use a flat `roles` or `groups`.
    OIDC_ROLES_CLAIM: str = "roles"
    OIDC_GROUPS_CLAIM: str = "groups"
    OIDC_ADMIN_ROLE: str = "admin"

    # Server-side session: the browser only holds an opaque id in an HttpOnly cookie.
    SESSION_COOKIE_NAME: str = "session"
    SESSION_COOKIE_SECURE: bool = True  # turned off for plain-HTTP local development
    SESSION_COOKIE_SAMESITE: Literal["lax", "strict", "none"] = "lax"
    SESSION_TTL_SECONDS: int = 8 * 3600
    # Signs the short-lived cookie that carries state/PKCE during the login redirect.
    LOGIN_STATE_SECRET: str = "dev-only-secret-not-for-prod"

    # Public URL the browser uses to reach the backend: builds the redirect_uri to register in the provider
    # ({BACKEND_PUBLIC_URL}/api/auth/callback). Where the browser lands after login/logout.
    BACKEND_PUBLIC_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:5173"

    @property
    def discovery_url(self) -> str:
        return self.OIDC_DISCOVERY_URL or f"{self.OIDC_ISSUER.rstrip('/')}/.well-known/openid-configuration"

    @property
    def notification_emitters(self) -> dict[str, str]:
        """The key of each emitter, and its name: `{"the-key": "billing"}`."""
        pairs = (pair.partition("=") for pair in self.NOTIFICATION_API_KEYS.split(",") if pair.strip())
        return {key.strip(): name.strip() for name, _, key in pairs if name.strip() and len(key.strip()) >= 16}

    @property
    def callback_url(self) -> str:
        return f"{self.BACKEND_PUBLIC_URL.rstrip('/')}/api/auth/callback"


settings = Settings()
