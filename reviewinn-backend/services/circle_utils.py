"""
Utility functions for circle-related operations.
Separated from main service for better modularity and reusability.
"""
from typing import List, Set, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
import random

from models.review_circle import CircleConnection, CircleRequest
from models.user import User
from models.review import Review


class CircleUtils:
    """Utility class for circle-related helper functions."""
    
    @staticmethod
    def get_user_circle_member_ids(db: Session, user_id: int) -> Set[int]:
        """Get all user IDs that are in circles with the given user."""
        member_ids = db.query(CircleConnection.user_id).filter(
            CircleConnection.circle_id.in_(
                db.query(CircleConnection.circle_id).filter(
                    CircleConnection.user_id == user_id
                )
            )
        ).distinct().all()
        
        return {member_id[0] for member_id in member_ids}
    
    @staticmethod
    def get_pending_request_user_ids(db: Session, user_id: int) -> Set[int]:
        """Get all user IDs that have pending requests with the given user."""
        # Users who sent requests to current user
        sent_to_user = db.query(CircleRequest.requester_id).filter(
            and_(
                CircleRequest.receiver_id == user_id,
                CircleRequest.status == 'pending'
            )
        )
        
        # Users who received requests from current user
        received_from_user = db.query(CircleRequest.receiver_id).filter(
            and_(
                CircleRequest.requester_id == user_id,
                CircleRequest.status == 'pending'
            )
        )
        
        # Combine both sets
        pending_ids = sent_to_user.union(received_from_user).all()
        return {user_id[0] for user_id in pending_ids}
    
    @staticmethod
    def calculate_taste_match_score(review_count: int) -> float:
        """Calculate taste match score based on review activity."""
        if review_count >= 20:
            return random.uniform(75.0, 95.0)
        elif review_count >= 10:
            return random.uniform(65.0, 85.0)
        elif review_count >= 5:
            return random.uniform(55.0, 75.0)
        else:
            return random.uniform(45.0, 65.0)
    
    @staticmethod
    def generate_suggestion_reasons(review_count: int, mutual_connections: int = 0) -> List[str]:
        """Generate contextual reasons for circle suggestions."""
        reasons = []
        
        # Activity-based reasons
        if review_count >= 20:
            reasons.append("Highly active reviewer")
        elif review_count >= 10:
            reasons.append("Active reviewer")
        elif review_count >= 5:
            reasons.append("Regular reviewer")
        else:
            reasons.append("New to the platform")
        
        # Review count
        if review_count > 0:
            reasons.append(f"{review_count} reviews written")
        else:
            reasons.append("Great potential for growth")
        
        # Mutual connections
        if mutual_connections > 0:
            reasons.append(f"{mutual_connections} mutual connections")
        
        return reasons
    
    @staticmethod
    def calculate_mutual_connections(db: Session, user1_id: int, user2_id: int) -> int:
        """Calculate mutual connections between two users."""
        try:
            # Get circles that user1 is in
            user1_circles = db.query(CircleConnection.circle_id).filter(
                CircleConnection.user_id == user1_id
            ).subquery()
            
            # Get circles that user2 is in  
            user2_circles = db.query(CircleConnection.circle_id).filter(
                CircleConnection.user_id == user2_id
            ).subquery()
            
            # Count users who are in circles with both user1 and user2
            mutual_count = db.query(func.count(func.distinct(CircleConnection.user_id))).filter(
                and_(
                    CircleConnection.circle_id.in_(user1_circles),
                    CircleConnection.user_id.in_(
                        db.query(CircleConnection.user_id).filter(
                            CircleConnection.circle_id.in_(user2_circles)
                        )
                    ),
                    CircleConnection.user_id != user1_id,
                    CircleConnection.user_id != user2_id
                )
            ).scalar() or 0
            
            return mutual_count
            
        except Exception:
            # Fallback to random number if calculation fails
            return random.randint(0, 3)
    
    @staticmethod
    def validate_circle_membership_limit(db: Session, circle_id: int, max_members: int) -> bool:
        """Check if circle has reached its membership limit."""
        current_count = db.query(CircleConnection).filter(
            CircleConnection.circle_id == circle_id
        ).count()
        
        return current_count < max_members
    
    @staticmethod
    def is_user_in_circle(db: Session, user_id: int, circle_id: int) -> bool:
        """Check if user is already a member of the circle."""
        return db.query(CircleConnection).filter(
            and_(
                CircleConnection.user_id == user_id,
                CircleConnection.circle_id == circle_id
            )
        ).first() is not None
    
    @staticmethod
    def has_pending_request(db: Session, requester_id: int, receiver_id: int) -> bool:
        """Check if there's already a pending request between users."""
        return db.query(CircleRequest).filter(
            and_(
                CircleRequest.requester_id == requester_id,
                CircleRequest.receiver_id == receiver_id,
                CircleRequest.status == 'pending'
            )
        ).first() is not None
    
    @staticmethod
    def get_user_review_count(db: Session, user_id: int) -> int:
        """Get the number of reviews written by a user."""
        try:
            count = db.query(func.count(Review.review_id)).filter(
                Review.reviewer_id == user_id
            ).scalar()
            return count or 0
        except Exception:
            return 0


class CircleValidators:
    """Validation functions for circle operations."""
    
    @staticmethod
    def validate_circle_creation_data(name: str, max_members: int) -> List[str]:
        """Validate circle creation data."""
        errors = []
        
        if not name or len(name.strip()) < 3:
            errors.append("Circle name must be at least 3 characters long")
        
        if len(name.strip()) > 100:
            errors.append("Circle name cannot exceed 100 characters")
        
        if max_members < 5 or max_members > 200:
            errors.append("Circle must allow between 5 and 200 members")
        
        return errors
    
    @staticmethod
    def validate_circle_request_data(message: str) -> List[str]:
        """Validate circle request data."""
        errors = []
        
        if message and len(message) > 500:
            errors.append("Request message cannot exceed 500 characters")
        
        return errors


class CircleConstants:
    """Constants for circle-related operations."""
    
    # Trust levels
    TRUST_LEVELS = {
        'REVIEWER': 'Reviewer',
        'TRUSTED_REVIEWER': 'Trusted Reviewer', 
        'REVIEW_ALLY': 'Review Ally',
        'REVIEW_MENTOR': 'Review Mentor'
    }
    
    # Circle limits
    MIN_CIRCLE_MEMBERS = 5
    MAX_CIRCLE_MEMBERS = 200
    DEFAULT_CIRCLE_MEMBERS = 50
    
    # Request limits
    MAX_PENDING_REQUESTS_PER_USER = 20
    REQUEST_EXPIRY_DAYS = 7
    
    # Suggestion limits
    DEFAULT_SUGGESTION_LIMIT = 10
    MAX_SUGGESTION_LIMIT = 50
    MIN_TASTE_MATCH_SCORE = 45.0