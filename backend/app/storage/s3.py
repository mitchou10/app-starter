import aioboto3
from botocore.exceptions import ClientError

from app.storage.base import StoredObject


class S3Store:
    """An S3-compatible storage (RustFS, MinIO, AWS...), spoken to without blocking the event loop."""

    def __init__(
        self,
        *,
        bucket: str,
        endpoint_url: str,
        access_key_id: str,
        secret_access_key: str,
        region: str,
    ) -> None:
        self._bucket = bucket
        self._session = aioboto3.Session()
        self._client_args = {
            "endpoint_url": endpoint_url,
            "aws_access_key_id": access_key_id,
            "aws_secret_access_key": secret_access_key,
            "region_name": region,
        }
        self._bucket_ready = False

    def _client(self):
        return self._session.client("s3", **self._client_args)

    async def _ensure_bucket(self, s3) -> None:
        # Lazy: no network call at import time. A real connectivity or permission problem still surfaces on the
        # call that follows.
        if self._bucket_ready:
            return
        try:
            await s3.create_bucket(Bucket=self._bucket)
        except ClientError as error:
            if error.response["Error"]["Code"] not in ("BucketAlreadyOwnedByYou", "BucketAlreadyExists"):
                raise
        self._bucket_ready = True

    async def put(self, key: str, data: bytes, content_type: str) -> None:
        async with self._client() as s3:
            await self._ensure_bucket(s3)
            await s3.put_object(Bucket=self._bucket, Key=key, Body=data, ContentType=content_type)

    async def get(self, key: str) -> StoredObject | None:
        async with self._client() as s3:
            try:
                response = await s3.get_object(Bucket=self._bucket, Key=key)
            except ClientError as error:
                if error.response["Error"]["Code"] in ("NoSuchKey", "404", "NoSuchBucket"):
                    return None
                raise
            async with response["Body"] as body:
                return StoredObject(data=await body.read(), content_type=response["ContentType"])

    async def delete(self, key: str) -> None:
        async with self._client() as s3:
            await s3.delete_object(Bucket=self._bucket, Key=key)
