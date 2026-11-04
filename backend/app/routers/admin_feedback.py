from typing import Annotated

from fastapi import APIRouter, Depends

from app.auth.deps import require_admin
from app.routers.deps import ActorDep, FeedbackServiceDep
from app.routers.params import ListParams
from app.schemas import FeedbackSummaryOut, Page

router = APIRouter(prefix="/api/admin/feedback", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("", summary="All the feedback, whoever sent it")
async def list_all_feedback(
    actor: ActorDep, service: FeedbackServiceDep, params: Annotated[ListParams, Depends()]
) -> Page[FeedbackSummaryOut]:
    rows, total = await service.list_page(
        actor, everyone=True, status=params.status, type_id=params.type_id, limit=params.limit, offset=params.offset
    )
    return Page(
        items=[FeedbackSummaryOut.from_row(row) for row in rows], total=total, limit=params.limit, offset=params.offset
    )
