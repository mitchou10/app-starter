import uuid
from typing import Annotated

from fastapi import APIRouter, Query

from app.auth.deps import CurrentUser
from app.config import settings
from app.routers.deps import NotificationServiceDep
from app.schemas import MarkedReadOut, NotificationOut, NotificationRead, Page, UnreadCountOut

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", summary="My notifications, the newest first")
async def list_notifications(
    user: CurrentUser,
    service: NotificationServiceDep,
    unread: Annotated[bool, Query(description="Only the ones not read yet")] = False,
    limit: Annotated[int, Query(ge=1, le=settings.PAGE_SIZE_MAX)] = 10,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> Page[NotificationOut]:
    items, total = await service.page(user.user_id, unread_only=unread, limit=limit, offset=offset)
    return Page(items=[NotificationOut.model_validate(n) for n in items], total=total, limit=limit, offset=offset)


@router.get("/unread-count", summary="How many I have not read: what the badge shows")
async def unread_count(user: CurrentUser, service: NotificationServiceDep) -> UnreadCountOut:
    return UnreadCountOut(count=await service.unread_count(user.user_id))


@router.post("/read-all", summary="Mark all of mine as read")
async def read_all(user: CurrentUser, service: NotificationServiceDep) -> MarkedReadOut:
    return MarkedReadOut(updated=await service.mark_all_read(user.user_id))


@router.patch("/{notification_id}", summary="Mark one as read, or as unread again")
async def set_read(
    notification_id: uuid.UUID, data: NotificationRead, user: CurrentUser, service: NotificationServiceDep
) -> NotificationOut:
    return NotificationOut.model_validate(await service.set_read(user.user_id, notification_id, read=data.read))
