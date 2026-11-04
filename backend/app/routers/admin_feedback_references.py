import uuid

from fastapi import APIRouter, Depends, status

from app.auth.deps import require_admin
from app.routers.deps import ActorDep, StatusServiceDep, TypeServiceDep
from app.schemas import (
    FeedbackStatusIn,
    FeedbackStatusOut,
    FeedbackStatusUpdate,
    FeedbackTypeIn,
    FeedbackTypeOut,
    FeedbackTypeUpdate,
)

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.post("/feedback-types", status_code=status.HTTP_201_CREATED, summary="Add a type of feedback")
async def create_type(data: FeedbackTypeIn, actor: ActorDep, service: TypeServiceDep) -> FeedbackTypeOut:
    return FeedbackTypeOut.model_validate(await service.create(actor, **data.model_dump()))


@router.patch("/feedback-types/{type_id}", summary="Rename, recolor, reorder, archive or restore a type")
async def update_type(type_id: uuid.UUID, data: FeedbackTypeUpdate, service: TypeServiceDep) -> FeedbackTypeOut:
    return FeedbackTypeOut.model_validate(await service.update(type_id, **data.model_dump(exclude_none=True)))


@router.post("/feedback-statuses", status_code=status.HTTP_201_CREATED, summary="Add a status of feedback")
async def create_status(data: FeedbackStatusIn, actor: ActorDep, service: StatusServiceDep) -> FeedbackStatusOut:
    return FeedbackStatusOut.model_validate(await service.create(actor, **data.model_dump()))


@router.patch("/feedback-statuses/{status_id}", summary="Rename, recolor, reorder, archive or restore a status")
async def update_status(
    status_id: uuid.UUID, data: FeedbackStatusUpdate, service: StatusServiceDep
) -> FeedbackStatusOut:
    return FeedbackStatusOut.model_validate(await service.update(status_id, **data.model_dump(exclude_none=True)))
