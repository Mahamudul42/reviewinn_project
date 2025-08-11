"""
User repository implementing specific user data access patterns.
Extends base repository with user-specific operations.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc
from .base import BaseRepository
from models.user import User
from models.user_profile import UserProfile
import logging

logger = logging.getLogger(__name__)


class UserRepository(BaseRepository[User, dict, dict]):
    """
    Repository for User entity with specific business logic operations.
    """
    
    def __init__(self, db: Session):
        super().__init__(User)
        self.db = db
    
    def get_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID with profile relationship loaded."""
        try:
            return self.db.query(User).options(joinedload(User.profile)).filter(User.user_id == user_id).first()
        except Exception as e:
            logger.error(f"Error getting user by id {user_id}: {e}")
            return None
    
    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email address."""
        try:
            return self.db.query(User).filter(User.email == email).first()
        except Exception as e:
            logger.error(f"Error getting user by email {email}: {e}")
            return None
    
    def get_by_username(self, username: str) -> Optional[User]:
        """Get user by username."""
        try:
            return self.db.query(User).filter(User.username == username).first()
        except Exception as e:
            logger.error(f"Error getting user by username {username}: {e}")
            return None
    
    def find_by_email(self, email: str) -> Optional[User]:
        """Find user by email."""
        return self.get_by_email(email)
    
    def find_by_username(self, username: str) -> Optional[User]:
        """Find user by username."""
        return self.get_by_username(username)
    
    def get_user_progress(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get user progress/gamification data."""
        try:
            from models.user_progress import UserProgress
            progress = self.db.query(UserProgress).filter(UserProgress.user_id == user_id).first()
            if progress:
                return {
                    'level': progress.level,
                    'points': progress.points,
                    'daily_streak': progress.daily_streak,
                    'published_reviews': progress.published_reviews,
                    'total_helpful_votes': progress.total_helpful_votes,
                    'average_rating_given': progress.average_rating_given,
                    'entities_reviewed': progress.entities_reviewed
                }
            return None
        except Exception as e:
            logger.error(f"Error getting user progress for user {user_id}: {e}")
            return None
    
    def get_user_stats(self, user_id: int) -> Dict[str, Any]:
        """Get user statistics."""
        try:
            from models.review import Review
            from models.user_progress import UserProgress
            
            # Get review count
            review_count = self.db.query(func.count(Review.review_id)).filter(Review.user_id == user_id).scalar() or 0
            
            # Get average rating given
            avg_rating = self.db.query(func.avg(Review.overall_rating)).filter(Review.user_id == user_id).scalar() or 0.0
            
            # Get progress data
            progress = self.db.query(UserProgress).filter(UserProgress.user_id == user_id).first()
            
            return {
                'reviews_count': review_count,
                'average_rating_given': float(avg_rating),
                'helpful_votes': progress.total_helpful_votes if progress else 0,
                'entities_reviewed': progress.entities_reviewed if progress else 0,
                'daily_streak': progress.daily_streak if progress else 0
            }
        except Exception as e:
            logger.error(f"Error getting user stats for user {user_id}: {e}")
            return {}
    
    def get_user_badges(self, user_id: int) -> List[Dict[str, Any]]:
        """Get user badges."""
        try:
            from models.badge import Badge
            from models.user import user_badges_table
            
            badges = self.db.query(Badge).join(user_badges_table).filter(
                user_badges_table.c.user_id == user_id
            ).all()
            
            return [{'id': badge.badge_id, 'name': badge.name, 'description': badge.description, 'icon': badge.icon} for badge in badges]
        except Exception as e:
            logger.error(f"Error getting user badges for user {user_id}: {e}")
            return []
    
    def get_user_connections_count(self, user_id: int) -> Dict[str, int]:
        """Get user connections count (followers/following)."""
        try:
            from models.user_connection import UserConnection, ConnectionStatusEnum
            
            # Count followers
            followers_count = self.db.query(func.count(UserConnection.user_id)).filter(
                UserConnection.target_user_id == user_id,
                UserConnection.status == ConnectionStatusEnum.ACCEPTED
            ).scalar() or 0
            
            # Count following
            following_count = self.db.query(func.count(UserConnection.target_user_id)).filter(
                UserConnection.user_id == user_id,
                UserConnection.status == ConnectionStatusEnum.ACCEPTED
            ).scalar() or 0
            
            return {
                'followers': followers_count,
                'following': following_count
            }
        except Exception as e:
            logger.error(f"Error getting user connections count for user {user_id}: {e}")
            return {'followers': 0, 'following': 0}
    
    def get_user_profile(self, user_id: int) -> Optional[UserProfile]:
        """Get user profile."""
        try:
            return self.db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        except Exception as e:
            logger.error(f"Error getting user profile for user {user_id}: {e}")
            return None
    
    def create_user_progress(self, progress) -> None:
        """Create user progress record."""
        try:
            self.db.add(progress)
            self.db.commit()
        except Exception as e:
            logger.error(f"Error creating user progress: {e}")
            self.db.rollback()
            raise
    
    def create_connection(self, user_id: int, target_user_id: int, connection_type: str) -> bool:
        """Create user connection."""
        try:
            from models.user_connection import UserConnection, ConnectionTypeEnum, ConnectionStatusEnum
            
            # Check if connection already exists
            existing = self.db.query(UserConnection).filter(
                UserConnection.user_id == user_id,
                UserConnection.target_user_id == target_user_id,
                UserConnection.connection_type == ConnectionTypeEnum(connection_type)
            ).first()
            
            if existing:
                return False
            
            connection = UserConnection(
                user_id=user_id,
                target_user_id=target_user_id,
                connection_type=ConnectionTypeEnum(connection_type),
                status=ConnectionStatusEnum.ACCEPTED
            )
            self.db.add(connection)
            self.db.commit()
            return True
        except Exception as e:
            logger.error(f"Error creating connection: {e}")
            self.db.rollback()
            return False
    
    def remove_connection(self, user_id: int, target_user_id: int, connection_type: str) -> bool:
        """Remove user connection."""
        try:
            from models.user_connection import UserConnection, ConnectionTypeEnum
            
            connection = self.db.query(UserConnection).filter(
                UserConnection.user_id == user_id,
                UserConnection.target_user_id == target_user_id,
                UserConnection.connection_type == ConnectionTypeEnum(connection_type)
            ).first()
            
            if connection:
                self.db.delete(connection)
                self.db.commit()
                return True
            return False
        except Exception as e:
            logger.error(f"Error removing connection: {e}")
            self.db.rollback()
            return False
    
    def get_paginated(self, page: int = 1, per_page: int = 20, filters: Optional[Dict[str, Any]] = None):
        """Get paginated users with filters."""
        try:
            query = self.db.query(User)
            
            # Apply filters if provided
            if filters:
                filter_conditions = []
                for field, value in filters.items():
                    if hasattr(User, field) and value is not None:
                        column = getattr(User, field)
                        if isinstance(value, list):
                            filter_conditions.append(column.in_(value))
                        else:
                            filter_conditions.append(column == value)
                
                if filter_conditions:
                    query = query.filter(and_(*filter_conditions))
            
            # Get total count
            total = query.count()
            
            # Apply pagination
            offset = (page - 1) * per_page
            items = query.offset(offset).limit(per_page).all()
            
            # Return pagination result
            from collections import namedtuple
            PaginationResult = namedtuple('PaginationResult', ['items', 'total', 'page', 'per_page'])
            return PaginationResult(items=items, total=total, page=page, per_page=per_page)
            
        except Exception as e:
            logger.error(f"Error getting paginated users: {e}")
            raise
