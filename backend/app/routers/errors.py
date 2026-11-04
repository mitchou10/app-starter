"""Turns the errors of the services into HTTP answers. The services know nothing about status codes."""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.services import errors

STATUS_CODES: dict[type[errors.ServiceError], int] = {
    errors.FeedbackNotFound: status.HTTP_404_NOT_FOUND,
    errors.AttachmentNotFound: status.HTTP_404_NOT_FOUND,
    errors.ReferenceNotFound: status.HTTP_404_NOT_FOUND,
    errors.AvatarNotFound: status.HTTP_404_NOT_FOUND,
    errors.NotAllowed: status.HTTP_403_FORBIDDEN,
    errors.DuplicateName: status.HTTP_409_CONFLICT,
    errors.ProtectedStatus: status.HTTP_409_CONFLICT,
    errors.ImageTooLarge: status.HTTP_413_CONTENT_TOO_LARGE,
    errors.UnsupportedImage: status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
    errors.InvalidReference: status.HTTP_422_UNPROCESSABLE_CONTENT,
    errors.ReferenceArchived: status.HTTP_422_UNPROCESSABLE_CONTENT,
    errors.TooManyAttachments: status.HTTP_422_UNPROCESSABLE_CONTENT,
}


def status_code_of(error: errors.ServiceError) -> int:
    """The code of the error; one nobody mapped is a bad request."""
    return next((code for cls, code in STATUS_CODES.items() if isinstance(error, cls)), status.HTTP_400_BAD_REQUEST)


def register_error_handlers(app: FastAPI) -> None:
    async def handle(request: Request, error: Exception) -> JSONResponse:
        assert isinstance(error, errors.ServiceError)
        return JSONResponse({"detail": str(error)}, status_code=status_code_of(error))

    app.add_exception_handler(errors.ServiceError, handle)
