from pydantic import BaseModel, ConfigDict


class UserOut(BaseModel):
    """The logged-in user, as the frontend sees them. Never the tokens."""

    model_config = ConfigDict(from_attributes=True)

    user_id: str
    email: str
    name: str
    username: str
    roles: list[str]
    groups: list[str]
    is_admin: bool


class LogoutOut(BaseModel):
    # Where to send the browser to also end the session at the identity provider; None when it has no such page.
    logout_url: str | None
