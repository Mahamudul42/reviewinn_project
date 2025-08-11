"""
Circle service layer for handling review circle-related business logic.
Refactored for better modularity and scalability.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime, timedelta
import random

from models.review_circle import ReviewCircle, CircleInvite, CircleConnection, TrustLevelEnum, CircleInviteStatusEnum
from models.user import User
from services.notification_trigger_service import NotificationTriggerService
from schemas.circle import (
    CircleCreateRequest,
    CircleUpdateRequest,
    CircleInviteRequest,
    CircleInviteResponseRequest,
    TrustLevelUpdateRequest,
    CircleResponse,
    CircleInviteResponse,
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
        
        # Add creator as a member with REVIEW_MENTOR trust level
        connection = CircleConnection(
            user_id=creator_id,
            circle_id=circle.circle_id,
            trust_level=TrustLevelEnum.REVIEW_MENTOR,
            taste_match_score=100.0,
            connected_since=datetime.utcnow(),
            interaction_count=1
        )
        
        self.db.add(connection)
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
            member_count = self.db.query(CircleConnection).filter(
                CircleConnection.circle_id == circle.circle_id
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
    
    def send_invite(self, circle_id: int, invite_data: CircleInviteRequest, requester_id: int) -> Dict[str, Any]:
        """Send a circle invite."""
        # Check if circle exists
        circle = self.db.query(ReviewCircle).filter(ReviewCircle.circle_id == circle_id).first()
        if not circle:
            raise NotFoundError("Circle", circle_id)
        
        # Check if user is member of the circle
        membership = self.db.query(CircleConnection).filter(
            and_(
                CircleConnection.circle_id == circle_id,
                CircleConnection.user_id == requester_id
            )
        ).first()
        
        if not membership:
            raise AuthorizationError("You must be a member of the circle to send invites")
        
        # Check if receiver exists
        receiver = self.db.query(User).filter(User.user_id == invite_data.receiver_id).first()
        if not receiver:
            raise NotFoundError("User", invite_data.receiver_id)
        
        # Check if receiver is already a member
        existing_connection = self.db.query(CircleConnection).filter(
            and_(
                CircleConnection.circle_id == circle_id,
                CircleConnection.user_id == invite_data.receiver_id
            )
        ).first()
        
        if existing_connection:
            raise DuplicateError("User is already a member of this circle")
        
        # Check if invite already exists
        existing_invite = self.db.query(CircleInvite).filter(
            and_(
                CircleInvite.circle_id == circle_id,
                CircleInvite.receiver_id == invite_data.receiver_id,
                CircleInvite.status == CircleInviteStatusEnum.PENDING
            )
        ).first()
        
        if existing_invite:
            raise DuplicateError("Invite already sent to this user")
        
        # Calculate taste match score (mock implementation)
        taste_match_score = random.uniform(60.0, 95.0)
        
        # Create invite
        invite = CircleInvite(
            circle_id=circle_id,
            requester_id=requester_id,
            receiver_id=invite_data.receiver_id,
            note=invite_data.note,
            taste_match_score=taste_match_score,
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        
        self.db.add(invite)
        self.db.commit()
        self.db.refresh(invite)
        
        # Trigger notification for circle invite
        try:
            from services.notification_trigger_service import NotificationTriggerService
            notification_trigger = NotificationTriggerService(self.db)
            notification_trigger.trigger_circle_invite(
                receiver_id=invite_data.receiver_id,
                inviter_id=requester_id,
                circle_name=circle.name,
                circle_id=circle_id
            )
        except Exception as e:
            # Log error but don't fail the invite
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to trigger circle invite notification: {e}")
        
        return {
            "message": "Invite sent successfully",
            "connection_id": invite.invite_id,
            "taste_match_score": taste_match_score
        }
    
    def get_received_invites(self, user_id: int) -> Dict[str, List[CircleInviteResponse]]:
        """Get circle invites received by user."""
        invites = self.db.query(CircleInvite).filter(
            and_(
                CircleInvite.receiver_id == user_id,
                CircleInvite.status == CircleInviteStatusEnum.PENDING
            )
        ).all()
        
        invite_responses = []
        for invite in invites:
            requester = self.db.query(User).filter(User.user_id == invite.requester_id).first()
            receiver = self.db.query(User).filter(User.user_id == invite.receiver_id).first()
            
            invite_responses.append(CircleInviteResponse(
                invite_id=invite.invite_id,
                requester=CircleUserResponse(
                    user_id=requester.user_id,
                    name=requester.name,
                    username=requester.username,
                    avatar=requester.avatar
                ) if requester else None,
                receiver=CircleUserResponse(
                    user_id=receiver.user_id,
                    name=receiver.name,
                    username=receiver.username,
                    avatar=receiver.avatar
                ) if receiver else None,
                note=invite.note,
                taste_match_score=invite.taste_match_score,
                created_at=invite.created_at,
                status=invite.status
            ))
        
        return {"invites": invite_responses}
    
    def respond_to_invite(self, invite_id: int, response_data: CircleInviteResponseRequest, user_id: int) -> Dict[str, str]:
        """Respond to a circle invite."""
        invite = self.db.query(CircleInvite).filter(CircleInvite.invite_id == invite_id).first()
        if not invite:
            raise NotFoundError("Invite", invite_id)
        
        if invite.receiver_id != user_id:
            raise AuthorizationError("You can only respond to your own invites")
        
        if invite.status != CircleInviteStatusEnum.PENDING:
            raise ValidationError("Invite has already been responded to")
        
        if response_data.action == "accept":
            # Create circle connection
            connection = CircleConnection(
                user_id=user_id,
                circle_id=invite.circle_id,
                trust_level=TrustLevelEnum.REVIEWER,
                taste_match_score=invite.taste_match_score,
                connected_since=datetime.utcnow(),
                interaction_count=0
            )
            
            self.db.add(connection)
            invite.status = CircleInviteStatusEnum.ACCEPTED
        else:
            invite.status = CircleInviteStatusEnum.DECLINED
        
        invite.responded_at = datetime.utcnow()
        self.db.commit()
        
        # Get circle and user information for notifications
        circle = self.db.query(ReviewCircle).filter(ReviewCircle.circle_id == invite.circle_id).first()
        if circle:
            # Trigger notification to the person who sent the invite
            if response_data.action == "accept":
                self.notification_trigger.trigger_circle_accepted(
                    requester_id=invite.sender_id,  # Person who sent the invite gets notified
                    accepter_id=user_id,            # Person who accepted
                    circle_name=circle.name,
                    circle_id=circle.circle_id
                )
            else:
                self.notification_trigger.trigger_circle_declined(
                    requester_id=invite.sender_id,  # Person who sent the invite gets notified
                    decliner_id=user_id,            # Person who declined
                    circle_name=circle.name,
                    circle_id=circle.circle_id
                )
        
        return {"message": f"Invite {response_data.action}ed successfully"}
    
    def get_circle_members(self, circle_id: int, params: CircleMemberListParams) -> Dict[str, Any]:
        """Get circle members."""
        query = self.db.query(CircleConnection).filter(CircleConnection.circle_id == circle_id)
        
        if params.trust_level:
            query = query.filter(CircleConnection.trust_level == params.trust_level)
        
        total_count = query.count()
        
        offset = (params.page - 1) * params.size
        connections = query.offset(offset).limit(params.size).all()
        
        members = []
        for connection in connections:
            user = self.db.query(User).filter(User.user_id == connection.user_id).first()
            if user:
                members.append(CircleMemberResponse(
                    connection_id=connection.connection_id,
                    user=CircleUserResponse(
                        user_id=user.user_id,
                        name=user.name,
                        username=user.username,
                        avatar=user.avatar
                    ),
                    trust_level=connection.trust_level,
                    taste_match_score=connection.taste_match_score,
                    connected_since=connection.connected_since,
                    last_interaction=connection.last_interaction,
                    interaction_count=connection.interaction_count
                ))
        
        return {
            "members": members,
            "total_count": total_count
        }
    
    def get_suggestions(self, user_id: int, params: CircleSuggestionListParams) -> Dict[str, List[CircleSuggestionResponse]]:
        """Get circle member suggestions based on users with highest reviews."""
        try:
            # Get users not in any of the user's circles
            user_circles = self.db.query(CircleConnection.circle_id).filter(
                CircleConnection.user_id == user_id
            ).subquery()
            
            # Get user IDs already in circles
            circle_member_ids = self.db.query(CircleConnection.user_id).filter(
                CircleConnection.circle_id.in_(user_circles)
            ).subquery()
            
            # Get basic user data first (without reviews to avoid complex joins)
            potential_users = self.db.query(User).filter(
                and_(
                    User.user_id != user_id,
                    User.is_active == True,
                    ~User.user_id.in_(circle_member_ids)
                )
            ).limit(params.limit or 10).all()
            
            suggestions = []
            for user in potential_users:
                # Simple scoring based on user level and activity
                if hasattr(user, 'level') and user.level:
                    level = user.level
                else:
                    level = 1
                
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
    
    def get_analytics(self, user_id: int) -> CircleAnalyticsResponse:
        """Get circle analytics for user."""
        try:
            # Get user's circle connections
            connections = self.db.query(CircleConnection).filter(
                CircleConnection.user_id == user_id
            ).all()
            
            total_connections = len(connections)
            
            # Trust level breakdown
            trust_level_breakdown = {}
            for level in TrustLevelEnum:
                count = len([c for c in connections if c.trust_level == level])
                trust_level_breakdown[level.value] = count
            
            # Average taste match
            if connections:
                average_taste_match = sum(c.taste_match_score for c in connections) / len(connections)
            else:
                average_taste_match = 0.0
            
            # Recent connections (last 30 days)
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            recent_connections = len([
                c for c in connections 
                if c.connected_since and c.connected_since >= thirty_days_ago
            ])
            
            return CircleAnalyticsResponse(
                total_connections=total_connections,
                trust_level_breakdown=trust_level_breakdown,
                average_taste_match=average_taste_match,
                recent_connections=recent_connections,
                circle_growth={
                    "this_month": recent_connections,
                    "last_month": random.randint(0, 5),
                    "this_year": total_connections
                }
            )
        except Exception as e:
            # Return default analytics if there's an error
            return CircleAnalyticsResponse(
                total_connections=0,
                trust_level_breakdown={level.value: 0 for level in TrustLevelEnum},
                average_taste_match=0.0,
                recent_connections=0,
                circle_growth={
                    "this_month": 0,
                    "last_month": 0,
                    "this_year": 0
                }
            )
    
    def _generate_suggestion_reasons(self, taste_match_score: float) -> List[str]:
        """Generate suggestion reasons based on taste match score."""
        reasons = []
        
        if taste_match_score >= 80:
            reasons.extend([
                "Similar review preferences",
                "Highly compatible taste profile"
            ])
        elif taste_match_score >= 60:
            reasons.extend([
                "Good taste alignment",
                "Complementary review styles"
            ])
        else:
            reasons.extend([
                "Potential for diverse perspectives",
                "Different but valuable viewpoints"
            ])
        
        # Add random additional reasons
        additional_reasons = [
            "Active in similar categories",
            "Similar review frequency",
            "Comparable experience level",
            "Geographic proximity"
        ]
        
        reasons.append(random.choice(additional_reasons))
        return reasons[:3]
    
    def add_user_to_circle(self, add_request: 'AddToCircleRequest', current_user_id: int) -> Dict[str, Any]:
        """Add a user directly to a circle from suggestions."""
        from schemas.circle import AddToCircleRequest
        
        # Determine which circle to add to
        circle_id = add_request.circle_id
        if not circle_id:
            # Use user's primary circle (first circle they're a member of)
            user_connection = self.db.query(CircleConnection).filter(
                CircleConnection.user_id == current_user_id
            ).first()
            
            if not user_connection:
                # Create a default circle for the user
                user = self.db.query(User).filter(User.user_id == current_user_id).first()
                if not user:
                    raise NotFoundError("User", current_user_id)
                
                # Create default circle
                default_circle = ReviewCircle(
                    name=f"{user.name}'s Circle",
                    description="My personal review circle",
                    is_public=False,
                    max_members=50,
                    creator_id=current_user_id
                )
                
                self.db.add(default_circle)
                self.db.commit()
                self.db.refresh(default_circle)
                
                # Add user to their own circle
                user_connection = CircleConnection(
                    user_id=current_user_id,
                    circle_id=default_circle.circle_id,
                    trust_level=TrustLevelEnum.REVIEW_MENTOR,
                    taste_match_score=100.0,
                    connected_since=datetime.utcnow(),
                    interaction_count=1
                )
                
                self.db.add(user_connection)
                self.db.commit()
                
                circle_id = default_circle.circle_id
            else:
                circle_id = user_connection.circle_id
        
        # Check if circle exists
        circle = self.db.query(ReviewCircle).filter(ReviewCircle.circle_id == circle_id).first()
        if not circle:
            raise NotFoundError("Circle", circle_id)
        
        # Check if current user is member of the circle
        membership = self.db.query(CircleConnection).filter(
            and_(
                CircleConnection.circle_id == circle_id,
                CircleConnection.user_id == current_user_id
            )
        ).first()
        
        if not membership:
            raise AuthorizationError("You must be a member of the circle to add users")
        
        # Check if target user exists
        target_user = self.db.query(User).filter(User.user_id == add_request.user_id).first()
        if not target_user:
            raise NotFoundError(f"User with ID {add_request.user_id} not found")
        
        # Check if user is already a member
        existing_connection = self.db.query(CircleConnection).filter(
            and_(
                CircleConnection.circle_id == circle_id,
                CircleConnection.user_id == add_request.user_id
            )
        ).first()
        
        if existing_connection:
            raise DuplicateError("User is already a member of this circle")
        
        # Check circle capacity
        current_member_count = self.db.query(CircleConnection).filter(
            CircleConnection.circle_id == circle_id
        ).count()
        
        if current_member_count >= circle.max_members:
            raise BusinessLogicError("Circle has reached maximum capacity")
        
        # Calculate taste match score (mock implementation)
        taste_match_score = random.uniform(60.0, 95.0)
        
        # Add user to circle
        connection = CircleConnection(
            user_id=add_request.user_id,
            circle_id=circle_id,
            trust_level=TrustLevelEnum.REVIEWER,
            taste_match_score=taste_match_score,
            connected_since=datetime.utcnow(),
            interaction_count=0
        )
        
        self.db.add(connection)
        self.db.commit()
        self.db.refresh(connection)
        
        return {
            "message": "User added to circle successfully",
            "connection_id": connection.connection_id,
            "taste_match_score": taste_match_score,
            "circle_name": circle.name
        }

    def search_users(self, query: str, limit: int, current_user_id: int) -> Dict[str, List[Dict[str, Any]]]:
        """Search for users by name, username, or email to add to circle."""
        try:
            # Query users matching the search term
            users_query = self.db.query(User).filter(
                and_(
                    User.is_active == True,
                    User.user_id != current_user_id,  # Exclude current user
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
            from models.review_circle import CircleRequest
            existing_request = self.db.query(CircleRequest).filter(
                and_(
                    CircleRequest.requester_id == current_user_id,
                    CircleRequest.receiver_id == user_id,
                    CircleRequest.status == 'pending'
                )
            ).first()
            
            if existing_request:
                raise DuplicateError("Circle request already sent to this user")
            
            # Check if users are already connected in any circle
            current_user_circles = self.db.query(CircleConnection.circle_id).filter(
                CircleConnection.user_id == current_user_id
            ).subquery()
            
            existing_connection = self.db.query(CircleConnection).filter(
                and_(
                    CircleConnection.user_id == user_id,
                    CircleConnection.circle_id.in_(current_user_circles)
                )
            ).first()
            
            if existing_connection:
                raise DuplicateError("User is already in your circle")
            
            # Create new circle request
            from models.review_circle import CircleRequest
            circle_request = CircleRequest(
                requester_id=current_user_id,
                receiver_id=user_id,
                message=message or f"Hi {target_user.name}, I'd like to connect with you in my review circle!",
                status='pending'
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
            if isinstance(e, (ValidationError, NotFoundError, DuplicateError)):
                raise
            raise BusinessLogicError(f"Failed to send circle request: {str(e)}")

    def get_pending_requests(self, current_user_id: int) -> Dict[str, List[Dict[str, Any]]]:
        """Get pending circle requests for the current user."""
        try:
            from models.review_circle import CircleRequest
            
            # Get requests sent to the current user
            requests = self.db.query(CircleRequest).filter(
                and_(
                    CircleRequest.receiver_id == current_user_id,
                    CircleRequest.status == 'pending'
                )
            ).order_by(CircleRequest.created_at.desc()).all()
            
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
                    "message": request.message,
                    "created_at": request.created_at.isoformat(),
                    "status": request.status
                }
                request_list.append(request_data)
            
            return {"requests": request_list}
            
        except Exception as e:
            raise BusinessLogicError(f"Failed to get pending requests: {str(e)}")

    def respond_to_request(self, current_user_id: int, request_id: int, action: str) -> Dict[str, str]:
        """Respond to a circle request (accept or decline)."""
        try:
            from models.review_circle import CircleRequest
            
            print(f"DEBUG: === RESPOND TO REQUEST ===")
            print(f"DEBUG: User {current_user_id} responding to request {request_id} with action '{action}'")
            
            # Validate action
            if action not in ['accept', 'decline']:
                raise ValidationError("Action must be 'accept' or 'decline'")
            
            # Get the request
            circle_request = self.db.query(CircleRequest).filter(
                and_(
                    CircleRequest.request_id == request_id,
                    CircleRequest.receiver_id == current_user_id,
                    CircleRequest.status == 'pending'
                )
            ).first()
            
            if not circle_request:
                print(f"DEBUG: Request {request_id} not found or already responded")
                print(f"DEBUG: Available requests for user {current_user_id}:")
                available_requests = self.db.query(CircleRequest).filter(
                    CircleRequest.receiver_id == current_user_id
                ).all()
                for req in available_requests:
                    print(f"DEBUG:   request_id: {req.request_id}, status: {req.status}, requester: {req.requester_id}")
                raise NotFoundError("Circle request not found or already responded")
            
            print(f"DEBUG: Found request - requester: {circle_request.requester_id}, receiver: {circle_request.receiver_id}")
            
            # Update request status
            circle_request.status = action
            circle_request.responded_at = datetime.utcnow()
            
            print(f"DEBUG: Updated request status to '{action}'")
            
            # If accepted, add users to each other's circles
            if action == 'accept':
                print(f"DEBUG: Adding users to each other's circles")
                # Find or create circles for both users and add them to each other's circles
                self._add_users_to_circles_after_acceptance(circle_request.requester_id, circle_request.receiver_id)
            
            self.db.commit()
            print(f"DEBUG: Request {action}ed successfully")
            
            return {"message": f"Request {action}ed successfully"}
            
        except Exception as e:
            print(f"DEBUG: Error in respond_to_request: {e}")
            self.db.rollback()
            if isinstance(e, (ValidationError, NotFoundError)):
                raise
            raise BusinessLogicError(f"Failed to respond to request: {str(e)}")

    def remove_user_from_circle(self, connection_id: int, current_user_id: int) -> Dict[str, str]:
        """Remove a user from circle."""
        try:
            print(f"DEBUG: === REMOVE USER FROM CIRCLE ===")
            print(f"DEBUG: Attempting to remove connection_id {connection_id} (type: {type(connection_id)}) by user {current_user_id}")
            
            # Get the connection
            connection = self.db.query(CircleConnection).filter(
                CircleConnection.connection_id == connection_id
            ).first()
            
            if not connection:
                print(f"DEBUG: Connection {connection_id} not found in database")
                print(f"DEBUG: Available connections:")
                all_connections = self.db.query(CircleConnection).all()
                for conn in all_connections:
                    print(f"DEBUG:   connection_id: {conn.connection_id}, user_id: {conn.user_id}, circle_id: {conn.circle_id}")
                raise NotFoundError("Connection not found")
            
            print(f"DEBUG: Found connection - user_id: {connection.user_id}, circle_id: {connection.circle_id}")
            
            # Check if current user has permission to remove (must be circle creator, mentor, or removing themselves)
            circle = self.db.query(ReviewCircle).filter(
                ReviewCircle.circle_id == connection.circle_id
            ).first()
            
            if not circle:
                print(f"DEBUG: Circle {connection.circle_id} not found")
                raise NotFoundError("Circle not found")
            
            print(f"DEBUG: Found circle - creator_id: {circle.creator_id}")
            
            # Get current user's connection to check their role
            current_user_connection = self.db.query(CircleConnection).filter(
                and_(
                    CircleConnection.circle_id == connection.circle_id,
                    CircleConnection.user_id == current_user_id
                )
            ).first()
            
            # Allow removal if:
            # 1. User is circle creator
            # 2. User is a mentor 
            # 3. User is removing themselves
            can_remove = (
                circle.creator_id == current_user_id or  # Circle creator
                (current_user_connection and current_user_connection.trust_level == TrustLevelEnum.REVIEW_MENTOR) or  # Mentor
                connection.user_id == current_user_id  # Removing themselves
            )
            
            if not can_remove:
                print(f"DEBUG: User {current_user_id} doesn't have permission to remove user {connection.user_id}")
                raise AuthorizationError("You don't have permission to remove this user")
            
            # Don't allow creator to remove themselves if they're the only admin
            if (connection.user_id == current_user_id and 
                circle.creator_id == current_user_id and
                connection.trust_level == TrustLevelEnum.REVIEW_MENTOR):
                
                # Check if there are other mentors
                other_mentors = self.db.query(CircleConnection).filter(
                    and_(
                        CircleConnection.circle_id == connection.circle_id,
                        CircleConnection.user_id != current_user_id,
                        CircleConnection.trust_level == TrustLevelEnum.REVIEW_MENTOR
                    )
                ).count()
                
                if other_mentors == 0:
                    raise ValidationError("Cannot remove yourself as the only circle mentor")
            
            print(f"DEBUG: Removing connection {connection_id}")
            # Remove the connection
            self.db.delete(connection)
            self.db.commit()
            print(f"DEBUG: Successfully removed connection {connection_id}")
            
            return {"message": "User removed from circle successfully"}
            
        except Exception as e:
            print(f"DEBUG: Error in remove_user_from_circle: {e}")
            self.db.rollback()
            if isinstance(e, (NotFoundError, AuthorizationError, ValidationError)):
                raise
            raise BusinessLogicError(f"Failed to remove user from circle: {str(e)}")

    def update_trust_level(self, connection_id: int, new_trust_level: TrustLevelEnum, current_user_id: int) -> Dict[str, str]:
        """Update trust level of a circle member."""
        try:
            # Get the connection
            connection = self.db.query(CircleConnection).filter(
                CircleConnection.connection_id == connection_id
            ).first()
            
            if not connection:
                raise NotFoundError("Connection not found")
            
            # Check if current user has permission (must be circle creator or higher trust level)
            user_connection = self.db.query(CircleConnection).filter(
                and_(
                    CircleConnection.circle_id == connection.circle_id,
                    CircleConnection.user_id == current_user_id
                )
            ).first()
            
            if not user_connection:
                raise AuthorizationError("You are not a member of this circle")
            
            # Only mentors can change trust levels
            if user_connection.trust_level != TrustLevelEnum.REVIEW_MENTOR:
                raise AuthorizationError("Only circle mentors can change trust levels")
            
            # Update trust level
            connection.trust_level = new_trust_level
            connection.updated_at = datetime.utcnow()
            
            self.db.commit()
            
            return {"message": f"Trust level updated to {new_trust_level.value}"}
            
        except Exception as e:
            self.db.rollback()
            if isinstance(e, (NotFoundError, AuthorizationError, ValidationError)):
                raise
            raise BusinessLogicError(f"Failed to update trust level: {str(e)}")

    def block_user(self, user_id: int, current_user_id: int, reason: str = None) -> Dict[str, str]:
        """Block a user (prevents them from sending requests or seeing your reviews)."""
        try:
            if user_id == current_user_id:
                raise ValidationError("Cannot block yourself")
            
            # Check if user exists
            user = self.db.query(User).filter(User.user_id == user_id).first()
            if not user:
                raise NotFoundError("User not found")
            
            # Create or update block record (using a simple approach)
            # In a full implementation, you'd have a dedicated BlockedUsers table
            # For now, we'll add this as a special circle request with 'blocked' status
            from models.review_circle import CircleRequest
            
            # Remove any existing requests between users
            self.db.query(CircleRequest).filter(
                or_(
                    and_(CircleRequest.requester_id == current_user_id, CircleRequest.receiver_id == user_id),
                    and_(CircleRequest.requester_id == user_id, CircleRequest.receiver_id == current_user_id)
                )
            ).delete()
            
            # Remove from circles
            user_circles = self.db.query(CircleConnection.circle_id).filter(
                CircleConnection.user_id == current_user_id
            ).subquery()
            
            self.db.query(CircleConnection).filter(
                and_(
                    CircleConnection.user_id == user_id,
                    CircleConnection.circle_id.in_(user_circles)
                )
            ).delete()
            
            # Create block record
            block_record = CircleRequest(
                requester_id=current_user_id,
                receiver_id=user_id,
                message=reason or "User blocked",
                status='blocked'
            )
            
            self.db.add(block_record)
            self.db.commit()
            
            return {"message": f"User {user.name} has been blocked"}
            
        except Exception as e:
            self.db.rollback()
            if isinstance(e, (NotFoundError, ValidationError)):
                raise
            raise BusinessLogicError(f"Failed to block user: {str(e)}")

    def unblock_user(self, user_id: int, current_user_id: int) -> Dict[str, str]:
        """Unblock a user."""
        try:
            from models.review_circle import CircleRequest
            
            # Remove block record
            block_record = self.db.query(CircleRequest).filter(
                and_(
                    CircleRequest.requester_id == current_user_id,
                    CircleRequest.receiver_id == user_id,
                    CircleRequest.status == 'blocked'
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
            from models.review_circle import CircleRequest
            
            blocked_requests = self.db.query(CircleRequest).filter(
                and_(
                    CircleRequest.requester_id == current_user_id,
                    CircleRequest.status == 'blocked'
                )
            ).all()
            
            blocked_users = []
            for request in blocked_requests:
                blocked_users.append({
                    "id": request.receiver.user_id,
                    "name": request.receiver.name,
                    "username": request.receiver.username,
                    "avatar": request.receiver.avatar,
                    "blocked_at": request.created_at.isoformat(),
                    "reason": request.message
                })
            
            return {"blocked_users": blocked_users}
            
        except Exception as e:
            raise BusinessLogicError(f"Failed to get blocked users: {str(e)}")

    def _add_users_to_circles_after_acceptance(self, requester_id: int, receiver_id: int):
        """Add users to each other's circles after request acceptance."""
        import random
        
        # Get or create default circles for both users
        requester_circle = self._get_or_create_default_circle(requester_id)
        receiver_circle = self._get_or_create_default_circle(receiver_id)
        
        # Add receiver to requester's circle
        self._add_user_to_circle_if_not_exists(receiver_id, requester_circle.circle_id)
        
        # Add requester to receiver's circle  
        self._add_user_to_circle_if_not_exists(requester_id, receiver_circle.circle_id)

    def _get_or_create_default_circle(self, user_id: int) -> ReviewCircle:
        """Get user's default circle or create one if it doesn't exist."""
        # Check if user already has a circle (as creator)
        existing_circle = self.db.query(ReviewCircle).filter(
            ReviewCircle.creator_id == user_id
        ).first()
        
        if existing_circle:
            return existing_circle
        
        # Check if user is a member of any circle
        user_connection = self.db.query(CircleConnection).filter(
            CircleConnection.user_id == user_id
        ).first()
        
        if user_connection:
            return user_connection.circle
        
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
        
        # Add user to their own circle as a member
        user_connection = CircleConnection(
            user_id=user_id,
            circle_id=default_circle.circle_id,
            trust_level=TrustLevelEnum.REVIEW_MENTOR,
            taste_match_score=100.0,
            connected_since=datetime.utcnow(),
            interaction_count=1
        )
        
        self.db.add(user_connection)
        self.db.flush()
        
        return default_circle

    def _add_user_to_circle_if_not_exists(self, user_id: int, circle_id: int):
        """Add user to circle if they're not already a member."""
        # Check if user is already a member
        existing_connection = self.db.query(CircleConnection).filter(
            and_(
                CircleConnection.user_id == user_id,
                CircleConnection.circle_id == circle_id
            )
        ).first()
        
        if existing_connection:
            return  # User is already a member
        
        # Calculate taste match score (mock implementation)
        taste_match_score = random.uniform(70.0, 95.0)
        
        # Add user to circle
        connection = CircleConnection(
            user_id=user_id,
            circle_id=circle_id,
            trust_level=TrustLevelEnum.REVIEWER,
            taste_match_score=taste_match_score,
            connected_since=datetime.utcnow(),
            interaction_count=0
        )
        
        self.db.add(connection)
        self.db.flush()

    def get_my_circle_members(self, current_user_id: int, params: CircleMemberListParams) -> Dict[str, Any]:
        """Get members of the current user's circle(s)."""
        try:
            # Get all circles where the current user is a member
            user_circles = self.db.query(CircleConnection.circle_id).filter(
                CircleConnection.user_id == current_user_id
            ).subquery()
            
            # Get all connections in those circles (excluding the current user)
            query = self.db.query(CircleConnection).filter(
                and_(
                    CircleConnection.circle_id.in_(user_circles),
                    CircleConnection.user_id != current_user_id  # Exclude current user
                )
            )
            
            if params.trust_level:
                query = query.filter(CircleConnection.trust_level == params.trust_level)
            
            total_count = query.count()
            
            offset = (params.page - 1) * params.size
            connections = query.offset(offset).limit(params.size).all()
            
            print(f"DEBUG: get_my_circle_members found {len(connections)} connections for user {current_user_id}")
            
            members = []
            for connection in connections:
                print(f"DEBUG: Processing connection_id={connection.connection_id}, user_id={connection.user_id}, circle_id={connection.circle_id}")
                user = self.db.query(User).filter(User.user_id == connection.user_id).first()
                if user:
                    members.append(CircleMemberResponse(
                        connection_id=connection.connection_id,
                        user=CircleUserResponse(
                            user_id=user.user_id,
                            name=user.name,
                            username=user.username,
                            avatar=user.avatar
                        ),
                        trust_level=connection.trust_level,
                        taste_match_score=connection.taste_match_score,
                        connected_since=connection.connected_since,
                        last_interaction=connection.last_interaction,
                        interaction_count=connection.interaction_count
                    ))
            
            return {
                "members": members,
                "total_count": total_count
            }
            
        except Exception as e:
            raise BusinessLogicError(f"Failed to get circle members: {str(e)}")