from functools import lru_cache

from app.config import settings
from app.storage.base import ObjectStore
from app.storage.s3 import S3Store


@lru_cache
def get_store() -> ObjectStore:
    """Dependency: the store of the app, configured by the AWS_* variables. Tests replace it."""
    return S3Store(
        bucket=settings.AWS_BUCKET,
        endpoint_url=settings.AWS_ENDPOINT_URL,
        access_key_id=settings.AWS_ACCESS_KEY_ID,
        secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region=settings.AWS_REGION,
    )
