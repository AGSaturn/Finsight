from pydantic import BaseModel


class UserOut(BaseModel):
    id: str
    email: str
    name: str | None = None
    avatar_url: str | None = None
