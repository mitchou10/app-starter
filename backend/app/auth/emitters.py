"""The applications that emit notifications: they are known by an API key, not by a user's session."""

import hmac
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status

from app.config import settings


async def get_emitter(
    x_api_key: Annotated[str | None, Header(description="The key of the emitting application")] = None,
) -> str:
    """Dependency: the name of the application that owns the `X-Api-Key`; 401 for an unknown or missing one."""
    if x_api_key:
        # Every key is compared, whatever the answer: the time taken says nothing about how close a guess was.
        found = None
        for key, name in settings.notification_emitters.items():
            if hmac.compare_digest(key.encode(), x_api_key.encode()):
                found = name
        if found is not None:
            return found
    raise HTTPException(
        status.HTTP_401_UNAUTHORIZED, "Unknown or missing API key", headers={"WWW-Authenticate": "ApiKey"}
    )


Emitter = Annotated[str, Depends(get_emitter)]
