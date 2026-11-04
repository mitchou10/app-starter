import pytest

from app.services.avatar import detect_image_type, validate_avatar
from app.services.errors import AvatarTooLarge, UnsupportedImage

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 8


@pytest.mark.parametrize(
    ("data", "expected"),
    [
        (PNG, "image/png"),
        (b"\xff\xd8\xff\xe0" + b"x" * 8, "image/jpeg"),
        (b"RIFF\x00\x00\x00\x00WEBPVP8 ", "image/webp"),
        (b"GIF89a....", None),
        (b"<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>", None),
        (b"RIFF\x00\x00\x00\x00WAVEfmt ", None),
        (b"", None),
    ],
)
def test_the_type_comes_from_the_bytes(data: bytes, expected: str | None) -> None:
    assert detect_image_type(data) == expected


def test_a_valid_photo_gives_its_type() -> None:
    assert validate_avatar(PNG, max_bytes=100) == "image/png"


def test_too_large() -> None:
    with pytest.raises(AvatarTooLarge):
        validate_avatar(PNG, max_bytes=len(PNG) - 1)


def test_not_an_image() -> None:
    with pytest.raises(UnsupportedImage):
        validate_avatar(b"hello", max_bytes=100)
