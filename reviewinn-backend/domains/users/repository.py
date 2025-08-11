"""
User domain repository.
Handles data access operations for user entities.
"""

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc, asc
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import logging

from shared.interfaces.repositories import IUserRepository
from core.exceptions import UserNotFoundError, DuplicateUserError
from .models import User, UserProfile, UserSession, UserFollow, UserActivity

logger = logging.getLogger(__name__)


class UserRepository(IUserRepository):
    """Repository for user data access operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def create(self, obj_data: Dict[str, Any]) -> User:
        """Create a new user."""
        try:
            # Check for duplicate email
            existing_user = self.db.query(User).filter(
                or_(User.email == obj_data['email'], User.username == obj_data['username'])
            ).first()
            
            if existing_user:
                if existing_user.email == obj_data['email']:
                    raise DuplicateUserError('email', obj_data['email'])
                else:
                    raise DuplicateUserError('username', obj_data['username'])
            
            # Create new user
            user = User(**obj_data)
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
            
            # Create default profile
            profile = UserProfile(user_id=user.id)
            self.db.add(profile)
            self.db.commit()
            
            logger.info(f"Created user: {user.username} (ID: {user.id})")
            return user
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating user: {e}")
            raise
    
    async def get_by_id(self, entity_id: int) -> Optional[User]:
        """Get user by ID."""
        user = self.db.query(User).options(
            joinedload(User.profile)
        ).filter(User.id == entity_id).first()
        
        if not user:
            return None
        
        return user
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email address."""
        return self.db.query(User).options(
            joinedload(User.profile)
        ).filter(User.email == email).first()
    
    async def get_by_username(self, username: str) -> Optional[User]:
        """Get user by username."""
        return self.db.query(User).options(
            joinedload(User.profile)
        ).filter(User.username == username).first()
    
    async def get_all(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all users with pagination."""
        return self.db.query(User).options(
            joinedload(User.profile)
        ).offset(skip).limit(limit).all()
    
    async def update(self, entity_id: int, update_data: Dict[str, Any]) -> Optional[User]:
        """Update a user."""
        try:
            user = await self.get_by_id(entity_id)
            if not user:
                raise UserNotFoundError(str(entity_id))
            
            for key, value in update_data.items():
                if hasattr(user, key):
                    setattr(user, key, value)
            
            user.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(user)
            
            logger.info(f"Updated user: {user.username} (ID: {user.id})")
            return user
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating user {entity_id}: {e}")
            raise
    
    async def delete(self, entity_id: int) -> bool:
        """Delete a user (soft delete by changing status)."""
        try:
            user = await self.get_by_id(entity_id)
            if not user:
                return False
            
            # Soft delete by changing status
            user.status = "inactive"
            user.updated_at = datetime.utcnow()
            self.db.commit()
            
            logger.info(f"Soft deleted user: {user.username} (ID: {user.id})")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting user {entity_id}: {e}")
            return False
    
    async def exists(self, entity_id: int) -> bool:
        """Check if user exists."""
        return self.db.query(User).filter(User.id == entity_id).first() is not None
    
    async def search_users(
        self, 
        query: Optional[str] = None,
        role: Optional[str] = None,
        status: Optional[str] = None,
        verified_only: bool = False,
        skip: int = 0,
        limit: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> Dict[str, Any]:
        """Search users with filters."""
        
        db_query = self.db.query(User).options(joinedload(User.profile))
        
        # Apply filters
        if query:
            search_filter = or_(
                User.username.ilike(f"%{query}%"),
                User.display_name.ilike(f"%{query}%"),
                User.email.ilike(f"%{query}%")
            )
            db_query = db_query.filter(search_filter)
        
        if role:
            db_query = db_query.filter(User.role == role)
        
        if status:
            db_query = db_query.filter(User.status == status)
        
        if verified_only:
            db_query = db_query.filter(User.is_email_verified == True)
        
        # PERFORMANCE FIX: Avoid expensive count() for user queries
        # Apply sorting first
        sort_column = getattr(User, sort_by, User.created_at)
        if sort_order == "desc":
            db_query = db_query.order_by(desc(sort_column))
        else:
            db_query = db_query.order_by(asc(sort_column))
        
        # Get limit+1 to check if there are more records
        users_with_extra = db_query.offset(skip).limit(limit + 1).all()
        
        # Check if there are more and calculate efficient total
        has_more = len(users_with_extra) > limit
        users = users_with_extra[:limit]
        
        # Efficient total calculation
        page_num = (skip // limit) + 1
        if page_num == 1 and not has_more:
            total = len(users)
        else:
            total = skip + len(users) + (1 if has_more else 0)
        
        return {
            "items": users,
            "total": total,
            "page": page_num,
            "size": limit,
            "total_pages": (total + limit - 1) // limit if total > 0 else 1,
            "has_next": has_more,  # Use efficient has_more flag
            "has_prev": skip > 0
        }
    
    async def update_profile(self, user_id: int, profile_data: Dict[str, Any]) -> Optional[UserProfile]:
        """Update user profile."""
        try:
            profile = self.db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
            if not profile:
                profile = UserProfile(user_id=user_id)
                self.db.add(profile)
            
            for key, value in profile_data.items():
                if hasattr(profile, key):
                    setattr(profile, key, value)
            
            profile.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(profile)
            
            return profile
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating profile for user {user_id}: {e}")
            raise
    
    async def create_session(self, session_data: Dict[str, Any]) -> UserSession:
        """Create a new user session."""
        try:
            session = UserSession(**session_data)
            self.db.add(session)
            self.db.commit()
            self.db.refresh(session)
            
            return session
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating session: {e}")
            raise
    
    async def get_session_by_token(self, token: str) -> Optional[UserSession]:
        """Get session by token."""
        return self.db.query(UserSession).filter(
            and_(
                UserSession.session_token == token,
                UserSession.is_active == True,
                UserSession.expires_at > datetime.utcnow()
            )
        ).first()
    
    async def invalidate_session(self, token: str) -> bool:
        """Invalidate a user session."""
        try:
            session = await self.get_session_by_token(token)
            if session:
                session.is_active = False
                self.db.commit()
                return True
            return False
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error invalidating session: {e}")
            return False
    
    async def cleanup_expired_sessions(self) -> int:
        """Clean up expired sessions."""
        try:
            expired_count = self.db.query(UserSession).filter(
                UserSession.expires_at < datetime.utcnow()
            ).update({"is_active": False})
            
            self.db.commit()
            logger.info(f"Cleaned up {expired_count} expired sessions")
            return expired_count
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error cleaning up sessions: {e}")
            return 0
    
    async def follow_user(self, follower_id: int, following_id: int) -> bool:
        """Create a follow relationship."""
        try:
            # Check if already following
            existing = self.db.query(UserFollow).filter(
                and_(
                    UserFollow.follower_id == follower_id,
                    UserFollow.following_id == following_id
                )
            ).first()
            
            if existing:
                return False
            
            # Create follow relationship
            follow = UserFollow(follower_id=follower_id, following_id=following_id)
            self.db.add(follow)
            
            # Update follower counts
            follower_profile = self.db.query(UserProfile).filter(UserProfile.user_id == follower_id).first()
            following_profile = self.db.query(UserProfile).filter(UserProfile.user_id == following_id).first()
            
            if follower_profile:
                follower_profile.following_count += 1
            if following_profile:
                following_profile.follower_count += 1
            
            self.db.commit()
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating follow relationship: {e}")
            return False
    
    async def unfollow_user(self, follower_id: int, following_id: int) -> bool:
        """Remove a follow relationship."""
        try:
            follow = self.db.query(UserFollow).filter(
                and_(
                    UserFollow.follower_id == follower_id,
                    UserFollow.following_id == following_id
                )
            ).first()
            
            if not follow:
                return False
            
            self.db.delete(follow)
            
            # Update follower counts
            follower_profile = self.db.query(UserProfile).filter(UserProfile.user_id == follower_id).first()
            following_profile = self.db.query(UserProfile).filter(UserProfile.user_id == following_id).first()
            
            if follower_profile:
                follower_profile.following_count = max(0, follower_profile.following_count - 1)
            if following_profile:
                following_profile.follower_count = max(0, following_profile.follower_count - 1)
            
            self.db.commit()
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error removing follow relationship: {e}")
            return False
    
    async def get_followers(self, user_id: int, skip: int = 0, limit: int = 20) -> List[User]:
        """Get user's followers."""
        return self.db.query(User).join(
            UserFollow, UserFollow.follower_id == User.id
        ).filter(UserFollow.following_id == user_id).offset(skip).limit(limit).all()
    
    async def get_following(self, user_id: int, skip: int = 0, limit: int = 20) -> List[User]:
        """Get users that this user is following."""
        return self.db.query(User).join(
            UserFollow, UserFollow.following_id == User.id
        ).filter(UserFollow.follower_id == user_id).offset(skip).limit(limit).all()
    
    async def record_activity(self, activity_data: Dict[str, Any]) -> UserActivity:
        """Record user activity."""
        try:
            activity = UserActivity(**activity_data)
            self.db.add(activity)
            self.db.commit()
            self.db.refresh(activity)
            
            return activity
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error recording activity: {e}")
            raise
    
    async def get_user_activities(
        self, 
        user_id: int, 
        skip: int = 0, 
        limit: int = 20
    ) -> List[UserActivity]:
        """Get user activities."""
        return self.db.query(UserActivity).filter(
            UserActivity.user_id == user_id
        ).order_by(desc(UserActivity.created_at)).offset(skip).limit(limit).all()