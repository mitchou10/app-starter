import uuid
from typing import Annotated

from fastapi import APIRouter, File, Form, Query, UploadFile, status

from app.config import settings
from app.routers.deps import ActorDep, MessageServiceDep
from app.routers.uploads import read_uploads
from app.schemas import MessageOut, MessagesPageOut

router = APIRouter(prefix="/api/feedback/{feedback_id}/messages", tags=["feedback"])


@router.get("", summary="The follow-up: the newest messages, then older ones with `before`")
async def list_messages(
    feedback_id: uuid.UUID,
    actor: ActorDep,
    service: MessageServiceDep,
    limit: Annotated[int, Query(ge=1, le=settings.PAGE_SIZE_MAX)] = 10,
    before: Annotated[str | None, Query(description="The `next_before` of the previous page")] = None,
) -> MessagesPageOut:
    page = await service.page(actor, feedback_id, limit=limit, before=before)
    return MessagesPageOut(
        items=[MessageOut.model_validate(message) for message in page.items],
        total=page.total,
        next_before=page.next_before,
    )


@router.post("", status_code=status.HTTP_201_CREATED, summary="Answer (with up to 5 screenshots)")
async def add_message(
    feedback_id: uuid.UUID,
    actor: ActorDep,
    service: MessageServiceDep,
    body: Annotated[str, Form(max_length=10_000)],
    files: Annotated[list[UploadFile] | None, File()] = None,
) -> MessageOut:
    message = await service.add_comment(actor, feedback_id, body=body, uploads=await read_uploads(files))
    return MessageOut.model_validate(message)
