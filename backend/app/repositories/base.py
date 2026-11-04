from sqlalchemy.ext.asyncio import AsyncSession


class Repository:
    """What every repository shares: the session of the request. One session, so one transaction: an operation that
    touches several repositories commits once, at its end, through any of them."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def flush(self) -> None:
        """Writes what was added so far, without ending the transaction: a row that others point to goes first."""
        await self._db.flush()

    async def commit(self) -> None:
        await self._db.commit()
