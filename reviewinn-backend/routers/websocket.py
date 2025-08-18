from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session
import json
from typing import Dict, Any
from datetime import datetime

from database import get_db
from services.websocket_service import connection_manager
from services.professional_messaging_service import ProfessionalMessagingService
from auth.production_dependencies import CurrentUser, RequiredUser
from models.user import User

router = APIRouter()

@router.websocket("/ws/test")
async def test_websocket(websocket: WebSocket):
    """Simple test WebSocket endpoint"""
    print("Test WebSocket connection attempt")
    await websocket.accept()
    print("Test WebSocket connected")
    try:
        while True:
            data = await websocket.receive_text()
            print(f"Received: {data}")
            await websocket.send_text(f"Echo: {data}")
    except Exception as e:
        print(f"Test WebSocket error: {e}")

@router.websocket("/ws/messenger/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str, db: Session = Depends(get_db)):
    """WebSocket endpoint for real-time messaging"""
    
    print(f"WebSocket connection attempt with token: {token[:50]}...")
    
    # Accept connection first to avoid middleware issues
    await websocket.accept()
    print("WebSocket accepted, now authenticating...")
    
    # Authenticate user from token
    try:
        user = await get_user_from_websocket_token(token, db)
        if not user:
            print("Authentication failed - invalid token or user not found")
            await websocket.close(code=4001, reason="Invalid token")
            return
        print(f"User authenticated successfully: {user.user_id}")
    except Exception as e:
        print(f"Authentication error: {str(e)}")
        await websocket.close(code=4001, reason="Authentication failed")
        return

    # Register connection after authentication
    if user.user_id not in connection_manager.active_connections:
        connection_manager.active_connections[user.user_id] = []
    connection_manager.active_connections[user.user_id].append(websocket)
    connection_manager.websocket_users[websocket] = user.user_id
    
    # Send connection confirmation
    await websocket.send_text(json.dumps({
        "type": "connection",
        "status": "connected",
        "user_id": user.user_id
    }))
    messaging_service = ProfessionalMessagingService(db)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            message_type = message_data.get("type")
            
            if message_type == "ping":
                # Handle ping messages to keep connection alive
                await websocket.send_text(json.dumps({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                }))
                continue
            
            elif message_type == "join_conversation":
                # User joins a conversation room
                conversation_id = message_data.get("conversation_id")
                if conversation_id:
                    # Verify user is actually a participant in this conversation
                    from models.conversation import ConversationParticipant
                    participant = db.query(ConversationParticipant).filter(
                        ConversationParticipant.conversation_id == conversation_id,
                        ConversationParticipant.user_id == user.user_id,
                        ConversationParticipant.status == 'active'
                    ).first()
                    
                    if participant:
                        connection_manager.join_conversation(user.user_id, conversation_id)
                        print(f"User {user.user_id} joined conversation {conversation_id}")
                        print(f"Conversation participants: {connection_manager.conversation_participants.get(conversation_id, set())}")
                        
                        # Mark user as online in this conversation
                        await connection_manager.send_to_conversation(
                            conversation_id,
                            {
                                "type": "user_online",
                                "user_id": user.user_id,
                                "username": user.username
                            },
                            exclude_user_id=user.user_id
                        )
                    else:
                        print(f"User {user.user_id} attempted to join conversation {conversation_id} but is not a participant")
            
            elif message_type == "leave_conversation":
                # User leaves a conversation room
                conversation_id = message_data.get("conversation_id")
                if conversation_id:
                    connection_manager.leave_conversation(user.user_id, conversation_id)
                    
                    # Mark user as offline in this conversation
                    await connection_manager.send_to_conversation(
                        conversation_id,
                        {
                            "type": "user_offline",
                            "user_id": user.user_id,
                            "username": user.username
                        },
                        exclude_user_id=user.user_id
                    )
            
            elif message_type == "typing":
                # User is typing
                conversation_id = message_data.get("conversation_id")
                is_typing = message_data.get("is_typing", False)
                
                if conversation_id is not None:
                    await connection_manager.broadcast_typing(
                        conversation_id,
                        user.user_id,
                        user.username,
                        is_typing
                    )
            
            elif message_type == "send_message":
                # Send a new message
                conversation_id = message_data.get("conversation_id")
                content = message_data.get("content")
                reply_to_message_id = message_data.get("reply_to_message_id")
                
                if conversation_id and content:
                    try:
                        # Save message to database
                        message = messaging_service.send_message(
                            sender_id=user.user_id,
                            conversation_id=conversation_id,
                            content=content,
                            reply_to_message_id=reply_to_message_id
                        )
                        
                        # Broadcast to conversation participants
                        message_data = {
                            "message_id": message.message_id,
                            "content": message.content,
                            "message_type": message.message_type,
                            "sender_id": message.sender_id,
                            "sender_name": user.name or user.username,
                            "sender_username": user.username,
                            "sender_avatar": getattr(user, 'avatar', None),
                            "created_at": message.created_at.isoformat(),
                            "updated_at": message.updated_at.isoformat() if hasattr(message, 'updated_at') else message.created_at.isoformat(),
                            "reactions": {},
                            "is_own_message": False,
                            "status": "delivered",
                            "reply_to_message_id": reply_to_message_id,
                            "conversation_id": conversation_id  # Add this for frontend matching
                        }
                        
                        # Send to OTHER participants (exclude sender)
                        print(f"Broadcasting message from user {user.user_id} to conversation {conversation_id}")
                        print(f"Conversation participants: {connection_manager.conversation_participants.get(conversation_id, set())}")
                        print(f"Online users: {connection_manager.get_online_users()}")
                        
                        # Get all participants from database and send to each online participant
                        from models.conversation import ConversationParticipant
                        db_participants = db.query(ConversationParticipant).filter(
                            ConversationParticipant.conversation_id == conversation_id,
                            ConversationParticipant.status == 'active'
                        ).all()
                        
                        broadcast_message = {
                            "type": "new_message",
                            "conversation_id": conversation_id,
                            "message": message_data
                        }
                        
                        print(f"📤 Broadcast message structure: {broadcast_message}")
                        print(f"📤 Message data conversation_id: {message_data.get('conversation_id')}")
                        print(f"📤 Outer conversation_id: {conversation_id}")
                        
                        # Send to OTHER participants (exclude sender to avoid duplicates)
                        for participant in db_participants:
                            if participant.user_id != user.user_id:  # Don't send to sender
                                print(f"🔄 Sending message to participant {participant.user_id} (excluding sender {user.user_id})")
                                if participant.user_id in connection_manager.active_connections:
                                    print(f"✅ Participant {participant.user_id} is online, sending message")
                                    await connection_manager.send_to_user(participant.user_id, broadcast_message)
                                else:
                                    print(f"❌ Participant {participant.user_id} is offline, skipping")
                            else:
                                print(f"⚠️ Skipping sender {user.user_id} to avoid duplicate")
                        
                        # Send confirmation to sender
                        await connection_manager.send_personal_message({
                            "type": "message_sent",
                            "temp_id": message_data.get("temp_id"),  # Client-side temporary ID
                            "message": message_data,
                            "conversation_id": conversation_id
                        }, websocket)
                        
                    except Exception as e:
                        await connection_manager.send_personal_message({
                            "type": "error",
                            "message": str(e)
                        }, websocket)
            
            elif message_type == "mark_read":
                # Mark messages as read
                conversation_id = message_data.get("conversation_id")
                message_id = message_data.get("message_id")
                
                if conversation_id:
                    try:
                        messaging_service.mark_messages_as_read(
                            conversation_id=conversation_id,
                            user_id=user.user_id,
                            message_id=message_id
                        )
                        
                        # Broadcast read status
                        await connection_manager.broadcast_message_status(
                            conversation_id,
                            message_id,
                            user.user_id,
                            "read"
                        )
                        
                    except Exception as e:
                        await connection_manager.send_personal_message({
                            "type": "error",
                            "message": str(e)
                        }, websocket)
            
            elif message_type == "add_reaction":
                # Add reaction to message
                message_id = message_data.get("message_id")
                emoji = message_data.get("emoji")
                conversation_id = message_data.get("conversation_id")
                
                if message_id and emoji and conversation_id:
                    try:
                        messaging_service.add_reaction(
                            message_id=message_id,
                            user_id=user.user_id,
                            emoji=emoji
                        )
                        
                        # Broadcast reaction
                        await connection_manager.broadcast_reaction(
                            conversation_id,
                            message_id,
                            user.user_id,
                            user.username,
                            emoji,
                            "add"
                        )
                        
                    except Exception as e:
                        await connection_manager.send_personal_message({
                            "type": "error",
                            "message": str(e)
                        }, websocket)
            
            elif message_type == "remove_reaction":
                # Remove reaction from message
                message_id = message_data.get("message_id")
                conversation_id = message_data.get("conversation_id")
                
                if message_id and conversation_id:
                    try:
                        messaging_service.remove_reaction(
                            message_id=message_id,
                            user_id=user.user_id
                        )
                        
                        # Broadcast reaction removal
                        await connection_manager.broadcast_reaction(
                            conversation_id,
                            message_id,
                            user.user_id,
                            user.username,
                            "",
                            "remove"
                        )
                        
                    except Exception as e:
                        await connection_manager.send_personal_message({
                            "type": "error",
                            "message": str(e)
                        }, websocket)
                        
    except WebSocketDisconnect:
        print(f"User {user.user_id} disconnected")
        
        # Remove websocket from user's connections
        if user.user_id in connection_manager.active_connections:
            if websocket in connection_manager.active_connections[user.user_id]:
                connection_manager.active_connections[user.user_id].remove(websocket)
            if not connection_manager.active_connections[user.user_id]:
                del connection_manager.active_connections[user.user_id]
        
        if websocket in connection_manager.websocket_users:
            del connection_manager.websocket_users[websocket]
        
        # Notify conversations that user went offline (only if no other connections)
        if user.user_id not in connection_manager.active_connections:
            for conversation_id in list(connection_manager.conversation_participants.keys()):
                if user.user_id in connection_manager.conversation_participants[conversation_id]:
                    connection_manager.leave_conversation(user.user_id, conversation_id)
                    
                    # Get all participants from database and notify them
                    from models.conversation import ConversationParticipant
                    db_participants = db.query(ConversationParticipant).filter(
                        ConversationParticipant.conversation_id == conversation_id,
                        ConversationParticipant.status == 'active'
                    ).all()
                    
                    for participant in db_participants:
                        if participant.user_id != user.user_id:
                            await connection_manager.send_to_user(participant.user_id, {
                                "type": "user_offline",
                                "user_id": user.user_id,
                                "username": user.username,
                                "conversation_id": conversation_id
                            })

@router.websocket("/ws/notifications/{token}")
async def notifications_websocket_endpoint(websocket: WebSocket, token: str, db: Session = Depends(get_db)):
    """WebSocket endpoint for real-time notifications"""
    print(f"Notifications WebSocket connection attempt with token: {token[:50]}...")
    
    # Authenticate user
    user = await get_user_from_websocket_token(token, db)
    if not user:
        print("Notifications WebSocket: Authentication failed")
        await websocket.close(code=1008)  # 1008 = Policy Violation
        return
    
    await websocket.accept()
    print(f"Notifications WebSocket: User {user.user_id} connected")
    
    # Add user to connection manager
    connection_manager.connect(user.user_id, websocket)
    
    try:
        # Send initial connection message
        await websocket.send_text(json.dumps({
            "type": "connected",
            "message": "Connected to notifications",
            "user_id": user.user_id
        }))
        
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            print(f"Notifications WebSocket message from user {user.user_id}: {message}")
            
            # Handle different message types
            if message.get("type") == "subscribe_notifications":
                # Subscribe user to notifications
                await websocket.send_text(json.dumps({
                    "type": "subscribed",
                    "message": "Subscribed to notifications"
                }))
                
            elif message.get("type") == "unsubscribe_notifications":
                # Unsubscribe user from notifications
                await websocket.send_text(json.dumps({
                    "type": "unsubscribed", 
                    "message": "Unsubscribed from notifications"
                }))
                
            elif message.get("type") == "mark_notification_read":
                # Handle marking notification as read
                notification_id = message.get("notification_id")
                if notification_id:
                    # Update notification in database
                    from services.enterprise_notification_service import EnterpriseNotificationService
                    notification_service = EnterpriseNotificationService(db)
                    
                    try:
                        notification_service.mark_as_read(notification_id, user.user_id)
                        await websocket.send_text(json.dumps({
                            "type": "notification_read",
                            "notification_id": notification_id
                        }))
                    except Exception as e:
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "message": f"Failed to mark notification as read: {str(e)}"
                        }))
                        
            elif message.get("type") == "delete_notification":
                # Handle deleting notification
                notification_id = message.get("notification_id")
                if notification_id:
                    from services.enterprise_notification_service import EnterpriseNotificationService
                    notification_service = EnterpriseNotificationService(db)
                    
                    try:
                        notification_service.delete_notification(notification_id, user.user_id)
                        await websocket.send_text(json.dumps({
                            "type": "notification_deleted",
                            "notification_id": notification_id
                        }))
                    except Exception as e:
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "message": f"Failed to delete notification: {str(e)}"
                        }))
                        
    except WebSocketDisconnect:
        print(f"Notifications WebSocket: User {user.user_id} disconnected")
        
        # Remove websocket from user's connections
        if user.user_id in connection_manager.active_connections:
            if websocket in connection_manager.active_connections[user.user_id]:
                connection_manager.active_connections[user.user_id].remove(websocket)
            if not connection_manager.active_connections[user.user_id]:
                del connection_manager.active_connections[user.user_id]
        
        if websocket in connection_manager.websocket_users:
            del connection_manager.websocket_users[websocket]
    
    except Exception as e:
        print(f"Notifications WebSocket error: {str(e)}")
        await websocket.close(code=1011)  # 1011 = Internal Error

async def get_user_from_websocket_token(token: str, db: Session) -> User:
    """Get user from WebSocket token"""
    try:
        from auth.production_auth_system import get_auth_system
        auth_system = get_auth_system()
        
        # Verify token and get payload
        payload = await auth_system.verify_token(token, "access")
        user_id = payload.get("sub")
        
        if not user_id:
            print(f"WebSocket auth failed: No user ID in token")
            return None
        
        # Get user from database
        user = db.query(User).filter(User.user_id == int(user_id)).first()
        if not user or not user.is_active:
            print(f"WebSocket auth failed: User {user_id} not found or inactive")
            return None
        
        print(f"WebSocket auth successful for user {user_id}")
        return user
    except Exception as e:
        print(f"WebSocket auth failed: {str(e)}")
        return None