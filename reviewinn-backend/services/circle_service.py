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
                try:
                    # Safely get requester data
                    requester_user = request.requester
                    if not requester_user:
                        print(f"❌ No requester found for request {request.request_id}")
                        continue
                    
                    # Safely construct name
                    requester_name = requester_user.name if hasattr(requester_user, 'name') else (
                        requester_user.display_name or 
                        f"{requester_user.first_name or ''} {requester_user.last_name or ''}".strip() or 
                        requester_user.username
                    )
                    
                    request_data = {
                        "id": request.request_id,
                        "requester": {
                            "id": requester_user.user_id,
                            "name": requester_name,
                            "username": requester_user.username,
                            "avatar": requester_user.avatar
                        },
                        "message": request.request_message or "Circle request",
                        "created_at": request.created_at.isoformat(),
                        "status": request.status
                    }
                    request_list.append(request_data)
                    
                except Exception as request_error:
                    print(f"❌ Error processing pending request {request.request_id}: {str(request_error)}")
                    continue
            
            return {"requests": request_list}
            
        except Exception as e:
            raise BusinessLogicError(f"Failed to get pending requests: {str(e)}")

    def get_sent_requests(self, current_user_id: int) -> Dict[str, List[Dict[str, Any]]]:
        """Get sent circle requests for the current user."""
        try:
            print(f"🔍 Getting sent requests for user: {current_user_id}")
            
            # First check if the user exists
            current_user = self.db.query(User).filter(User.user_id == current_user_id).first()
            if not current_user:
                print(f"❌ User {current_user_id} not found in core_users table")
                return {"requests": []}
            
            print(f"✅ User found: {current_user.username} (ID: {current_user_id})")
            
            # Get requests sent by the current user (including all statuses for tracking)
            requests = self.db.query(SocialCircleRequest).filter(
                SocialCircleRequest.requester_id == current_user_id
            ).order_by(SocialCircleRequest.created_at.desc()).all()
            
            print(f"📊 Found {len(requests)} sent requests for user {current_user.username}")
            
            request_list = []
            for request in requests:
                try:
                    print(f"🔄 Processing request {request.request_id} to user {request.recipient_id}")
                    
                    # Get recipient user data
                    recipient_user = request.recipient
                    if not recipient_user:
                        print(f"❌ No recipient found for request {request.request_id}")
                        continue
                        
                    print(f"👤 Recipient user: {recipient_user.user_id}, username: {recipient_user.username}")
                    
                    request_data = {
                        "id": request.request_id,
                        "recipient": {
                            "id": recipient_user.user_id,
                            "name": recipient_user.name if hasattr(recipient_user, 'name') else recipient_user.display_name or recipient_user.username,
                            "username": recipient_user.username,
                            "avatar": recipient_user.avatar
                        },
                        "message": request.request_message,
                        "created_at": request.created_at.isoformat(),
                        "status": request.status,
                        "responded_at": request.responded_at.isoformat() if request.responded_at else None
                    }
                    request_list.append(request_data)
                    print(f"✅ Successfully processed request {request.request_id}")
                    
                except Exception as req_error:
                    print(f"❌ Error processing request {request.request_id}: {str(req_error)}")
                    continue
            
            print(f"📋 Returning {len(request_list)} processed requests")
            return {"requests": request_list}
            
        except Exception as e:
            print(f"❌ Failed to get sent requests: {str(e)}")
            raise BusinessLogicError(f"Failed to get sent requests: {str(e)}")

    def respond_to_request(self, current_user_id: int, request_id: int, action: str, final_relationship: str = None) -> Dict[str, str]:
        """Respond to a circle request with relationship choice."""
        try:
            # Validate action
            if action not in ['accept', 'decline']:
                raise ValidationError("Action must be 'accept' or 'decline'")
            
            # Validate final_relationship if provided
            if final_relationship and final_relationship not in ['circle_member', 'follower']:
                raise ValidationError("Final relationship must be 'circle_member' or 'follower'")
            
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
            
            # Update request status - map frontend action to database status
            status_mapping = {'accept': 'accepted', 'decline': 'rejected'}
            db_status = status_mapping[action]
            
            circle_request.status = db_status
            circle_request.response_type = db_status
            circle_request.responded_at = datetime.utcnow()
            
            # Set final_relationship for accepted requests
            if action == 'accept':
                # Default to circle_member if not specified
                circle_request.final_relationship = final_relationship or 'circle_member'
                
                # The database trigger will handle the social_circle_members updates
                # No need to manually call _add_users_to_circles_after_acceptance
            else:
                # For rejected requests, set final_relationship to 'rejected'
                circle_request.final_relationship = 'rejected'
            
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
            
            # Update request status to cancelled (note: double 'l' as per DB constraint)
            circle_request.status = 'cancelled'
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
            # In the peer-to-peer system, get all users where current user is the owner
            # This represents people in the current user's circle
            query = self.db.query(SocialCircleMember).filter(
                SocialCircleMember.owner_id == current_user_id
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
            # Find connection by circle_id (which is now the connection ID)
            connection = self.db.query(SocialCircleMember).filter(
                SocialCircleMember.circle_id == connection_id
            ).first()
            
            if not connection:
                raise NotFoundError("Connection not found")
            
            # In the peer-to-peer system, allow removal if:
            # 1. Current user is the owner of this connection
            # 2. Current user is the member being removed (removing themselves)
            can_remove = (
                connection.owner_id == current_user_id or
                connection.member_id == current_user_id
            )
            
            if not can_remove:
                raise AuthorizationError("You don't have permission to remove this connection")
            
            # Remove the connection
            self.db.delete(connection)
            
            # Also remove the reciprocal connection if it exists
            reciprocal_connection = self.db.query(SocialCircleMember).filter(
                and_(
                    SocialCircleMember.owner_id == connection.member_id,
                    SocialCircleMember.member_id == connection.owner_id
                )
            ).first()
            
            if reciprocal_connection:
                self.db.delete(reciprocal_connection)
            
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
            
            # Remove connections between users in peer-to-peer system
            self.db.query(SocialCircleMember).filter(
                or_(
                    and_(SocialCircleMember.owner_id == current_user_id, SocialCircleMember.member_id == user_id),
                    and_(SocialCircleMember.owner_id == user_id, SocialCircleMember.member_id == current_user_id)
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
                    print(f"✅ Successfully processed user: {user.username} (ID: {user.user_id})")
                    
                except Exception as user_error:
                    print(f"❌ Error processing user {user.user_id}: {str(user_error)}")
                    continue

            print(f"✅ Returning {len(user_list)} users in search results")
            return {"users": user_list}

        except Exception as e:
            print(f"❌ Search users failed: {str(e)}")
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
            
            # Get user IDs with pending/accepted requests from current user (exclude rejected/cancelled)
            existing_request_user_ids = self.db.query(SocialCircleRequest.recipient_id).filter(
                and_(
                    SocialCircleRequest.requester_id == user_id,
                    SocialCircleRequest.status.in_(['pending', 'accepted'])
                )
            ).subquery()
            
            # Get basic user data first
            potential_users = self.db.query(User).filter(
                and_(
                    User.user_id != user_id,
                    User.is_active == True,
                    ~User.user_id.in_(circle_member_ids),
                    ~User.user_id.in_(blocked_user_ids),
                    ~User.user_id.in_(existing_request_user_ids)  # Exclude users with existing requests
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
        # In the new peer-to-peer system, create direct connections between users
        
        # Add recipient to requester's connections (requester owns this connection)
        self._add_user_connection_if_not_exists(requester_id, recipient_id)
        
        # Add requester to recipient's connections (recipient owns this connection)
        self._add_user_connection_if_not_exists(recipient_id, requester_id)

    def _add_user_connection_if_not_exists(self, owner_id: int, member_id: int):
        """Add a user connection if it doesn't already exist."""
        # Check if connection already exists
        existing_connection = self.db.query(SocialCircleMember).filter(
            and_(
                SocialCircleMember.owner_id == owner_id,
                SocialCircleMember.member_id == member_id
            )
        ).first()
        
        if existing_connection:
            return  # Connection already exists
        
        # Create new connection
        connection = SocialCircleMember(
            owner_id=owner_id,
            member_id=member_id,
            membership_type='member',
            joined_at=datetime.utcnow(),
            can_see_private_reviews=False,
            notification_preferences={'mentions': True}
        )
        
        self.db.add(connection)
        self.db.flush()

    def get_followers(self, current_user_id: int) -> Dict[str, List[Dict[str, Any]]]:
        """Get users who follow the current user."""
        try:
            # Get followers from social_circle_members table
            # These are users who have the current user as their owner (they follow current user)
            followers_query = self.db.query(SocialCircleMember).filter(
                SocialCircleMember.owner_id == current_user_id
            ).all()
            
            followers_list = []
            for follower_record in followers_query:
                follower_user = self.db.query(User).filter(
                    User.user_id == follower_record.member_id
                ).first()
                
                if follower_user:
                    followers_list.append({
                        "id": follower_user.user_id,
                        "name": follower_user.name if hasattr(follower_user, 'name') else follower_user.display_name or follower_user.username,
                        "username": follower_user.username,
                        "avatar": follower_user.avatar,
                        "relationship_type": follower_record.membership_type,
                        "followed_since": follower_record.joined_at.isoformat() if follower_record.joined_at else None
                    })
            
            return {"followers": followers_list}
            
        except Exception as e:
            raise BusinessLogicError(f"Failed to get followers: {str(e)}")

    def get_following(self, current_user_id: int) -> Dict[str, List[Dict[str, Any]]]:
        """Get users that the current user follows."""
        try:
            # Get following from social_circle_members table
            # These are records where current user is the member (current user follows the owner)
            following_query = self.db.query(SocialCircleMember).filter(
                SocialCircleMember.member_id == current_user_id
            ).all()
            
            following_list = []
            for following_record in following_query:
                following_user = self.db.query(User).filter(
                    User.user_id == following_record.owner_id
                ).first()
                
                if following_user:
                    following_list.append({
                        "id": following_user.user_id,
                        "name": following_user.name if hasattr(following_user, 'name') else following_user.display_name or following_user.username,
                        "username": following_user.username,
                        "avatar": following_user.avatar,
                        "relationship_type": following_record.membership_type,
                        "followed_since": following_record.joined_at.isoformat() if following_record.joined_at else None
                    })
            
            return {"following": following_list}
            
        except Exception as e:
            raise BusinessLogicError(f"Failed to get following: {str(e)}")

    def demote_circle_mate_to_follower(self, current_user_id: int, user_id: int) -> Dict[str, str]:
        """Demote a circle mate to follower relationship."""
        try:
            # Find the circle relationship where current user is owner and user_id is member
            circle_relationship = self.db.query(SocialCircleMember).filter(
                and_(
                    SocialCircleMember.owner_id == current_user_id,
                    SocialCircleMember.member_id == user_id,
                    SocialCircleMember.membership_type == 'member'
                )
            ).first()
            
            if not circle_relationship:
                raise NotFoundError("Circle relationship not found")
            
            # Update the relationship to follower
            circle_relationship.membership_type = 'follower'
            circle_relationship.updated_at = datetime.utcnow()
            
            # Also update the reverse relationship if it exists
            reverse_relationship = self.db.query(SocialCircleMember).filter(
                and_(
                    SocialCircleMember.owner_id == user_id,
                    SocialCircleMember.member_id == current_user_id,
                    SocialCircleMember.membership_type == 'member'
                )
            ).first()
            
            if reverse_relationship:
                # Remove the reverse relationship since followers are one-way
                self.db.delete(reverse_relationship)
            
            self.db.commit()
            
            return {"message": "User demoted to follower successfully"}
            
        except Exception as e:
            self.db.rollback()
            if isinstance(e, NotFoundError):
                raise
            raise BusinessLogicError(f"Failed to demote user: {str(e)}")

    def promote_follower_to_circle_mate(self, current_user_id: int, user_id: int, message: str = None) -> Dict[str, str]:
        """Send a promotion request to make a follower into a circle mate."""
        try:
            print(f"🔍 Promoting user {user_id} by user {current_user_id}")
            
            # Check if there's already a pending/accepted request
            existing_request = self.db.query(SocialCircleRequest).filter(
                and_(
                    SocialCircleRequest.requester_id == current_user_id,
                    SocialCircleRequest.recipient_id == user_id,
                    SocialCircleRequest.status.in_(['pending', 'accepted'])
                )
            ).first()
            
            if existing_request:
                if existing_request.status == 'pending':
                    raise DuplicateError("Promotion request already sent")
                elif existing_request.status == 'accepted':
                    raise DuplicateError("User is already a circle mate")
            
            # Debug: Check all relationships for this user
            all_relationships = self.db.query(SocialCircleMember).filter(
                or_(
                    and_(SocialCircleMember.owner_id == current_user_id, SocialCircleMember.member_id == user_id),
                    and_(SocialCircleMember.owner_id == user_id, SocialCircleMember.member_id == current_user_id)
                )
            ).all()
            
            print(f"📊 Found {len(all_relationships)} relationships between users {current_user_id} and {user_id}")
            for rel in all_relationships:
                print(f"   - Owner: {rel.owner_id}, Member: {rel.member_id}, Type: {rel.membership_type}")
            
            # Check if user exists in followers
            # In our system: current_user is owner, user_id is member (user_id follows current_user)
            follower_relationship = self.db.query(SocialCircleMember).filter(
                and_(
                    SocialCircleMember.owner_id == current_user_id,  # current_user is the owner
                    SocialCircleMember.member_id == user_id,         # user_id is the follower
                    SocialCircleMember.membership_type.in_(['follower', 'member'])  # Allow any relationship type
                )
            ).first()
            
            if not follower_relationship:
                print(f"❌ No follower relationship found. Available relationships:")
                for rel in all_relationships:
                    print(f"   - {rel.owner_id} -> {rel.member_id} ({rel.membership_type})")
                
                # Check if user appears in current user's followers via the get_followers method
                followers_response = self.get_followers(current_user_id)
                followers_list = followers_response.get('followers', [])
                user_in_followers = any(f['id'] == user_id for f in followers_list)
                
                if user_in_followers:
                    print("✅ User found in followers list via get_followers, creating relationship")
                    # Create the missing follower relationship
                    from datetime import datetime
                    new_relationship = SocialCircleMember(
                        owner_id=current_user_id,
                        member_id=user_id,
                        membership_type='follower',
                        joined_at=datetime.utcnow()
                    )
                    self.db.add(new_relationship)
                    self.db.flush()
                    follower_relationship = new_relationship
                elif all_relationships:
                    print("⚠️ Allowing promotion despite no exact follower match (debug mode)")
                    follower_relationship = all_relationships[0]  # Use the first available relationship
                else:
                    raise ValidationError("User is not in your followers list")
            
            # Get target user
            target_user = self.db.query(User).filter(User.user_id == user_id).first()
            if not target_user:
                raise NotFoundError("Target user not found")
            
            # Create promotion request
            promotion_request = SocialCircleRequest(
                requester_id=current_user_id,
                recipient_id=user_id,
                request_message=message or f"Hi {target_user.name}, I'd like to upgrade our connection to circle mates!",
                request_type='promotion',  # Special type for promotion requests
                status='pending',
                requested_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(days=30)
            )
            
            self.db.add(promotion_request)
            self.db.commit()
            self.db.refresh(promotion_request)
            
            return {
                "message": "Promotion request sent successfully",
                "request_id": promotion_request.request_id
            }
            
        except Exception as e:
            self.db.rollback()
            if isinstance(e, (ValidationError, NotFoundError, DuplicateError)):
                raise
            raise BusinessLogicError(f"Failed to send promotion request: {str(e)}")