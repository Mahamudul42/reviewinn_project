from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import os
import shutil
from uuid import uuid4

from database import get_db
from core.auth_dependencies import get_current_user
from services.messenger_service import MessengerService
from models.user import User

router = APIRouter(prefix="/messenger", tags=["messenger"])
security = HTTPBearer()

# Pydantic models
class MessageCreate(BaseModel):
    content: str
    message_type: str = "text"
    reply_to_message_id: Optional[int] = None

class ConversationCreate(BaseModel):
    participant_ids: List[int]
    is_group: bool = False
    group_name: Optional[str] = None
    group_description: Optional[str] = None

class DirectMessageCreate(BaseModel):
    other_user_id: int
    content: str
    message_type: str = "text"

class ReactionCreate(BaseModel):
    emoji: str

class MessageSearchQuery(BaseModel):
    query: str
    limit: int = 20

@router.post("/conversations")
async def create_conversation(
    conversation_data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new conversation (group or direct)"""
    try:
        service = MessengerService(db)
        conversation = service.create_conversation(
            user_id=current_user.user_id,
            participant_ids=conversation_data.participant_ids,
            is_group=conversation_data.is_group,
            group_name=conversation_data.group_name,
            group_description=conversation_data.group_description
        )
        return {
            "conversation_id": conversation.conversation_id,
            "is_group": conversation.is_group,
            "group_name": conversation.group_name,
            "created_at": conversation.created_at
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/conversations/direct")
async def create_direct_conversation(
    message_data: DirectMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or get direct conversation and send first message"""
    try:
        service = MessengerService(db)
        conversation = service.get_or_create_direct_conversation(
            user_id=current_user.user_id,
            other_user_id=message_data.other_user_id
        )
        
        # Send the message
        message = service.send_message(
            sender_id=current_user.user_id,
            conversation_id=conversation.conversation_id,
            content=message_data.content,
            message_type=message_data.message_type
        )
        
        return {
            "conversation_id": conversation.conversation_id,
            "message_id": message.message_id,
            "created_at": message.created_at
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/conversations")
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all conversations for the current user"""
    try:
        service = MessengerService(db)
        conversations = service.get_user_conversations(current_user.user_id)
        return {"conversations": conversations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: int,
    offset: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get messages from a conversation with pagination"""
    try:
        service = MessengerService(db)
        result = service.get_conversation_messages(
            conversation_id=conversation_id,
            user_id=current_user.user_id,
            limit=limit,
            offset=offset
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: int,
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message to a conversation"""
    try:
        service = MessengerService(db)
        message = service.send_message(
            sender_id=current_user.user_id,
            conversation_id=conversation_id,
            content=message_data.content,
            message_type=message_data.message_type,
            reply_to_message_id=message_data.reply_to_message_id
        )
        
        return {
            "message_id": message.message_id,
            "content": message.content,
            "message_type": message.message_type,
            "created_at": message.created_at,
            "sender_id": message.sender_id
        }
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/conversations/{conversation_id}/messages/file")
async def send_file_message(
    conversation_id: int,
    file: UploadFile = File(...),
    content: str = Form(""),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a file message"""
    try:
        # Create uploads directory if it doesn't exist
        upload_dir = "uploads/messages"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
        unique_filename = f"{uuid4()}.{file_extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Determine message type
        message_type = "file"
        if file.content_type and file.content_type.startswith("image/"):
            message_type = "image"
        
        service = MessengerService(db)
        message = service.send_message(
            sender_id=current_user.user_id,
            conversation_id=conversation_id,
            content=content or file.filename,
            message_type=message_type,
            file_url=file_path,
            file_name=file.filename,
            file_size=file.size
        )
        
        return {
            "message_id": message.message_id,
            "content": message.content,
            "message_type": message.message_type,
            "file_url": message.file_url,
            "file_name": message.file_name,
            "created_at": message.created_at
        }
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/conversations/{conversation_id}/read")
async def mark_messages_as_read(
    conversation_id: int,
    message_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark messages as read"""
    try:
        service = MessengerService(db)
        success = service.mark_messages_as_read(
            conversation_id=conversation_id,
            user_id=current_user.user_id,
            message_id=message_id
        )
        
        if not success:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/messages/{message_id}/reactions")
async def add_reaction(
    message_id: int,
    reaction_data: ReactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add reaction to a message"""
    try:
        service = MessengerService(db)
        success = service.add_reaction(
            message_id=message_id,
            user_id=current_user.user_id,
            emoji=reaction_data.emoji
        )
        
        if not success:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/messages/{message_id}/reactions")
async def remove_reaction(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove reaction from a message"""
    try:
        service = MessengerService(db)
        success = service.remove_reaction(
            message_id=message_id,
            user_id=current_user.user_id
        )
        
        if not success:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search")
async def search_messages(
    search_data: MessageSearchQuery,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search messages in user's conversations"""
    try:
        service = MessengerService(db)
        messages = service.search_messages(
            user_id=current_user.user_id,
            query=search_data.query,
            limit=search_data.limit
        )
        return {"messages": messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/search")
async def search_users_for_messaging(
    query: str = Query(..., min_length=1, max_length=100, description="Search query for users"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of results"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search users for starting conversations"""
    try:
        print(f"User search request - Query: '{query}', Limit: {limit}, User: {current_user.user_id}")
        
        # Validate query
        if not query or not query.strip():
            raise HTTPException(status_code=422, detail="Query cannot be empty")
        
        query_trimmed = query.strip()
        if len(query_trimmed) < 1:
            raise HTTPException(status_code=422, detail="Query must be at least 1 character")
        
        users = db.query(User).filter(
            User.username.ilike(f'%{query_trimmed}%') | User.name.ilike(f'%{query_trimmed}%'),
            User.user_id != current_user.user_id
        ).limit(limit).all()
        
        print(f"Found {len(users)} users matching query '{query_trimmed}'")
        
        return {
            "users": [{
                "user_id": user.user_id,
                "username": user.username,
                "name": user.name,
                "avatar": getattr(user, 'avatar', None)
            } for user in users]
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in user search: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))