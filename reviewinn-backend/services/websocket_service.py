from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Set
import json
import asyncio
from datetime import datetime

class ConnectionManager:
    def __init__(self):
        # user_id -> list of websockets
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # conversation_id -> set of user_ids
        self.conversation_participants: Dict[int, Set[int]] = {}
        # websocket -> user_id mapping
        self.websocket_users: Dict[WebSocket, int] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        """Connect a websocket for a user"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        
        self.active_connections[user_id].append(websocket)
        self.websocket_users[websocket] = user_id
        
        # Send connection confirmation
        await self.send_personal_message({
            "type": "connection",
            "status": "connected",
            "timestamp": datetime.utcnow().isoformat()
        }, websocket)

    def disconnect(self, websocket: WebSocket):
        """Disconnect a websocket"""
        user_id = self.websocket_users.get(websocket)
        if user_id and user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        
        if websocket in self.websocket_users:
            del self.websocket_users[websocket]

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send message to a specific websocket"""
        try:
            await websocket.send_text(json.dumps(message))
        except:
            # Connection might be closed
            self.disconnect(websocket)

    async def send_to_user(self, user_id: int, message: dict):
        """Send message to all connections of a specific user"""
        if user_id in self.active_connections:
            connections_count = len(self.active_connections[user_id])
            print(f"🔄 Sending to user {user_id} with {connections_count} active connections")
            print(f"📝 Message type: {message.get('type')}, content: {message}")
            disconnected = []
            for websocket in self.active_connections[user_id]:
                try:
                    await websocket.send_text(json.dumps(message))
                    print(f"✅ Message sent successfully to user {user_id}")
                except Exception as e:
                    print(f"❌ Failed to send to user {user_id}: {e}")
                    disconnected.append(websocket)
            
            # Clean up disconnected sockets
            for websocket in disconnected:
                self.disconnect(websocket)
        else:
            print(f"❌ User {user_id} not found in active connections")
            print(f"📊 Currently active users: {list(self.active_connections.keys())}")

    async def send_to_conversation(self, conversation_id: int, message: dict, exclude_user_id: int = None):
        """Send message to all participants in a conversation"""
        if conversation_id in self.conversation_participants:
            participants = self.conversation_participants[conversation_id]
            print(f"Sending message to conversation {conversation_id}, participants: {participants}, exclude: {exclude_user_id}")
            for user_id in participants:
                if exclude_user_id and user_id == exclude_user_id:
                    print(f"Excluding user {user_id} from broadcast")
                    continue
                print(f"Sending message to user {user_id}")
                await self.send_to_user(user_id, message)
        else:
            print(f"No participants found for conversation {conversation_id}")

    def join_conversation(self, user_id: int, conversation_id: int):
        """Add user to conversation participants"""
        if conversation_id not in self.conversation_participants:
            self.conversation_participants[conversation_id] = set()
        self.conversation_participants[conversation_id].add(user_id)
        print(f"🔗 User {user_id} joined conversation {conversation_id}")
        print(f"🔗 Conversation {conversation_id} now has participants: {self.conversation_participants[conversation_id]}")

    def leave_conversation(self, user_id: int, conversation_id: int):
        """Remove user from conversation participants"""
        if conversation_id in self.conversation_participants:
            self.conversation_participants[conversation_id].discard(user_id)
            if not self.conversation_participants[conversation_id]:
                del self.conversation_participants[conversation_id]

    async def broadcast_typing(self, conversation_id: int, user_id: int, username: str, is_typing: bool):
        """Broadcast typing indicator to conversation participants"""
        message = {
            "type": "typing",
            "conversation_id": conversation_id,
            "user_id": user_id,
            "username": username,
            "is_typing": is_typing,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.send_to_conversation(conversation_id, message, exclude_user_id=user_id)

    async def broadcast_message(self, conversation_id: int, message_data: dict, exclude_user_id: int = None):
        """Broadcast new message to conversation participants"""
        message = {
            "type": "new_message",
            "conversation_id": conversation_id,
            "message": message_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.send_to_conversation(conversation_id, message, exclude_user_id=exclude_user_id)

    async def broadcast_message_status(self, conversation_id: int, message_id: int, user_id: int, status: str):
        """Broadcast message status update (read, delivered)"""
        message = {
            "type": "message_status",
            "conversation_id": conversation_id,
            "message_id": message_id,
            "user_id": user_id,
            "status": status,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.send_to_conversation(conversation_id, message)

    async def broadcast_reaction(self, conversation_id: int, message_id: int, user_id: int, username: str, emoji: str, action: str):
        """Broadcast reaction update to conversation participants"""
        message = {
            "type": "reaction",
            "conversation_id": conversation_id,
            "message_id": message_id,
            "user_id": user_id,
            "username": username,
            "emoji": emoji,
            "action": action,  # "add" or "remove"
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.send_to_conversation(conversation_id, message)

    def get_online_users(self) -> List[int]:
        """Get list of currently online user IDs"""
        return list(self.active_connections.keys())

    def is_user_online(self, user_id: int) -> bool:
        """Check if a user is currently online"""
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0

# Global connection manager instance
connection_manager = ConnectionManager()