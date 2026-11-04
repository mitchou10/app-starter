import uuid

from fastapi import APIRouter, Response

from app.routers.deps import ActorDep, FeedbackServiceDep

router = APIRouter(prefix="/api/feedback/{feedback_id}/attachments", tags=["feedback"])


@router.get("/{attachment_id}", summary="A screenshot", response_class=Response)
async def get_attachment(
    feedback_id: uuid.UUID, attachment_id: uuid.UUID, actor: ActorDep, service: FeedbackServiceDep
) -> Response:
    image = await service.get_screenshot(actor, feedback_id, attachment_id)
    return Response(
        image.data,
        media_type=image.content_type,
        headers={"Cache-Control": "private, max-age=86400", "X-Content-Type-Options": "nosniff"},
    )
