from pydantic import BaseModel, ConfigDict


class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    # None while there is no photo; changes with every new one.
    avatar_version: int | None
