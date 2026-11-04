from pydantic import BaseModel


class Page[T](BaseModel):
    """One page of a list, with how many there are in all."""

    items: list[T]
    total: int
    limit: int
    offset: int
