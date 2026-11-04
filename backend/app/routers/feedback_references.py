from fastapi import APIRouter

from app.auth.deps import CurrentUser
from app.routers.deps import StatusServiceDep, TypeServiceDep
from app.schemas import FeedbackStatusOut, FeedbackTypeOut

router = APIRouter(prefix="/api", tags=["feedback"])


@router.get("/feedback-types", summary="The types of feedback, the archived ones included (flagged)")
async def list_types(_: CurrentUser, service: TypeServiceDep) -> list[FeedbackTypeOut]:
    return [FeedbackTypeOut.model_validate(item) for item in await service.list()]


@router.get("/feedback-statuses", summary="The statuses of feedback, the archived ones included (flagged)")
async def list_statuses(_: CurrentUser, service: StatusServiceDep) -> list[FeedbackStatusOut]:
    return [FeedbackStatusOut.model_validate(item) for item in await service.list()]
