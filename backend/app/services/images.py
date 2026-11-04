"""Checks on an uploaded image (profile photo, screenshot). Pure functions: no I/O."""

from app.services.errors import ImageTooLarge, UnsupportedImage

# SVG is left out on purpose: it can carry scripts, and is served back from the app's own origin.
_SIGNATURES = (
    (b"\x89PNG\r\n\x1a\n", "image/png"),
    (b"\xff\xd8\xff", "image/jpeg"),
)


def detect_image_type(data: bytes) -> str | None:
    """The content type from the bytes themselves (never from the name or the header sent by the client)."""
    for signature, content_type in _SIGNATURES:
        if data.startswith(signature):
            return content_type
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


def validate_image(data: bytes, max_bytes: int) -> str:
    """The content type of a valid image; raises when it is too large or not a PNG, JPEG or WebP image."""
    if len(data) > max_bytes:
        raise ImageTooLarge
    content_type = detect_image_type(data)
    if content_type is None:
        raise UnsupportedImage
    return content_type
