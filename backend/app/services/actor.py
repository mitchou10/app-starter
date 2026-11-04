from pydantic import BaseModel


class Actor(BaseModel):
    """Who does something, as the services need to know it. Built from the logged-in user by the routers, so the
    services depend on nothing of the authentication."""

    user_id: str
    username: str
    is_admin: bool = False
