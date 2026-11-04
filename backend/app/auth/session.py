"""Server-side sessions: tokens stay on the server, the browser only gets an opaque id."""

import secrets
import time
from typing import Any, Protocol

from pydantic import BaseModel


class Session(BaseModel):
    user: dict[str, Any]
    access_token: str
    expires_at: float  # access token expiry, epoch seconds
    refresh_token: str | None = None
    id_token: str | None = None
    created_at: float = 0.0


class SessionStore(Protocol):
    """Swap the in-memory store for Redis (or a database) to run several replicas."""

    def get(self, sid: str) -> Session | None: ...
    def set(self, sid: str, session: Session) -> None: ...
    def delete(self, sid: str) -> None: ...


class MemorySessionStore:
    def __init__(self) -> None:
        self._sessions: dict[str, Session] = {}

    def get(self, sid: str) -> Session | None:
        return self._sessions.get(sid)

    def set(self, sid: str, session: Session) -> None:
        self._sessions[sid] = session

    def delete(self, sid: str) -> None:
        self._sessions.pop(sid, None)


def new_session_id() -> str:
    return secrets.token_urlsafe(32)


def now() -> float:
    return time.time()
