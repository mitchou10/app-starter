"""The errors services raise. They know nothing about HTTP: `app/routers/errors.py` turns them into answers."""


class ServiceError(Exception):
    """Base of every error a service raises on purpose."""

    message = "Something went wrong"

    def __init__(self, message: str | None = None) -> None:
        super().__init__(message or self.message)


# ---- images (profile photo, screenshots)
class ImageTooLarge(ServiceError):
    message = "The image is too large"


class UnsupportedImage(ServiceError):
    message = "The image must be a PNG, JPEG or WebP"


# ---- profile
class ProfileError(ServiceError):
    pass


class AvatarNotFound(ProfileError):
    message = "No profile photo"


# ---- feedback
class FeedbackNotFound(ServiceError):
    """Also used when the feedback exists but the user may not see it: it must look like it does not exist."""

    message = "This feedback does not exist"


class AttachmentNotFound(ServiceError):
    message = "This screenshot does not exist"


class ReferenceNotFound(ServiceError):
    message = "This type or status does not exist"


class ReferenceArchived(ServiceError):
    message = "This type or status is archived and can no longer be chosen"


class DuplicateName(ServiceError):
    message = "A value with this name already exists"


class ProtectedStatus(ServiceError):
    message = "This status is used by the app itself and cannot be archived"


class NotAllowed(ServiceError):
    message = "You are not allowed to do this"


class TooManyAttachments(ServiceError):
    message = "Too many screenshots"
