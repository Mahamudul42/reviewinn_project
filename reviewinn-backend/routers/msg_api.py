"""
API endpoints for the new messaging system using msg_ tables.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from auth.production_dependencies import CurrentUser, RequiredUser
from services.msg_service import MsgService
from database import get_db
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/messenger", tags=["messaging"])

# Pydantic models for request/response
class ConversationCreate(BaseModel):
    participant_ids: List[int]
    conversation_type: str = 'direct'  # direct or group
    title: Optional[str] = None

class MessageCreate(BaseModel):
    conversation_id: int
    content: str
    message_type: str = 'text'
    reply_to_message_id: Optional[int] = None

class MessageAttachment(BaseModel):
    file_url: str
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None

class ReactionCreate(BaseModel):
    reaction_type: str  # emoji or reaction type

class ConversationResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    message: str = "Success"

class MessagesResponse(BaseModel):
    success: bool
    data: Optional[List[Dict[str, Any]]] = None
    message: str = "Success"

@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(
    conversation_data: ConversationCreate,
    db: Session = Depends(get_db),
    current_user = RequiredUser
):
    """Create a new conversation."""
    try:
        service = MsgService(db)
        result = service.create_conversation(
            user_id=current_user.user_id,
            participant_ids=conversation_data.participant_ids,
            conversation_type=conversation_data.conversation_type,
            title=conversation_data.title
        )
        
        return ConversationResponse(
            success=True,
            data=result,
            message="Conversation created successfully"
        )
        
    except Exception as e:
        logger.error(f"Failed to create conversation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create conversation: {str(e)}"
        )

@router.get("/conversations", response_model=ConversationResponse)
async def get_conversations(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user = RequiredUser
):
    """Get user's conversations."""
    try:
        service = MsgService(db)
        conversations = service.get_conversations(
            user_id=current_user.user_id,
            limit=limit,
            offset=offset
        )
        
        return ConversationResponse(
            success=True,
            data={
                'conversations': conversations,
                'total': len(conversations),
                'limit': limit,
                'offset': offset
            },
            message="Conversations retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Failed to get conversations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get conversations: {str(e)}"
        )

@router.post("/messages", response_model=ConversationResponse)
async def send_message(
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user = RequiredUser
):
    """Send a message to a conversation."""
    try:
        service = MsgService(db)
        result = service.send_message(
            sender_id=current_user.user_id,
            conversation_id=message_data.conversation_id,
            content=message_data.content,
            message_type=message_data.message_type,
            reply_to_message_id=message_data.reply_to_message_id
        )
        
        return ConversationResponse(
            success=True,
            data=result,
            message="Message sent successfully"
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to send message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send message: {str(e)}"
        )

@router.get("/conversations/{conversation_id}/messages", response_model=MessagesResponse)
async def get_messages(
    conversation_id: int,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user = RequiredUser
):
    """Get messages from a conversation."""
    try:
        service = MsgService(db)
        messages = service.get_messages(
            user_id=current_user.user_id,
            conversation_id=conversation_id,
            limit=limit,
            offset=offset
        )
        
        return MessagesResponse(
            success=True,
            data=messages,
            message="Messages retrieved successfully"
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to get messages: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get messages: {str(e)}"
        )

@router.post("/conversations/{conversation_id}/read", response_model=ConversationResponse)
async def mark_conversation_read(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user = RequiredUser
):
    """Mark conversation as read."""
    try:
        service = MsgService(db)
        result = service.mark_conversation_read(
            user_id=current_user.user_id,
            conversation_id=conversation_id
        )
        
        return ConversationResponse(
            success=True,
            data=result,
            message="Conversation marked as read"
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to mark conversation as read: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark conversation as read: {str(e)}"
        )

@router.post("/messages/{message_id}/reactions", response_model=ConversationResponse)
async def add_reaction(
    message_id: int,
    reaction_data: ReactionCreate,
    db: Session = Depends(get_db),
    current_user = RequiredUser
):
    """Add or update reaction to a message."""
    try:
        service = MsgService(db)
        result = service.add_reaction(
            user_id=current_user.user_id,
            message_id=message_id,
            reaction_type=reaction_data.reaction_type
        )
        
        return ConversationResponse(
            success=True,
            data=result,
            message="Reaction added successfully"
        )
        
    except Exception as e:
        logger.error(f"Failed to add reaction: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add reaction: {str(e)}"
        )

@router.delete("/messages/{message_id}/reactions", response_model=ConversationResponse)
async def remove_reaction(
    message_id: int,
    db: Session = Depends(get_db),
    current_user = RequiredUser
):
    """Remove user's reaction from a message."""
    try:
        service = MsgService(db)
        result = service.remove_reaction(
            user_id=current_user.user_id,
            message_id=message_id
        )
        
        return ConversationResponse(
            success=True,
            data=result,
            message="Reaction removed successfully"
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to remove reaction: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove reaction: {str(e)}"
        )

@router.get("/health")
async def health_check():
    """Health check endpoint for messaging service."""
    return {
        "status": "healthy",
        "service": "messaging",
        "version": "1.0.0",
        "database_tables": ["msg_conversations", "msg_messages", "msg_conversation_participants", "msg_message_attachments", "msg_message_reactions"]
    }