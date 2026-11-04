import uuid
from datetime import UTC, datetime

import pytest

from app.services.cursor import decode_cursor, encode_cursor
from app.services.errors import InvalidCursor


def test_a_cursor_gives_back_what_it_holds() -> None:
    when, item = datetime(2026, 11, 4, 12, 30, 15, 123456, tzinfo=UTC), uuid.uuid4()
    cursor = encode_cursor(when, item)
    assert decode_cursor(cursor) == (when, item)
    assert "=" not in cursor and "|" not in cursor  # safe in an address


@pytest.mark.parametrize("cursor", ["", "!!!", "bm90fHRoaXM", "MjAyNi0xMS0wNHxub3QtYS11dWlk"])
def test_a_cursor_that_is_not_one_is_refused(cursor: str) -> None:
    with pytest.raises(InvalidCursor):
        decode_cursor(cursor)
