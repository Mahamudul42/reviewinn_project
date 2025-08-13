"""
Circle service layer for handling review circle-related business logic.
Fully refactored for new social_circle database structure.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime, timedelta
import random

from models.review_circle import ReviewCircle, SocialCircleMember, SocialCircleRequest, SocialCircleBlock
from models.user import User
from services.notification_trigger_service import NotificationTriggerService
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
        # Basic validation
        if not circle_data.name or not circle_data.name.strip():
            raise ValidationError("Circle name is required")
        if circle_data.max_members and circle_data.max_members < 2:
            raise ValidationError("Circle must allow at least 2 members")
        
        # Check if user exists
        creator = self.db.query(User).filter(User.user_id == creator_id).first()
        if not creator:
            raise NotFoundError("User", creator_id)
        
        # Create new circle
        circle = ReviewCircle(
            name=circle_data.name.strip(),
            description=circle_data.description,
            is_public=circle_data.is_public,
            max_members=circle_data.max_members,
            creator_id=creator_id
        )
        
        self.db.add(circle)
        self.db.commit()
        self.db.refresh(circle)
        
        # Add creator as owner member
        member = SocialCircleMember(
            owner_id=creator_id,
            member_id=creator_id,
            circle_id=circle.circle_id,
            membership_type='owner',
            joined_at=datetime.utcnow(),
            can_see_private_reviews=True,
            notification_preferences={'all': True}
        )
        
        self.db.add(member)
        self.db.commit()
        
        return CircleResponse(
            circle_id=circle.circle_id,
            name=circle.name,
            description=circle.description,
            is_public=circle.is_public,
            max_members=circle.max_members,
            member_count=1,
            creator_id=circle.creator_id,
            created_at=circle.created_at,
            updated_at=circle.updated_at
        )
    
    def get_circles(self, params: CircleListParams) -> PaginatedAPIResponse[CircleResponse]:
        """Get list of circles with pagination."""
        query = self.db.query(ReviewCircle)
        
        # Apply filters
        if params.is_public is not None:
            query = query.filter(ReviewCircle.is_public == params.is_public)
        
        if params.search:
            query = query.filter(
                or_(
                    ReviewCircle.name.ilike(f"%{params.search}%"),
                    ReviewCircle.description.ilike(f"%{params.search}%")
                )
            )
        
        # Get total count
        total_count = query.count()
        
        # Apply pagination
        offset = (params.page - 1) * params.size
        circles = query.offset(offset).limit(params.size).all()
        
        # Get member counts for each circle
        circle_responses = []
        for circle in circles:
            member_count = self.db.query(SocialCircleMember).filter(
                SocialCircleMember.circle_id == circle.circle_id
            ).count()
            
            circle_responses.append(CircleResponse(
                circle_id=circle.circle_id,
                name=circle.name,
                description=circle.description,
                is_public=circle.is_public,
                max_members=circle.max_members,
                member_count=member_count,
                creator_id=circle.creator_id,
                created_at=circle.created_at,
                updated_at=circle.updated_at
            ))
        
        # Calculate pagination info
        total_pages = (total_count + params.size - 1) // params.size
        has_next = params.page < total_pages
        has_prev = params.page > 1
        
        return PaginatedAPIResponse(
            data=circle_responses,
            pagination=PaginationSchema(
                total=total_count,
                page=params.page,
                per_page=params.size,
                pages=total_pages,
                has_next=has_next,
                has_prev=has_prev
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
            
            # Check if request already exists
            existing_request = self.db.query(SocialCircleRequest).filter(
                and_(
                    SocialCircleRequest.requester_id == current_user_id,
                    SocialCircleRequest.recipient_id == user_id,
                    SocialCircleRequest.status == 'pending'
                )
            ).first()
            
            if existing_request:
                raise DuplicateError("Circle request already sent to this user")
            
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
            
            return {
                "message": "Circle request sent successfully",
                "request_id": circle_request.request_id
            }
            
        except Exception as e:
            self.db.rollback()
            if isinstance(e, (ValidationError, NotFoundError, DuplicateError, AuthorizationError)):
                raise
            raise BusinessLogicError(f"Failed to send circle request: {str(e)}")

    def get_pending_requests(self, current_user_id: int) -> Dict[str, List[Dict[str, Any]]]:
        """Get pending circle requests for the current user."""
        try:
            # Get requests sent to the current user
            requests = self.db.query(SocialCircleRequest).filter(
                and_(
                    SocialCircleRequest.recipient_id == current_user_id,
                    SocialCircleRequest.status == 'pending'
                )
            ).order_by(SocialCircleRequest.created_at.desc()).all()
            
            request_list = []
            for request in requests:
                request_data = {
                    "id": request.request_id,
                    "requester": {
                        "id": request.requester.user_id,
                        "name": request.requester.name,
                        "username": request.requester.username,
                        "avatar": request.requester.avatar
                    },
                    "message": request.request_message,
                    "created_at": request.created_at.isoformat(),
                    "status": request.status
                }
                request_list.append(request_data)
            
            return {"requests": request_list}
            
        except Exception as e:
            raise BusinessLogicError(f"Failed to get pending requests: {str(e)}")

    def get_sent_requests(self, current_user_id: int) -> Dict[str, List[Dict[str, Any]]]:
        """Get sent circle requests for the current user."""
        try:
            # Get requests sent by the current user
            requests = self.db.query(SocialCircleRequest).filter(
                SocialCircleRequest.requester_id == current_user_id
            ).order_by(SocialCircleRequest.created_at.desc()).all()
            
            request_list = []
            for request in requests:
                request_data = {
                    "id": request.request_id,
                    "recipient": {
                        "id": request.recipient.user_id,
                        "name": request.recipient.name,
                        "username": request.recipient.username,
                        "avatar": request.recipient.avatar
                    },
                    "message": request.request_message,
                    "created_at": request.created_at.isoformat(),
                    "status": request.status,
                    "responded_at": request.responded_at.isoformat() if request.responded_at else None
                }
                request_list.append(request_data)
            
            return {"requests": request_list}
            
        except Exception as e:
            raise BusinessLogicError(f"Failed to get sent requests: {str(e)}")

    def respond_to_request(self, current_user_id: int, request_id: int, action: str) -> Dict[str, str]:
        """Respond to a circle request (accept or decline)."""
        try:
            # Validate action
            if action not in ['accept', 'decline']:
                raise ValidationError("Action must be 'accept' or 'decline'")
            
            # Get the request
            circle_request = self.db.query(SocialCircleRequest).filter(
                and_(
                    SocialCircleRequest.request_id == request_id,
                    SocialCircleRequest.recipient_id == current_user_id,
                    SocialCircleRequest.status == 'pending'
                )
            ).first()
            
            if not circle_request:
                raise NotFoundError("Circle request not found or already responded")
            
            # Update request status
            circle_request.status = action
            circle_request.response_type = action
            circle_request.responded_at = datetime.utcnow()
            
            # If accepted, add users to each other's circles
            if action == 'accept':
                self._add_users_to_circles_after_acceptance(circle_request.requester_id, circle_request.recipient_id)
            
            self.db.commit()
            
            return {"message": f"Request {action}ed successfully"}
            
        except Exception as e:
            self.db.rollback()
            if isinstance(e, (ValidationError, NotFoundError)):
                raise
            raise BusinessLogicError(f"Failed to respond to request: {str(e)}")

    def cancel_sent_request(self, current_user_id: int, request_id: int) -> Dict[str, str]:
        """Cancel a sent circle request."""
        try:
            # Get the request - only allow canceling if current user is the requester
            circle_request = self.db.query(SocialCircleRequest).filter(
                and_(
                    SocialCircleRequest.request_id == request_id,
                    SocialCircleRequest.requester_id == current_user_id,
                    SocialCircleRequest.status == 'pending'
                )
            ).first()
            
            if not circle_request:
                raise NotFoundError("Circle request not found or cannot be canceled")
            
            # Update request status to canceled
            circle_request.status = 'canceled'
            circle_request.responded_at = datetime.utcnow()
            
            self.db.commit()
            
            return {"message": "Circle request canceled successfully"}
            
        except Exception as e:
            self.db.rollback()
            if isinstance(e, NotFoundError):
                raise
            raise BusinessLogicError(f"Failed to cancel request: {str(e)}")

    def get_my_circle_members(self, current_user_id: int, params: CircleMemberListParams) -> Dict[str, Any]:
        """Get members of the current user's circle(s)."""
        try:
            # Get all circles where the current user is a member
            user_circles = self.db.query(SocialCircleMember.circle_id).filter(
                SocialCircleMember.member_id == current_user_id
            ).subquery()
            
            # Get all members in those circles (excluding the current user)
            query = self.db.query(SocialCircleMember).filter(
                and_(
                    SocialCircleMember.circle_id.in_(user_circles),
                    SocialCircleMember.member_id != current_user_id  # Exclude current user
                )
            )
            
            if params.trust_level:
                # Map trust_level to membership_type
                membership_mapping = {
                    TrustLevel.REVIEW_MENTOR: 'owner',
                    TrustLevel.TRUSTED_REVIEWER: 'admin',
                    TrustLevel.REVIEWER: 'member'
                }
                membership_type = membership_mapping.get(params.trust_level, 'member')
                query = query.filter(SocialCircleMember.membership_type == membership_type)
            
            total_count = query.count()
            
            offset = (params.page - 1) * params.size
            members = query.offset(offset).limit(params.size).all()
            
            member_responses = []
            for member in members:
                user = self.db.query(User).filter(User.user_id == member.member_id).first()
                if user:
                    # Map membership_type back to trust_level
                    trust_level_mapping = {
                        'owner': TrustLevel.REVIEW_MENTOR,
                        'admin': TrustLevel.TRUSTED_REVIEWER,
                        'member': TrustLevel.REVIEWER
                    }
                    trust_level = trust_level_mapping.get(member.membership_type, TrustLevel.REVIEWER)
                    
                    member_responses.append(CircleMemberResponse(
                        connection_id=member.circle_id,  # Using circle_id as connection_id for compatibility
                        user=CircleUserResponse(
                            user_id=user.user_id,
                            name=user.name,
                            username=user.username,
                            avatar=user.avatar
                        ),
                        trust_level=trust_level,
                        taste_match_score=80.0,  # Default score
                        connected_since=member.joined_at,
                        last_interaction=member.updated_at,
                        interaction_count=0
                    ))
            
            return {
                "members": member_responses,
                "total_count": total_count
            }
            
        except Exception as e:
            raise BusinessLogicError(f"Failed to get circle members: {str(e)}")

    def remove_user_from_circle(self, connection_id: int, current_user_id: int) -> Dict[str, str]:
        """Remove a user from circle."""
        try:
            # Find member by circle_id (connection_id in legacy terms)
            member = self.db.query(SocialCircleMember).filter(
                SocialCircleMember.circle_id == connection_id
            ).first()
            
            if not member:
                raise NotFoundError("Member not found")
            
            # Check if current user has permission to remove
            circle = self.db.query(ReviewCircle).filter(
                ReviewCircle.circle_id == member.circle_id
            ).first()
            
            if not circle:
                raise NotFoundError("Circle not found")
            
            # Get current user's membership to check their role
            current_user_membership = self.db.query(SocialCircleMember).filter(
                and_(
                    SocialCircleMember.circle_id == member.circle_id,
                    SocialCircleMember.member_id == current_user_id
                )
            ).first()
            
            # Allow removal if:
            # 1. User is circle creator
            # 2. User is an owner/admin
            # 3. User is removing themselves
            can_remove = (
                circle.creator_id == current_user_id or
                (current_user_membership and current_user_membership.membership_type in ['owner', 'admin']) or
                member.member_id == current_user_id
            )
            
            if not can_remove:
                raise AuthorizationError("You don't have permission to remove this user")
            
            # Don't allow owner to remove themselves if they're the only owner
            if (member.member_id == current_user_id and 
                member.membership_type == 'owner'):
                
                other_owners = self.db.query(SocialCircleMember).filter(
                    and_(
                        SocialCircleMember.circle_id == member.circle_id,
                        SocialCircleMember.member_id != current_user_id,
                        SocialCircleMember.membership_type == 'owner'
                    )
                ).count()
                
                if other_owners == 0:
                    raise ValidationError("Cannot remove yourself as the only circle owner")
            
            # Remove the member
            self.db.delete(member)
            self.db.commit()
            
            return {"message": "User removed from circle successfully"}
            
        except Exception as e:
            self.db.rollback()
            if isinstance(e, (NotFoundError, AuthorizationError, ValidationError)):
                raise
            raise BusinessLogicError(f"Failed to remove user from circle: {str(e)}")

    def block_user(self, user_id: int, current_user_id: int, reason: str = None) -> Dict[str, str]:
        """Block a user (prevents them from sending requests or seeing your reviews)."""
        try:
            if user_id == current_user_id:
                raise ValidationError("Cannot block yourself")
            
            # Check if user exists
            user = self.db.query(User).filter(User.user_id == user_id).first()
            if not user:
                raise NotFoundError("User not found")
            
            # Check if already blocked
            existing_block = self.db.query(SocialCircleBlock).filter(
                and_(
                    SocialCircleBlock.blocker_id == current_user_id,
                    SocialCircleBlock.blocked_user_id == user_id
                )
            ).first()
            
            if existing_block:
                raise DuplicateError("User is already blocked")
            
            # Remove any existing requests between users
            self.db.query(SocialCircleRequest).filter(
                or_(
                    and_(SocialCircleRequest.requester_id == current_user_id, SocialCircleRequest.recipient_id == user_id),
                    and_(SocialCircleRequest.requester_id == user_id, SocialCircleRequest.recipient_id == current_user_id)
                )
            ).delete()
            
            # Remove from circles
            user_circles = self.db.query(SocialCircleMember.circle_id).filter(
                SocialCircleMember.member_id == current_user_id
            ).subquery()
            
            self.db.query(SocialCircleMember).filter(
                and_(
                    SocialCircleMember.member_id == user_id,
                    SocialCircleMember.circle_id.in_(user_circles)
                )
            ).delete()
            
            # Create block record
            block_record = SocialCircleBlock(
                blocker_id=current_user_id,
                blocked_user_id=user_id,
                block_reason=reason or "User blocked",
                block_type='full'
            )
            
            self.db.add(block_record)
            self.db.commit()
            
            return {"message": f"User {user.name} has been blocked"}
            
        except Exception as e:
            self.db.rollback()
            if isinstance(e, (NotFoundError, ValidationError, DuplicateError)):
                raise
            raise BusinessLogicError(f"Failed to block user: {str(e)}")

    def unblock_user(self, user_id: int, current_user_id: int) -> Dict[str, str]:
        """Unblock a user."""
        try:
            # Remove block record
            block_record = self.db.query(SocialCircleBlock).filter(
                and_(
                    SocialCircleBlock.blocker_id == current_user_id,
                    SocialCircleBlock.blocked_user_id == user_id
                )
            ).first()
            
            if not block_record:
                raise NotFoundError("Block record not found")
            
            self.db.delete(block_record)
            self.db.commit()
            
            return {"message": "User has been unblocked"}
            
        except Exception as e:
            self.db.rollback()
            if isinstance(e, NotFoundError):
                raise
            raise BusinessLogicError(f"Failed to unblock user: {str(e)}")

    def get_blocked_users(self, current_user_id: int) -> Dict[str, List[Dict[str, Any]]]:
        """Get list of blocked users."""
        try:
            blocked_records = self.db.query(SocialCircleBlock).filter(
                SocialCircleBlock.blocker_id == current_user_id
            ).all()
            
            blocked_users = []
            for record in blocked_records:
                blocked_user = self.db.query(User).filter(User.user_id == record.blocked_user_id).first()
                if blocked_user:
                    blocked_users.append({
                        "id": blocked_user.user_id,
                        "name": blocked_user.name,
                        "username": blocked_user.username,
                        "avatar": blocked_user.avatar,
                        "blocked_at": record.created_at.isoformat(),
                        "reason": record.block_reason
                    })
            
            return {"blocked_users": blocked_users}
            
        except Exception as e:
            raise BusinessLogicError(f"Failed to get blocked users: {str(e)}")

    def search_users(self, query: str, limit: int, current_user_id: int) -> Dict[str, List[Dict[str, Any]]]:
        """Search for users by name, username, or email to add to circle."""
        try:
            # Get blocked user IDs to exclude them
            blocked_user_ids = self.db.query(SocialCircleBlock.blocked_user_id).filter(
                SocialCircleBlock.blocker_id == current_user_id
            ).subquery()
            
            # Query users matching the search term
            users_query = self.db.query(User).filter(
                and_(
                    User.is_active == True,
                    User.user_id != current_user_id,  # Exclude current user
                    ~User.user_id.in_(blocked_user_ids),  # Exclude blocked users
                    or_(
                        User.name.ilike(f"%{query}%"),
                        User.username.ilike(f"%{query}%"),
                        User.email.ilike(f"%{query}%")
                    )
                )
            ).limit(limit)

            users = users_query.all()

            # Convert to response format
            user_list = []
            for user in users:
                user_data = {
                    "id": str(user.user_id),  # Convert to string for frontend compatibility
                    "name": user.name,
                    "username": user.username,
                    "email": user.email,
                    "avatar": user.avatar,
                    "level": user.level or 1,
                    "points": user.points or 0,
                    "badges": [],
                    "createdAt": user.created_at.isoformat() if user.created_at else "",
                    "preferences": user.preferences or {
                        "notifications": {"email": True, "reviewReplies": True},
                        "privacy": {"profileVisible": True, "showContexts": True}
                    },
                    "stats": user.stats or {
                        "totalReviews": 0,
                        "averageRatingGiven": 0.0,
                        "entitiesReviewed": 0,
                        "streakDays": 0
                    },
                    "following": [],
                    "followers": []
                }
                user_list.append(user_data)

            return {"users": user_list}

        except Exception as e:
            raise BusinessLogicError(f"Failed to search users: {str(e)}")

    def get_suggestions(self, user_id: int, params: CircleSuggestionListParams) -> Dict[str, List[CircleSuggestionResponse]]:
        """Get circle member suggestions based on users with highest reviews."""
        try:
            # Get users not in any of the user's circles and not blocked
            user_circles = self.db.query(SocialCircleMember.circle_id).filter(
                SocialCircleMember.member_id == user_id
            ).subquery()
            
            # Get user IDs already in circles
            circle_member_ids = self.db.query(SocialCircleMember.member_id).filter(
                SocialCircleMember.circle_id.in_(user_circles)
            ).subquery()
            
            # Get blocked user IDs
            blocked_user_ids = self.db.query(SocialCircleBlock.blocked_user_id).filter(
                SocialCircleBlock.blocker_id == user_id
            ).subquery()
            
            # Get basic user data first
            potential_users = self.db.query(User).filter(
                and_(
                    User.user_id != user_id,
                    User.is_active == True,
                    ~User.user_id.in_(circle_member_ids),
                    ~User.user_id.in_(blocked_user_ids)
                )
            ).limit(params.limit or 10).all()
            
            suggestions = []
            for user in potential_users:
                # Simple scoring based on user level and activity
                level = getattr(user, 'level', 1) or 1
                
                # Calculate taste match score based on user level
                if level >= 10:
                    taste_match_score = random.uniform(75.0, 95.0)
                elif level >= 5:
                    taste_match_score = random.uniform(65.0, 85.0)
                else:
                    taste_match_score = random.uniform(55.0, 75.0)
                
                if taste_match_score >= (params.min_taste_match or 0):
                    # Generate reasons based on user activity
                    reasons = []
                    if level >= 10:
                        reasons.append("Experienced user")
                    elif level >= 5:
                        reasons.append("Active user")
                    else:
                        reasons.append("New user")
                    
                    reasons.append(f"Level {level}")
                    
                    suggestions.append(CircleSuggestionResponse(
                        user=CircleUserResponse(
                            user_id=user.user_id,
                            name=user.name,
                            username=user.username,
                            avatar=user.avatar
                        ),
                        taste_match_score=taste_match_score,
                        reasons=reasons,
                        mutual_connections=random.randint(0, 3)
                    ))
            
            return {"suggestions": suggestions}
            
        except Exception as e:
            raise BusinessLogicError(f"Failed to get suggestions: {str(e)}")

    def _add_users_to_circles_after_acceptance(self, requester_id: int, recipient_id: int):
        """Add users to each other's circles after request acceptance."""
        # Get or create default circles for both users
        requester_circle = self._get_or_create_default_circle(requester_id)
        recipient_circle = self._get_or_create_default_circle(recipient_id)
        
        # Add recipient to requester's circle
        self._add_user_to_circle_if_not_exists(recipient_id, requester_circle.circle_id, requester_id)
        
        # Add requester to recipient's circle  
        self._add_user_to_circle_if_not_exists(requester_id, recipient_circle.circle_id, recipient_id)

    def _get_or_create_default_circle(self, user_id: int) -> ReviewCircle:
        """Get user's default circle or create one if it doesn't exist."""
        # Check if user already has a circle (as creator)
        existing_circle = self.db.query(ReviewCircle).filter(
            ReviewCircle.creator_id == user_id
        ).first()
        
        if existing_circle:
            return existing_circle
        
        # Check if user is a member of any circle
        user_membership = self.db.query(SocialCircleMember).filter(
            SocialCircleMember.member_id == user_id
        ).first()
        
        if user_membership:
            return self.db.query(ReviewCircle).filter(
                ReviewCircle.circle_id == user_membership.circle_id
            ).first()
        
        # Create a default circle for the user
        user = self.db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise NotFoundError(f"User with ID {user_id} not found")
        
        default_circle = ReviewCircle(
            name=f"{user.name}'s Review Circle",
            description=f"Personal review circle for {user.name}",
            is_public=True,
            max_members=50,
            creator_id=user_id
        )
        
        self.db.add(default_circle)
        self.db.flush()  # Get the ID without committing
        
        # Add user to their own circle as owner
        user_membership = SocialCircleMember(
            owner_id=user_id,
            member_id=user_id,
            circle_id=default_circle.circle_id,
            membership_type='owner',
            joined_at=datetime.utcnow(),
            can_see_private_reviews=True,
            notification_preferences={'all': True}
        )
        
        self.db.add(user_membership)
        self.db.flush()
        
        return default_circle

    def _add_user_to_circle_if_not_exists(self, user_id: int, circle_id: int, owner_id: int):
        """Add user to circle if they're not already a member."""
        # Check if user is already a member
        existing_membership = self.db.query(SocialCircleMember).filter(
            and_(
                SocialCircleMember.member_id == user_id,
                SocialCircleMember.circle_id == circle_id
            )
        ).first()
        
        if existing_membership:
            return  # User is already a member
        
        # Add user to circle
        membership = SocialCircleMember(
            owner_id=owner_id,
            member_id=user_id,
            circle_id=circle_id,
            membership_type='member',
            joined_at=datetime.utcnow(),
            can_see_private_reviews=False,
            notification_preferences={'mentions': True}
        )
        
        self.db.add(membership)
        self.db.flush()