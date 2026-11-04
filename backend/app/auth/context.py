from typing import Any

from pydantic import BaseModel, Field

from app.config import settings


class RequestContext(BaseModel):
    """Who is asking. What the routes depend on: never the provider's raw claims."""

    user_id: str
    email: str = ""
    name: str = ""
    username: str = ""
    roles: list[str] = Field(default_factory=list)
    groups: list[str] = Field(default_factory=list)
    is_admin: bool = False
    # The user's own access token, for calling another service on their behalf: kept out of every repr and log.
    access_token: str | None = Field(default=None, repr=False, exclude=True)


def claim_path(claims: dict[str, Any], path: str) -> Any:
    """`realm_access.roles` -> claims["realm_access"]["roles"]; None when a step is missing."""
    value: Any = claims
    for key in path.split("."):
        if not isinstance(value, dict) or key not in value:
            return None
        value = value[key]
    return value


def _as_list(value: Any) -> list[str]:
    if isinstance(value, str):
        return [value]
    return [str(item) for item in value] if isinstance(value, list) else []


def context_from_claims(claims: dict[str, Any], access_token: str | None = None) -> RequestContext:
    roles = _as_list(claim_path(claims, settings.OIDC_ROLES_CLAIM))
    return RequestContext(
        user_id=str(claims["sub"]),
        email=claims.get("email", ""),
        name=claims.get("name", ""),
        username=claims.get("preferred_username", ""),
        roles=roles,
        groups=_as_list(claim_path(claims, settings.OIDC_GROUPS_CLAIM)),
        is_admin=settings.OIDC_ADMIN_ROLE in roles,
        access_token=access_token,
    )
