import uuid
from collections.abc import Sequence
from datetime import UTC, datetime
from typing import Any

from app.models import FeedbackStatus, FeedbackType
from app.repositories.reference import ReferenceRepository
from app.services.actor import Actor
from app.services.errors import DuplicateName, InvalidReference, ReferenceArchived, ReferenceNotFound


class ReferenceService[M: (FeedbackType, FeedbackStatus)]:
    """Add, rename and archive the values people choose from. The same rules for the types and for the statuses."""

    def __init__(self, repository: ReferenceRepository[M]) -> None:
        self._repository = repository

    async def list(self) -> Sequence[M]:
        """Every value, the archived ones too: a feedback that has one must still show its name."""
        return await self._repository.list()

    async def get(self, item_id: uuid.UUID) -> M:
        item = await self._repository.get(item_id)
        if item is None:
            raise ReferenceNotFound
        return item

    async def resolve(self, item_id: uuid.UUID) -> M:
        """The value a request chose: it must exist and not be archived."""
        item = await self._repository.get(item_id)
        if item is None:
            raise InvalidReference
        if item.archived:
            raise ReferenceArchived
        return item

    async def create(self, actor: Actor, **values: Any) -> M:
        await self._check_name_is_free(values["name"])
        item = self._repository.model(
            **values,
            position=await self._repository.next_position(),
            created_by=actor.user_id,
            created_by_username=actor.username,
        )
        self._repository.add(item)
        await self._repository.commit()
        return item

    async def update(self, item_id: uuid.UUID, **changes: Any) -> M:
        """Only the fields given change. `archived` archives or restores."""
        item = await self.get(item_id)
        if "name" in changes and changes["name"].lower() != item.name.lower():
            await self._check_name_is_free(changes["name"])
        archived = changes.pop("archived", None)
        if archived is not None and archived != item.archived:
            if archived:
                self._before_archiving(item)
            item.archived_at = datetime.now(UTC) if archived else None
        for field, value in changes.items():
            setattr(item, field, value)
        await self._repository.commit()
        return item

    def _before_archiving(self, item: M) -> None:
        """A subclass refuses here a value that must stay."""

    async def _check_name_is_free(self, name: str) -> None:
        if await self._repository.find_by_name(name) is not None:
            raise DuplicateName
