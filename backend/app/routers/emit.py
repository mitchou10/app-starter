from fastapi import APIRouter, status

from app.auth.emitters import Emitter
from app.routers.deps import NotificationServiceDep
from app.schemas import NotificationIn
from app.schemas.notification import EmittedOut

router = APIRouter(prefix="/api/emit", tags=["emitters"])


@router.post(
    "/notifications",
    status_code=status.HTTP_201_CREATED,
    summary="For other applications: tell users something (authenticated by `X-Api-Key`)",
)
async def emit_notification(data: NotificationIn, emitter: Emitter, service: NotificationServiceDep) -> EmittedOut:
    """The `source` of the notification is the name the key belongs to: an application cannot claim to be another."""
    created = await service.emit(
        emitter, user_ids=data.user_ids, title=data.title, description=data.description, url=data.url
    )
    return EmittedOut(created=created)
