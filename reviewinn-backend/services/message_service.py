from sqlalchemy.orm import Session
from models.message import Message
from repositories.message_repository import MessageRepository
from schemas.message import MessageCreate
from typing import List

class MessageService:
    def __init__(self, db: Session):
        self.repo = MessageRepository(db)

    def send_message(self, sender_id: int, data: MessageCreate) -> Message:
        message = Message(
            sender_id=sender_id,
            receiver_id=data.receiver_id,
            content=data.content,
            conversation_id=data.conversation_id
        )
        return self.repo.create(message)

    def get_conversation(self, conversation_id: int) -> List[Message]:
        return self.repo.get_conversation(conversation_id)

    def get_user_messages(self, user_id: int) -> List[Message]:
        return self.repo.get_user_messages(user_id)

    def mark_as_read(self, message_id: int) -> Message:
        return self.repo.mark_as_read(message_id) 