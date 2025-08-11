from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from services.message_service import MessageService
from schemas.message import MessageCreate, MessageRead
from database import get_db

router = APIRouter(prefix="/messages", tags=["messages"])

@router.post("/send", response_model=MessageRead)
def send_message(
    data: MessageCreate,
    db: Session = Depends(get_db),
    current_user_id: int = 1  # Replace with real auth
):
    service = MessageService(db)
    return service.send_message(current_user_id, data)

@router.get("/conversation/{conversation_id}", response_model=List[MessageRead])
def get_conversation(conversation_id: int, db: Session = Depends(get_db)):
    service = MessageService(db)
    return service.get_conversation(conversation_id)

@router.get("/user/{user_id}", response_model=List[MessageRead])
def get_user_messages(user_id: int, db: Session = Depends(get_db)):
    service = MessageService(db)
    return service.get_user_messages(user_id)

@router.post("/mark_read/{message_id}", response_model=MessageRead)
def mark_as_read(message_id: int, db: Session = Depends(get_db)):
    service = MessageService(db)
    return service.mark_as_read(message_id) 