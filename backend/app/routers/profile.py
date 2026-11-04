from fastapi import APIRouter, HTTPException, Response, UploadFile, status

from app.auth.deps import CurrentUser
from app.routers.deps import ProfileServiceDep
from app.schemas import ProfileOut
from app.services.errors import AvatarNotFound, AvatarTooLarge, UnsupportedImage

router = APIRouter(prefix="/api/me", tags=["profile"])


@router.get("/profile", summary="What the app knows about the logged-in user")
async def get_profile(user: CurrentUser, service: ProfileServiceDep) -> ProfileOut:
    return ProfileOut.model_validate(await service.get_profile(user.user_id))


@router.get(
    "/avatar",
    summary="The profile photo",
    response_class=Response,
    responses={404: {"description": "No photo"}},
)
async def get_avatar(user: CurrentUser, service: ProfileServiceDep) -> Response:
    try:
        avatar = await service.get_avatar(user.user_id)
    except AvatarNotFound:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No profile photo") from None
    return Response(
        avatar.data,
        media_type=avatar.content_type,
        # The URL carries the version of the photo, so it can be kept; `private`: it is not for shared caches.
        headers={"Cache-Control": "private, max-age=86400", "X-Content-Type-Options": "nosniff"},
    )


@router.put("/avatar", summary="Upload or replace the profile photo (PNG, JPEG or WebP)")
async def put_avatar(file: UploadFile, user: CurrentUser, service: ProfileServiceDep) -> ProfileOut:
    # Never read more than the limit: a huge upload must not end up in memory.
    data = await file.read(service.max_avatar_bytes + 1)
    try:
        profile = await service.set_avatar(user.user_id, data)
    except AvatarTooLarge:
        raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, "The photo is too large") from None
    except UnsupportedImage:
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "The photo must be a PNG, JPEG or WebP image"
        ) from None
    return ProfileOut.model_validate(profile)


@router.delete("/avatar", status_code=status.HTTP_204_NO_CONTENT, summary="Remove the profile photo")
async def delete_avatar(user: CurrentUser, service: ProfileServiceDep) -> Response:
    await service.delete_avatar(user.user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
