"""The cursor of a paginated list: where the next page starts, as an opaque string the client sends back."""

import base64
import uuid
from datetime import datetime

from app.services.errors import InvalidCursor


def encode_cursor(created_at: datetime, item_id: uuid.UUID) -> str:
    raw = f"{created_at.isoformat()}|{item_id}".encode()
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def decode_cursor(cursor: str) -> tuple[datetime, uuid.UUID]:
    try:
        padded = cursor + "=" * (-len(cursor) % 4)
        stamp, _, item_id = base64.urlsafe_b64decode(padded).decode().partition("|")
        return datetime.fromisoformat(stamp), uuid.UUID(item_id)
    except ValueError:  # includes a bad encoding, a bad date and a bad id
        raise InvalidCursor from None
