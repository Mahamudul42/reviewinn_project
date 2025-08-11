from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MessageBase(BaseModel):
    content: str
    conversation_id: Optional[int] = None

class MessageCreate(MessageBase):
    receiver_id: int

class MessageRead(MessageBase):
    message_id: int
    sender_id: int
    receiver_id: int
    created_at: datetime
    read: bool

    class Config:
        orm_mode = True 