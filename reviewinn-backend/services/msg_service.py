"""
Messaging service using the new msg_ table structure.
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from models.msg_conversation import MsgConversation, MsgConversationParticipant
from models.msg_message import MsgMessage, MsgMessageAttachment, MsgMessageReaction
from models.user import User
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class MsgService:
    def __init__(self, db: Session):
        self.db = db

    def create_conversation(self, user_id: int, participant_ids: List[int], 
                          conversation_type: str = 'direct', title: str = None) -> Dict[str, Any]:
        """Create a new conversation with participants."""
        try:
            # Create conversation
            conversation = MsgConversation(
                conversation_type=conversation_type,
                title=title,
                is_private=conversation_type == 'direct',
                max_participants=len(participant_ids) + 1 if conversation_type == 'group' else 2
            )
            self.db.add(conversation)
            self.db.flush()  # Get conversation_id
            
            # Add creator as participant
            creator_participant = MsgConversationParticipant(
                conversation_id=conversation.conversation_id,
                user_id=user_id,
                role='admin' if conversation_type == 'group' else 'member',
                joined_at=datetime.utcnow(),
                unread_count=0
            )
            self.db.add(creator_participant)
            
            # Add other participants
            for participant_id in participant_ids:
                if participant_id != user_id:  # Don't add creator twice
                    participant = MsgConversationParticipant(
                        conversation_id=conversation.conversation_id,
                        user_id=participant_id,
                        role='member',
                        joined_at=datetime.utcnow(),
                        unread_count=0
                    )
                    self.db.add(participant)
            
            self.db.commit()
            
            logger.info(f"Created conversation {conversation.conversation_id} with {len(participant_ids) + 1} participants")
            
            return {
                'conversation_id': conversation.conversation_id,
                'conversation_type': conversation.conversation_type,
                'title': conversation.title,
                'created_at': conversation.created_at.isoformat(),
                'participants': len(participant_ids) + 1
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to create conversation: {str(e)}")
            raise

    def send_message(self, sender_id: int, conversation_id: int, content: str, 
                    message_type: str = 'text', reply_to_message_id: int = None,
                    attachments: List[Dict] = None) -> Dict[str, Any]:
        """Send a message to a conversation."""
        try:
            # Verify user is participant in conversation
            participant = self.db.query(MsgConversationParticipant).filter(
                and_(
                    MsgConversationParticipant.conversation_id == conversation_id,
                    MsgConversationParticipant.user_id == sender_id,
                    MsgConversationParticipant.left_at.is_(None)
                )
            ).first()
            
            if not participant:
                raise ValueError("User is not a participant in this conversation")
            
            # Create message
            message = MsgMessage(
                conversation_id=conversation_id,
                sender_id=sender_id,
                content=content,
                message_type=message_type,
                reply_to_message_id=reply_to_message_id,
                created_at=datetime.utcnow()
            )
            self.db.add(message)
            self.db.flush()  # Get message_id
            
            # Add attachments if provided
            if attachments:
                for attachment_data in attachments:
                    attachment = MsgMessageAttachment(
                        message_id=message.message_id,
                        file_url=attachment_data['file_url'],
                        file_name=attachment_data.get('file_name'),
                        file_type=attachment_data.get('file_type'),
                        file_size=attachment_data.get('file_size')
                    )
                    self.db.add(attachment)
            
            # Update unread counts for other participants
            self.db.query(MsgConversationParticipant).filter(
                and_(
                    MsgConversationParticipant.conversation_id == conversation_id,
                    MsgConversationParticipant.user_id != sender_id,
                    MsgConversationParticipant.left_at.is_(None)
                )
            ).update({
                MsgConversationParticipant.unread_count: MsgConversationParticipant.unread_count + 1
            })
            
            # Update conversation updated_at
            self.db.query(MsgConversation).filter(
                MsgConversation.conversation_id == conversation_id
            ).update({
                MsgConversation.updated_at: datetime.utcnow()
            })
            
            self.db.commit()
            
            # Return message data with sender info
            sender = self.db.query(User).filter(User.user_id == sender_id).first()
            
            return {
                'message_id': message.message_id,
                'conversation_id': conversation_id,
                'sender': {
                    'user_id': sender.user_id,
                    'username': sender.username,
                    'name': sender.name,
                    'avatar': sender.avatar
                },
                'content': content,
                'message_type': message_type,
                'reply_to_message_id': reply_to_message_id,
                'created_at': message.created_at.isoformat(),
                'attachments': len(attachments) if attachments else 0
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to send message: {str(e)}")
            raise

    def get_conversations(self, user_id: int, limit: int = 20, offset: int = 0) -> List[Dict[str, Any]]:
        """Get user's conversations with latest message info."""
        try:
            conversations = self.db.query(
                MsgConversation,
                MsgConversationParticipant
            ).join(
                MsgConversationParticipant,
                MsgConversation.conversation_id == MsgConversationParticipant.conversation_id
            ).filter(
                and_(
                    MsgConversationParticipant.user_id == user_id,
                    MsgConversationParticipant.left_at.is_(None)
                )
            ).order_by(
                desc(MsgConversation.updated_at)
            ).limit(limit).offset(offset).all()
            
            result = []
            for conversation, participant in conversations:
                # Get other participants
                other_participants = self.db.query(
                    MsgConversationParticipant, User
                ).join(
                    User, MsgConversationParticipant.user_id == User.user_id
                ).filter(
                    and_(
                        MsgConversationParticipant.conversation_id == conversation.conversation_id,
                        MsgConversationParticipant.user_id != user_id,
                        MsgConversationParticipant.left_at.is_(None)
                    )
                ).all()
                
                # Get latest message
                latest_message = self.db.query(MsgMessage, User).join(
                    User, MsgMessage.sender_id == User.user_id
                ).filter(
                    and_(
                        MsgMessage.conversation_id == conversation.conversation_id,
                        MsgMessage.is_deleted == False
                    )
                ).order_by(desc(MsgMessage.created_at)).first()
                
                conversation_data = {
                    'conversation_id': conversation.conversation_id,
                    'conversation_type': conversation.conversation_type,
                    'title': conversation.title,
                    'is_private': conversation.is_private,
                    'unread_count': participant.unread_count,
                    'updated_at': conversation.updated_at.isoformat(),
                    'participants': [
                        {
                            'user_id': p.user_id,
                            'username': u.username,
                            'name': u.name,
                            'avatar': u.avatar,
                            'role': p.role
                        } for p, u in other_participants
                    ]
                }
                
                if latest_message:
                    msg, sender = latest_message
                    conversation_data['latest_message'] = {
                        'message_id': msg.message_id,
                        'content': msg.content,
                        'message_type': msg.message_type,
                        'created_at': msg.created_at.isoformat(),
                        'sender': {
                            'user_id': sender.user_id,
                            'username': sender.username,
                            'name': sender.name
                        }
                    }
                
                result.append(conversation_data)
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to get conversations: {str(e)}")
            raise

    def get_messages(self, user_id: int, conversation_id: int, 
                    limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Get messages from a conversation."""
        try:
            # Verify user is participant
            participant = self.db.query(MsgConversationParticipant).filter(
                and_(
                    MsgConversationParticipant.conversation_id == conversation_id,
                    MsgConversationParticipant.user_id == user_id,
                    MsgConversationParticipant.left_at.is_(None)
                )
            ).first()
            
            if not participant:
                raise ValueError("User is not a participant in this conversation")
            
            # Get messages with sender info
            messages = self.db.query(MsgMessage, User).join(
                User, MsgMessage.sender_id == User.user_id
            ).filter(
                and_(
                    MsgMessage.conversation_id == conversation_id,
                    MsgMessage.is_deleted == False
                )
            ).order_by(desc(MsgMessage.created_at)).limit(limit).offset(offset).all()
            
            result = []
            for message, sender in messages:
                # Get attachments
                attachments = self.db.query(MsgMessageAttachment).filter(
                    MsgMessageAttachment.message_id == message.message_id
                ).all()
                
                # Get reactions
                reactions = self.db.query(MsgMessageReaction, User).join(
                    User, MsgMessageReaction.user_id == User.user_id
                ).filter(
                    MsgMessageReaction.message_id == message.message_id
                ).all()
                
                message_data = {
                    'message_id': message.message_id,
                    'conversation_id': conversation_id,
                    'content': message.content,
                    'message_type': message.message_type,
                    'is_edited': message.is_edited,
                    'reply_to_message_id': message.reply_to_message_id,
                    'created_at': message.created_at.isoformat(),
                    'updated_at': message.updated_at.isoformat(),
                    'sender': {
                        'user_id': sender.user_id,
                        'username': sender.username,
                        'name': sender.name,
                        'avatar': sender.avatar
                    },
                    'attachments': [
                        {
                            'attachment_id': att.attachment_id,
                            'file_url': att.file_url,
                            'file_name': att.file_name,
                            'file_type': att.file_type,
                            'file_size': att.file_size
                        } for att in attachments
                    ],
                    'reactions': [
                        {
                            'reaction_id': reaction.reaction_id,
                            'reaction_type': reaction.reaction_type,
                            'user': {
                                'user_id': user.user_id,
                                'username': user.username,
                                'name': user.name
                            }
                        } for reaction, user in reactions
                    ]
                }
                
                result.append(message_data)
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to get messages: {str(e)}")
            raise

    def mark_conversation_read(self, user_id: int, conversation_id: int) -> Dict[str, Any]:
        """Mark conversation as read for user."""
        try:
            # Update participant's unread count and last_read_at
            updated = self.db.query(MsgConversationParticipant).filter(
                and_(
                    MsgConversationParticipant.conversation_id == conversation_id,
                    MsgConversationParticipant.user_id == user_id,
                    MsgConversationParticipant.left_at.is_(None)
                )
            ).update({
                MsgConversationParticipant.unread_count: 0,
                MsgConversationParticipant.last_read_at: datetime.utcnow()
            })
            
            if updated == 0:
                raise ValueError("User is not a participant in this conversation")
            
            self.db.commit()
            
            return {
                'conversation_id': conversation_id,
                'unread_count': 0,
                'last_read_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to mark conversation as read: {str(e)}")
            raise

    def add_reaction(self, user_id: int, message_id: int, reaction_type: str) -> Dict[str, Any]:
        """Add or update reaction to a message."""
        try:
            # Check if reaction already exists
            existing_reaction = self.db.query(MsgMessageReaction).filter(
                and_(
                    MsgMessageReaction.message_id == message_id,
                    MsgMessageReaction.user_id == user_id
                )
            ).first()
            
            if existing_reaction:
                # Update existing reaction
                existing_reaction.reaction_type = reaction_type
                existing_reaction.created_at = datetime.utcnow()
            else:
                # Create new reaction
                reaction = MsgMessageReaction(
                    message_id=message_id,
                    user_id=user_id,
                    reaction_type=reaction_type,
                    created_at=datetime.utcnow()
                )
                self.db.add(reaction)
            
            self.db.commit()
            
            return {
                'message_id': message_id,
                'reaction_type': reaction_type,
                'user_id': user_id,
                'created_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to add reaction: {str(e)}")
            raise

    def remove_reaction(self, user_id: int, message_id: int) -> Dict[str, Any]:
        """Remove user's reaction from a message."""
        try:
            deleted = self.db.query(MsgMessageReaction).filter(
                and_(
                    MsgMessageReaction.message_id == message_id,
                    MsgMessageReaction.user_id == user_id
                )
            ).delete()
            
            if deleted == 0:
                raise ValueError("Reaction not found")
            
            self.db.commit()
            
            return {
                'message_id': message_id,
                'user_id': user_id,
                'removed': True
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to remove reaction: {str(e)}")
            raise