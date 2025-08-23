"""
Professional Messaging Service - Completely fixed version with no asyncio dependencies
"""
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
import logging

logger = logging.getLogger(__name__)

class ProfessionalMessagingService:
    """Professional messaging service with direct SQL queries"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # ========== CONVERSATION MANAGEMENT ==========
    
    def get_conversations(
        self, 
        user_id: int, 
        limit: int = 20, 
        offset: int = 0,
        search: str = None,
        conversation_type: str = None
    ) -> Dict[str, Any]:
        """Get user's conversations using production-grade SQL queries with robust error handling"""
        try:
            # First, verify the user exists in core_users table for production data integrity
            user_exists_query = "SELECT COUNT(*) FROM core_users WHERE user_id = :user_id AND is_active = true"
            user_exists = self.db.execute(text(user_exists_query), {"user_id": user_id}).scalar()
            
            if not user_exists:
                logger.warning(f"User {user_id} not found in core_users table")
                return {
                    "success": True,  # Not an error - user just has no conversations
                    "conversations": [],
                    "total_count": 0,
                    "has_more": False,
                    "pagination": {
                        "current_page": 1,
                        "total_pages": 0,
                        "limit": limit,
                        "offset": offset
                    },
                    "message": "User has no conversations yet"
                }
            
            # Production-grade query with proper validation and error handling
            query = """
            SELECT DISTINCT 
                c.conversation_id,
                c.conversation_type,
                COALESCE(c.title, 'Conversation ' || c.conversation_id::text) as title,
                COALESCE(c.is_private, false) as is_private,
                c.created_at,
                (SELECT COUNT(*) FROM msg_conversation_participants cp2 
                 WHERE cp2.conversation_id = c.conversation_id 
                 AND cp2.left_at IS NULL) as participant_count
            FROM msg_conversations c
            INNER JOIN msg_conversation_participants cp ON c.conversation_id = cp.conversation_id
            WHERE cp.user_id = :user_id 
            AND cp.left_at IS NULL
            AND c.conversation_id IS NOT NULL
            """
            
            params = {"user_id": user_id}
            
            # Add optional filters with proper validation
            if search and len(search.strip()) > 0:
                query += " AND COALESCE(c.title, '') ILIKE :search"
                params["search"] = f"%{search.strip()}%"
                
            if conversation_type and conversation_type.strip():
                query += " AND c.conversation_type = :conversation_type"
                params["conversation_type"] = conversation_type.strip()
            
            query += " ORDER BY c.created_at DESC LIMIT :limit OFFSET :offset"
            params["limit"] = max(1, min(limit, 100))  # Enforce reasonable limits
            params["offset"] = max(0, offset)
            
            # Execute main query with error handling
            result = self.db.execute(text(query), params)
            rows = result.fetchall()
            
            # Get total count for pagination
            count_query = """
            SELECT COUNT(DISTINCT c.conversation_id)
            FROM msg_conversations c
            INNER JOIN msg_conversation_participants cp ON c.conversation_id = cp.conversation_id
            WHERE cp.user_id = :user_id 
            AND cp.left_at IS NULL
            AND c.conversation_id IS NOT NULL
            """
            
            count_params = {"user_id": user_id}
            if search and len(search.strip()) > 0:
                count_query += " AND COALESCE(c.title, '') ILIKE :search"
                count_params["search"] = f"%{search.strip()}%"
            if conversation_type and conversation_type.strip():
                count_query += " AND c.conversation_type = :conversation_type"
                count_params["conversation_type"] = conversation_type.strip()
                
            total = self.db.execute(text(count_query), count_params).scalar() or 0
            
            # Process results with proper data validation
            conversations = []
            for row in rows:
                try:
                    conversation_data = {
                        "conversation_id": int(row.conversation_id),
                        "conversation_type": str(row.conversation_type or "direct"),
                        "title": str(row.title or f"Conversation {row.conversation_id}"),
                        "is_private": bool(row.is_private if row.is_private is not None else False),
                        "participant_count": int(row.participant_count or 0),
                        "created_at": row.created_at.isoformat() if row.created_at else None,
                        "unread_count": 0,  # TODO: Implement proper unread count logic
                        "last_message": None,  # TODO: Implement last message retrieval
                        "participants": []  # TODO: Implement participant list retrieval
                    }
                    conversations.append(conversation_data)
                except Exception as row_error:
                    logger.warning(f"Failed to process conversation row: {row_error}")
                    continue
            
            # Calculate pagination metadata
            total_pages = ((total - 1) // params["limit"]) + 1 if total > 0 else 0
            current_page = (params["offset"] // params["limit"]) + 1
            has_more = total > (params["offset"] + params["limit"])
            
            return {
                "success": True,
                "conversations": conversations,
                "total_count": total,
                "has_more": has_more,
                "pagination": {
                    "current_page": current_page,
                    "total_pages": total_pages,
                    "limit": params["limit"],
                    "offset": params["offset"]
                }
            }
            
        except Exception as e:
            # Production-grade error handling and logging
            error_context = {
                "user_id": user_id,
                "limit": limit,
                "offset": offset,
                "search": search,
                "conversation_type": conversation_type,
                "error": str(e),
                "error_type": type(e).__name__
            }
            
            logger.error("Failed to get conversations", extra=error_context, exc_info=True)
            
            # Return user-friendly error response
            return {
                "success": False,
                "error": "Unable to retrieve conversations. Please try again later.",
                "conversations": [],
                "total_count": 0,
                "has_more": False,
                "pagination": {
                    "current_page": 1,
                    "total_pages": 0,
                    "limit": limit,
                    "offset": offset
                },
                "error_code": "CONVERSATION_RETRIEVAL_FAILED"
            }
    
    def get_conversation_details(self, conversation_id: int, user_id: int) -> Dict[str, Any]:
        """Get detailed conversation information"""
        try:
            # Check if user is participant
            participant_check = text("""
                SELECT 1 FROM msg_conversation_participants 
                WHERE conversation_id = :conversation_id AND user_id = :user_id AND left_at IS NULL
            """)
            
            is_participant = self.db.execute(
                participant_check, 
                {"conversation_id": conversation_id, "user_id": user_id}
            ).fetchone()
            
            if not is_participant:
                return {
                    "success": False,
                    "error": "Not authorized to view this conversation"
                }
            
            # Get conversation details
            conv_query = text("""
                SELECT 
                    conversation_id,
                    conversation_type,
                    title,
                    is_private,
                    max_participants,
                    conversation_metadata,
                    created_at,
                    updated_at
                FROM msg_conversations
                WHERE conversation_id = :conversation_id
            """)
            
            conv_result = self.db.execute(conv_query, {"conversation_id": conversation_id}).fetchone()
            
            if not conv_result:
                return {
                    "success": False,
                    "error": "Conversation not found"
                }
            
            # Get all participants
            participants_query = text("""
                SELECT u.user_id, u.username, u.display_name, u.avatar, u.is_active,
                       cp.role, cp.joined_at, cp.is_admin
                FROM msg_conversation_participants cp
                JOIN core_users u ON cp.user_id = u.user_id
                WHERE cp.conversation_id = :conversation_id AND cp.left_at IS NULL
                ORDER BY cp.joined_at
            """)
            
            participants_result = self.db.execute(
                participants_query, 
                {"conversation_id": conversation_id}
            )
            
            participants = []
            for p_row in participants_result:
                participants.append({
                    "user_id": p_row.user_id,
                    "username": p_row.username,
                    "display_name": p_row.display_name,
                    "avatar": p_row.avatar,
                    "is_active": p_row.is_active,
                    "role": p_row.role or "member",
                    "is_admin": p_row.is_admin or False,
                    "joined_at": p_row.joined_at.isoformat() if p_row.joined_at else None
                })
            
            return {
                "success": True,
                "conversation": {
                    "conversation_id": conv_result.conversation_id,
                    "conversation_type": conv_result.conversation_type,
                    "title": conv_result.title or self._generate_conversation_title(participants, user_id),
                    "is_private": conv_result.is_private,
                    "max_participants": conv_result.max_participants,
                    "metadata": conv_result.conversation_metadata,
                    "created_at": conv_result.created_at.isoformat() if conv_result.created_at else None,
                    "updated_at": conv_result.updated_at.isoformat() if conv_result.updated_at else None,
                    "participants": participants
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting conversation details {conversation_id}: {e}")
            return {
                "success": False,
                "error": "Failed to get conversation details"
            }
    
    # ========== PLACEHOLDER METHODS FOR ADVANCED FEATURES ==========
    # These return "not implemented" responses to avoid errors
    
    def create_conversation(self, *args, **kwargs):
        return {"success": False, "error": "Feature not implemented yet", "code": "NOT_IMPLEMENTED"}
    
    def update_conversation_details(self, *args, **kwargs):
        return {"success": False, "error": "Feature not implemented yet", "code": "NOT_IMPLEMENTED"}
    
    def add_participants(self, *args, **kwargs):
        return {"success": False, "error": "Feature not implemented yet", "code": "NOT_IMPLEMENTED"}
    
    def remove_participant(self, *args, **kwargs):
        return {"success": False, "error": "Feature not implemented yet", "code": "NOT_IMPLEMENTED"}
    
    def update_participant(self, *args, **kwargs):
        return {"success": False, "error": "Feature not implemented yet", "code": "NOT_IMPLEMENTED"}
    
    def send_message(self, *args, **kwargs):
        return {"success": False, "error": "Feature not implemented yet", "code": "NOT_IMPLEMENTED"}
    
    def get_messages(self, *args, **kwargs):
        return {"success": False, "error": "Feature not implemented yet", "code": "NOT_IMPLEMENTED"}
    
    def edit_message(self, *args, **kwargs):
        return {"success": False, "error": "Feature not implemented yet", "code": "NOT_IMPLEMENTED"}
    
    def delete_message(self, *args, **kwargs):
        return {"success": False, "error": "Feature not implemented yet", "code": "NOT_IMPLEMENTED"}
    
    def add_reaction(self, *args, **kwargs):
        return {"success": False, "error": "Feature not implemented yet", "code": "NOT_IMPLEMENTED"}
    
    def remove_reaction(self, *args, **kwargs):
        return {"success": False, "error": "Feature not implemented yet", "code": "NOT_IMPLEMENTED"}
    
    def pin_message(self, *args, **kwargs):
        return {"success": False, "error": "Feature not implemented yet", "code": "NOT_IMPLEMENTED"}
    
    def unpin_message(self, *args, **kwargs):
        return {"success": False, "error": "Feature not implemented yet", "code": "NOT_IMPLEMENTED"}
    
    def start_typing(self, *args, **kwargs):
        return {"success": False, "error": "Feature not implemented yet", "code": "NOT_IMPLEMENTED"}
    
    def stop_typing(self, *args, **kwargs):
        return {"success": False, "error": "Feature not implemented yet", "code": "NOT_IMPLEMENTED"}
    
    def update_presence(self, *args, **kwargs):
        return {"success": False, "error": "Feature not implemented yet", "code": "NOT_IMPLEMENTED"}
    
    def get_user_presence(self, *args, **kwargs):
        return {"success": False, "error": "Feature not implemented yet", "code": "NOT_IMPLEMENTED"}
    
    def mark_conversation_read(self, *args, **kwargs):
        return {"success": False, "error": "Feature not implemented yet", "code": "NOT_IMPLEMENTED"}
    
    def search_messages(self, *args, **kwargs):
        return {"success": False, "error": "Feature not implemented yet", "code": "NOT_IMPLEMENTED"}
    
    def get_conversation_threads(self, *args, **kwargs):
        return {"success": False, "error": "Feature not implemented yet", "code": "NOT_IMPLEMENTED"}
    
    def get_pinned_messages(self, *args, **kwargs):
        return {"success": False, "error": "Feature not implemented yet", "code": "NOT_IMPLEMENTED"}
    
    def get_conversation_analytics(self, *args, **kwargs):
        return {"success": False, "error": "Feature not implemented yet", "code": "NOT_IMPLEMENTED"}