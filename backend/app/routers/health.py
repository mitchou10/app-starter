from fastapi import APIRouter

from app.schemas import HealthOut

router = APIRouter(tags=["health"])


@router.get("/api/health")
def health() -> HealthOut:
    return HealthOut(status="ok")
