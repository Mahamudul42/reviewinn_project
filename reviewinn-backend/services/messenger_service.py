from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func
from models.message import Message, MessageStatus
from models.conversation import Conversation, ConversationParticipant
from models.user import User
from typing import List, Optional, Dict, Any
from datetime import datetime
import json

class MessengerService:
    def __init__(self, db: Session):
        self.db = db

    def create_conversation(self, user_id: int, participant_ids: List[int], 
                          is_group: bool = False, group_name: str = None, 
                          group_description: str = None) -> Conversation:
        """Create a new conversation (direct or group)"""
        conversation = Conversation(
            is_group=is_group,
            group_name=group_name,
            group_description=group_description,
            created_by=user_id
        )
        self.db.add(conversation)
        self.db.flush()
        
        # Add creator as admin if it's a group
        creator_participant = ConversationParticipant(
            conversation_id=conversation.conversation_id,
            user_id=user_id,
            role='admin' if is_group else 'member'
        )
        self.db.add(creator_participant)
        
        # Add other participants
        for participant_id in participant_ids:
            if participant_id != user_id:
                participant = ConversationParticipant(
                    conversation_id=conversation.conversation_id,
                    user_id=participant_id,
                    role='member'
                )
                self.db.add(participant)
        
        self.db.commit()
        return conversation

    def get_or_create_direct_conversation(self, user_id: int, other_user_id: int) -> Conversation:
        """Get existing direct conversation or create new one"""
        # Check if conversation already exists
        existing = self.db.query(Conversation).join(ConversationParticipant).filter(
            Conversation.is_group == False,
            ConversationParticipant.user_id.in_([user_id, other_user_id])
        ).group_by(Conversation.conversation_id).having(
            func.count(ConversationParticipant.user_id) == 2
        ).first()
        
        if existing:
            return existing
        
        return self.create_conversation(user_id, [other_user_id], is_group=False)

    def send_message(self, sender_id: int, conversation_id: int, content: str,
                    message_type: str = 'text', file_url: str = None,
                    file_name: str = None, file_size: int = None,
                    reply_to_message_id: int = None) -> Message:
        """Send a message to a conversation"""
        # Verify sender is participant
        participant = self.db.query(ConversationParticipant).filter(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == sender_id,
            ConversationParticipant.status == 'active'
        ).first()
        
        if not participant:
            raise ValueError("User is not a participant in this conversation")
        
        message = Message(
            sender_id=sender_id,
            conversation_id=conversation_id,
            content=content,
            message_type=message_type,
            file_url=file_url,
            file_name=file_name,
            file_size=file_size,
            reply_to_message_id=reply_to_message_id
        )
        
        self.db.add(message)
        self.db.flush()
        
        # Update conversation last message time
        conversation = self.db.query(Conversation).filter(
            Conversation.conversation_id == conversation_id
        ).first()
        conversation.last_message_at = datetime.utcnow()
        
        # Create message status for all participants
        participants = self.db.query(ConversationParticipant).filter(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.status == 'active'
        ).all()
        
        for participant in participants:
            if participant.user_id != sender_id:
                status = MessageStatus(
                    message_id=message.message_id,
                    user_id=participant.user_id,
                    status='sent'
                )
                self.db.add(status)
        
        self.db.commit()
        return message

    def get_user_conversations(self, user_id: int, limit: int = 50) -> List[Dict]:
        """Get all conversations for a user with last message"""
        conversations = self.db.query(Conversation).join(ConversationParticipant).filter(
            ConversationParticipant.user_id == user_id,
            ConversationParticipant.status == 'active'
        ).options(
            joinedload(Conversation.participants).joinedload(ConversationParticipant.user),
            joinedload(Conversation.messages).joinedload(Message.sender)
        ).order_by(desc(Conversation.last_message_at)).limit(limit).all()
        
        result = []
        for conv in conversations:
            # Get last message
            last_message = self.db.query(Message).filter(
                Message.conversation_id == conv.conversation_id,
                Message.deleted_at.is_(None)
            ).order_by(desc(Message.created_at)).first()
            
            # Get other participants (for direct messages)
            other_participants = [p for p in conv.participants if p.user_id != user_id and p.status == 'active']
            
            # Calculate unread count
            user_participant = next((p for p in conv.participants if p.user_id == user_id), None)
            unread_count = 0
            if user_participant and user_participant.last_read_message_id:
                unread_count = self.db.query(Message).filter(
                    Message.conversation_id == conv.conversation_id,
                    Message.message_id > user_participant.last_read_message_id,
                    Message.sender_id != user_id,
                    Message.deleted_at.is_(None)
                ).count()
            else:
                unread_count = self.db.query(Message).filter(
                    Message.conversation_id == conv.conversation_id,
                    Message.sender_id != user_id,
                    Message.deleted_at.is_(None)
                ).count()
            
            conv_data = {
                'conversation_id': conv.conversation_id,
                'is_group': conv.is_group,
                'group_name': conv.group_name,
                'group_description': conv.group_description,
                'group_image': conv.group_image,
                'created_at': conv.created_at,
                'last_message_at': conv.last_message_at,
                'unread_count': unread_count,
                'participants': [{
                    'user_id': p.user_id,
                    'username': p.user.username,
                    'name': p.user.name,
                    'avatar': getattr(p.user, 'avatar', None),
                    'role': p.role,
                    'nickname': p.nickname
                } for p in conv.participants if p.status == 'active'],
                'last_message': {
                    'message_id': last_message.message_id,
                    'content': last_message.content,
                    'message_type': last_message.message_type,
                    'sender_id': last_message.sender_id,
                    'sender_name': last_message.sender.name,
                    'created_at': last_message.created_at
                } if last_message else None
            }
            
            # For direct messages, add other user info
            if not conv.is_group and other_participants:
                other_user = other_participants[0]
                conv_data['other_user'] = {
                    'user_id': other_user.user_id,
                    'username': other_user.user.username,
                    'name': other_user.user.name,
                    'avatar': getattr(other_user.user, 'avatar', None)
                }
            
            result.append(conv_data)
        
        return result

    def get_conversation_messages(self, conversation_id: int, user_id: int, 
                                limit: int = 50, offset: int = 0) -> Dict:
        """Get messages from a conversation with pagination info"""
        # Verify user is participant
        participant = self.db.query(ConversationParticipant).filter(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == user_id,
            ConversationParticipant.status == 'active'
        ).first()
        
        if not participant:
            raise ValueError("User is not a participant in this conversation")
        
        # Get total message count for pagination
        total_messages = self.db.query(Message).filter(
            Message.conversation_id == conversation_id,
            Message.deleted_at.is_(None)
        ).count()
        
        # Get messages in descending order (newest first)
        messages = self.db.query(Message).filter(
            Message.conversation_id == conversation_id,
            Message.deleted_at.is_(None)
        ).options(
            joinedload(Message.sender),
            joinedload(Message.reply_to).joinedload(Message.sender)
        ).order_by(desc(Message.created_at)).offset(offset).limit(limit).all()
        
        result = []
        for msg in messages:
            # Get message status for current user
            status = self.db.query(MessageStatus).filter(
                MessageStatus.message_id == msg.message_id,
                MessageStatus.user_id == user_id
            ).first()
            
            msg_data = {
                'message_id': msg.message_id,
                'content': msg.content,
                'message_type': msg.message_type,
                'file_url': msg.file_url,
                'file_name': msg.file_name,
                'file_size': msg.file_size,
                'sender_id': msg.sender_id,
                'sender_name': msg.sender.name,
                'sender_username': msg.sender.username,
                'sender_avatar': getattr(msg.sender, 'avatar', None),
                'created_at': msg.created_at,
                'updated_at': msg.updated_at,
                'reactions': msg.reactions or {},
                'is_own_message': msg.sender_id == user_id,
                'status': status.status if status else 'sent'
            }
            
            # Add reply info if exists
            if msg.reply_to:
                msg_data['reply_to'] = {
                    'message_id': msg.reply_to.message_id,
                    'content': msg.reply_to.content,
                    'sender_name': msg.reply_to.sender.name,
                    'message_type': msg.reply_to.message_type
                }
            
            result.append(msg_data)
        
        # Return messages with pagination info
        return {
            'messages': result,
            'total': total_messages,
            'offset': offset,
            'limit': limit,
            'has_more': offset + len(result) < total_messages
        }

    def mark_messages_as_read(self, conversation_id: int, user_id: int, 
                            message_id: int = None) -> bool:
        """Mark messages as read up to a specific message"""
        # Verify user is participant
        participant = self.db.query(ConversationParticipant).filter(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == user_id,
            ConversationParticipant.status == 'active'
        ).first()
        
        if not participant:
            return False
        
        # If no message_id provided, mark all as read
        if not message_id:
            last_message = self.db.query(Message).filter(
                Message.conversation_id == conversation_id,
                Message.deleted_at.is_(None)
            ).order_by(desc(Message.created_at)).first()
            
            if last_message:
                message_id = last_message.message_id
        
        # Update participant's last read message
        participant.last_read_message_id = message_id
        
        # Update message status
        self.db.query(MessageStatus).filter(
            MessageStatus.user_id == user_id,
            MessageStatus.message_id <= message_id
        ).update({'status': 'read'})
        
        self.db.commit()
        return True

    def add_reaction(self, message_id: int, user_id: int, emoji: str) -> bool:
        """Add or update reaction to a message"""
        message = self.db.query(Message).filter(
            Message.message_id == message_id,
            Message.deleted_at.is_(None)
        ).first()
        
        if not message:
            return False
        
        # Verify user is participant
        participant = self.db.query(ConversationParticipant).filter(
            ConversationParticipant.conversation_id == message.conversation_id,
            ConversationParticipant.user_id == user_id,
            ConversationParticipant.status == 'active'
        ).first()
        
        if not participant:
            return False
        
        reactions = message.reactions or {}
        reactions[str(user_id)] = emoji
        message.reactions = reactions
        
        self.db.commit()
        return True

    def remove_reaction(self, message_id: int, user_id: int) -> bool:
        """Remove reaction from a message"""
        message = self.db.query(Message).filter(
            Message.message_id == message_id,
            Message.deleted_at.is_(None)
        ).first()
        
        if not message:
            return False
        
        reactions = message.reactions or {}
        if str(user_id) in reactions:
            del reactions[str(user_id)]
            message.reactions = reactions
            self.db.commit()
        
        return True

    def search_messages(self, user_id: int, query: str, limit: int = 20) -> List[Dict]:
        """Search messages in user's conversations"""
        # Get user's conversations
        user_conversations = self.db.query(ConversationParticipant.conversation_id).filter(
            ConversationParticipant.user_id == user_id,
            ConversationParticipant.status == 'active'
        ).subquery()
        
        messages = self.db.query(Message).filter(
            Message.conversation_id.in_(user_conversations),
            Message.content.ilike(f'%{query}%'),
            Message.deleted_at.is_(None)
        ).options(
            joinedload(Message.sender),
            joinedload(Message.conversation)
        ).order_by(desc(Message.created_at)).limit(limit).all()
        
        result = []
        for msg in messages:
            result.append({
                'message_id': msg.message_id,
                'content': msg.content,
                'sender_name': msg.sender.name,
                'conversation_id': msg.conversation_id,
                'conversation_name': msg.conversation.group_name if msg.conversation.is_group else msg.sender.name,
                'created_at': msg.created_at
            })
        
        return result