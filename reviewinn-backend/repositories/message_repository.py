from sqlalchemy.orm import Session
from models.message import Message
from typing import List, Optional

class MessageRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, message: Message) -> Message:
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message

    def get_by_id(self, message_id: int) -> Optional[Message]:
        return self.db.query(Message).filter(Message.message_id == message_id).first()

    def get_conversation(self, conversation_id: int) -> List[Message]:
        return self.db.query(Message).filter(Message.conversation_id == conversation_id).all()

    def get_user_messages(self, user_id: int) -> List[Message]:
        return self.db.query(Message).filter((Message.sender_id == user_id) | (Message.receiver_id == user_id)).all()

    def mark_as_read(self, message_id: int) -> Optional[Message]:
        message = self.get_by_id(message_id)
        if message:
            message.read = True
            self.db.commit()
            self.db.refresh(message)
        return message 