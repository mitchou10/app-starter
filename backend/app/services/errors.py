class ProfileError(Exception):
    """Base of the errors the profile service raises: the routes turn them into HTTP answers."""


class AvatarTooLarge(ProfileError):
    pass


class UnsupportedImage(ProfileError):
    pass


class AvatarNotFound(ProfileError):
    pass
