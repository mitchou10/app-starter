from sqlalchemy.ext.asyncio import AsyncSession


class Repository:
    """What every repository shares: the session of the request. One session, so one transaction: an operation that
    touches several repositories commits once, at its end, through any of them."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def commit(self) -> None:
        await self._db.commit()

    async def rollback(self) -> None:
        await self._db.rollback()
