import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from pydantic import StringConstraints

from app.routers.deps import ActorDep, FeedbackServiceDep, WorkflowDep
from app.routers.params import ListParams
from app.routers.uploads import read_uploads
from app.schemas import FeedbackChange, FeedbackOut, FeedbackSummaryOut, Page

router = APIRouter(prefix="/api/feedback", tags=["feedback"])

Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
Description = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=10_000)]


@router.post("", status_code=status.HTTP_201_CREATED, summary="Send a feedback (with up to 5 screenshots)")
async def create_feedback(
    actor: ActorDep,
    service: FeedbackServiceDep,
    title: Annotated[Title, Form()],
    description: Annotated[Description, Form()],
    type_id: Annotated[uuid.UUID, Form()],
    page: Annotated[str | None, Form(max_length=2048)] = None,
    files: Annotated[list[UploadFile] | None, File()] = None,
) -> FeedbackOut:
    feedback = await service.create(
        actor, title=title, description=description, type_id=type_id, page=page, uploads=await read_uploads(files)
    )
    return FeedbackOut.model_validate(feedback)


@router.get("", summary="My feedback, the most recently updated first")
async def list_my_feedback(
    actor: ActorDep, service: FeedbackServiceDep, params: Annotated[ListParams, Depends()]
) -> Page[FeedbackSummaryOut]:
    rows, total = await service.list_page(
        actor, everyone=False, status=params.status, type_id=params.type_id, limit=params.limit, offset=params.offset
    )
    return Page(
        items=[FeedbackSummaryOut.from_row(row) for row in rows], total=total, limit=params.limit, offset=params.offset
    )


@router.get("/{feedback_id}", summary="One feedback: its author and the admins only")
async def get_feedback(feedback_id: uuid.UUID, actor: ActorDep, service: FeedbackServiceDep) -> FeedbackOut:
    return FeedbackOut.model_validate(await service.get(actor, feedback_id))


@router.patch("/{feedback_id}", summary="Change the status or the type")
async def change_feedback(
    feedback_id: uuid.UUID, data: FeedbackChange, actor: ActorDep, workflow: WorkflowDep
) -> FeedbackOut:
    feedback = await workflow.change(actor, feedback_id, status_id=data.status_id, type_id=data.type_id)
    return FeedbackOut.model_validate(feedback)
