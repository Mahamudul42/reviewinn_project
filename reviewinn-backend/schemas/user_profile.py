from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserProfileBase(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = ''
    avatar: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None

class UserProfileCreate(UserProfileBase):
    pass

class UserProfileRead(UserProfileBase):
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True 