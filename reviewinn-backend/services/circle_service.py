"""
Circle service layer for handling review circle-related business logic.
Fully refactored for new social_circle database structure.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime, timedelta
import random

from models.review_circle import SocialCircleMember, SocialCircleRequest, SocialCircleBlock
from models.user import User
from services.notification_trigger_service_enterprise import NotificationTriggerService
from schemas.circle import (
    CircleCreateRequest,
    CircleUpdateRequest,
    CircleResponse,
    CircleMemberResponse,
    CircleSuggestionResponse,
    CircleAnalyticsResponse,
    CircleUserResponse,
    TrustLevel,
    CircleListParams,
    CircleMemberListParams,
    CircleSuggestionListParams
)
from schemas.common import PaginatedAPIResponse, PaginationSchema
from core.exceptions import (
    NotFoundError,
    ValidationError,
    DuplicateError,
    BusinessLogicError,
    AuthorizationError
)


class CircleService:
    """Service for review circle-related business logic."""
    
    def __init__(self, db: Session):
        """Initialize with database session."""
        self.db = db
        self.notification_trigger = NotificationTriggerService(db)
    
    def create_circle(self, circle_data: CircleCreateRequest, creator_id: int) -> CircleResponse:
        """Create a new review circle with validation."""
        # Note: Circle creation is no longer supported as system is now peer-to-peer
        # This method is kept for backward compatibility but raises an error
        raise BusinessLogicError("Circle creation is no longer supported. The system now uses direct peer-to-peer connections.")
    
    def get_circles(self, params: CircleListParams) -> PaginatedAPIResponse[CircleResponse]:
        """Get list of circles with pagination."""
        # Note: Circle listing is no longer supported as system is now peer-to-peer
        # Return empty list for backward compatibility
        return PaginatedAPIResponse(
            data=[],
            pagination=PaginationSchema(
                total=0,
                page=params.page,
                per_page=params.size,
                pages=0,
                has_next=False,
                has_prev=False
            )
        )
    
    def send_circle_request(self, current_user_id: int, user_id: int, message: str) -> Dict[str, Any]:
        """Send a circle request to another user with validation."""
        try:
            # Validate input
            if not user_id:
                raise ValidationError("User ID is required")
            
            if user_id == current_user_id:
                raise ValidationError("Cannot send request to yourself")
            
            # Basic message validation
            if message and len(message.strip()) > 500:
                raise ValidationError("Message cannot exceed 500 characters")
            
            # Check if target user exists
            target_user = self.db.query(User).filter(User.user_id == user_id).first()
            if not target_user:
                raise NotFoundError("Target user not found")
            
            # Check if current user exists
            current_user = self.db.query(User).filter(User.user_id == current_user_id).first()
            if not current_user:
                raise NotFoundError("Current user not found")
            
            # Check if request already exists (only block pending and accepted, allow resending after rejected/cancelled)
            existing_request = self.db.query(SocialCircleRequest).filter(
                and_(
                    SocialCircleRequest.requester_id == current_user_id,
                    SocialCircleRequest.recipient_id == user_id,
                    SocialCircleRequest.status.in_(['pending', 'accepted'])
                )
            ).first()
            
            if existing_request:
                if existing_request.status == 'pending':
                    raise DuplicateError("Circle request already sent to this user")
                elif existing_request.status == 'accepted':
                    raise DuplicateError("User is already in your circle")
            
            # Check if users are blocked
            blocked_check = self.db.query(SocialCircleBlock).filter(
                or_(
                    and_(SocialCircleBlock.blocker_id == current_user_id, SocialCircleBlock.blocked_user_id == user_id),
                    and_(SocialCircleBlock.blocker_id == user_id, SocialCircleBlock.blocked_user_id == current_user_id)
                )
            ).first()
            
            if blocked_check:
                raise AuthorizationError("Cannot send request to blocked user")
            
            # Check if users are already connected in any circle
            current_user_circles = self.db.query(SocialCircleMember.circle_id).filter(
                SocialCircleMember.member_id == current_user_id
            ).subquery()
            
            existing_connection = self.db.query(SocialCircleMember).filter(
                and_(
                    SocialCircleMember.member_id == user_id,
                    SocialCircleMember.circle_id.in_(current_user_circles)
                )
            ).first()
            
            if existing_connection:
                raise DuplicateError("User is already in your circle")
            
            # Create new circle request
            circle_request = SocialCircleRequest(
                requester_id=current_user_id,
                recipient_id=user_id,
                request_message=message or f"Hi {target_user.name}, I'd like to connect with you in my review circle!",
                request_type='circle',
                status='pending',
                requested_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(days=30)
            )
            
            self.db.add(circle_request)
            self.db.commit()
            self.db.refresh(circle_request)
            
            print(f"✅ Circle request created successfully:")
            print(f"   - Request ID: {circle_request.request_id}")
            print(f"   - From: {current_user.username} (ID: {current_user_id})")
            print(f"   - To: {target_user.username} (ID: {user_id})")
            print(f"   - Status: {circle_request.status}")
            print(f"   - Created at: {circle_request.created_at}")
            
            return {
                "message": "Circle request sent successfully",
                "request_id": circle_request.request_id
            }
            
        except Exception as e:
            self.db.rollback()
            if isinstance(e, (ValidationError, NotFoundError, DuplicateError, AuthorizationError)):
                raise
            raise BusinessLogicError(f"Failed to send circle request: {str(e)}")

    def search_users(self, query: str, limit: int, current_user_id: int) -> Dict[str, List[Dict[str, Any]]]:
        """Search for users by name, username, or email to add to circle."""
        try:
            print(f"🔍 Searching users with query: '{query}', limit: {limit}, current_user: {current_user_id}")
            # Get blocked user IDs to exclude them
            blocked_user_ids = self.db.query(SocialCircleBlock.blocked_user_id).filter(
                SocialCircleBlock.blocker_id == current_user_id
            ).subquery()
            
            # Get user IDs with pending requests to exclude them
            pending_request_user_ids = self.db.query(SocialCircleRequest.recipient_id).filter(
                and_(
                    SocialCircleRequest.requester_id == current_user_id,
                    SocialCircleRequest.status == 'pending'
                )
            ).subquery()
            
            # Get user IDs already in circles to exclude them
            circle_member_ids = self.db.query(SocialCircleMember.member_id).filter(
                SocialCircleMember.owner_id == current_user_id
            ).subquery()
            
            # Query users matching the search term
            users_query = self.db.query(User).filter(
                and_(
                    User.is_active == True,
                    User.user_id != current_user_id,  # Exclude current user
                    ~User.user_id.in_(blocked_user_ids),  # Exclude blocked users
                    ~User.user_id.in_(pending_request_user_ids),  # Exclude users with pending requests
                    ~User.user_id.in_(circle_member_ids),  # Exclude users already in circles
                    or_(
                        User.display_name.ilike(f"%{query}%"),
                        User.first_name.ilike(f"%{query}%"),
                        User.last_name.ilike(f"%{query}%"),
                        User.username.ilike(f"%{query}%"),
                        User.email.ilike(f"%{query}%")
                    )
                )
            ).limit(limit)

            users = users_query.all()
            print(f"📊 Found {len(users)} users matching search query")

            # Convert to response format
            user_list = []
            for user in users:
                try:
                    # Safely construct name field
                    name = user.display_name or f"{user.first_name or ''} {user.last_name or ''}".strip() or user.username
                    if hasattr(user, 'name'):
                        name = user.name
                    
                    user_data = {
                        "id": str(user.user_id),  # Convert to string for frontend compatibility
                        "name": name,
                        "username": user.username or "",
                        "email": user.email or "",
                        "avatar": user.avatar,
                        "level": user.level or 1,
                        "points": user.points or 0,
                        "badges": [],
                        "createdAt": user.created_at.isoformat() if user.created_at else "",
                        "preferences": user.preferences or {
                            "notifications": {"email": True, "reviewReplies": True},
                            "privacy": {"profileVisible": True, "showContexts": True}
                        },
                        "stats": {
                            "totalReviews": user.review_count or 0,
                            "averageRatingGiven": 0.0,
                            "entitiesReviewed": 0,
                            "streakDays": 0
                        },
                        "following": [],
                        "followers": []
                    }
                    user_list.append(user_data)
                    
                except Exception as user_error:
                    print(f"❌ Error processing user {user.user_id}: {str(user_error)}")
                    continue
            
            print(f"🎯 Returning {len(user_list)} users for search query: '{query}'")
            return {"users": user_list}
            
        except Exception as e:
            print(f"❌ Search users error: {str(e)}")
            raise BusinessLogicError(f"Failed to search users: {str(e)}")