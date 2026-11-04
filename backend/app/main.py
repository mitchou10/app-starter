from fastapi import FastAPI

from app.config import settings

app = FastAPI(title=settings.name, docs_url="/api/docs", openapi_url="/api/openapi.json")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
