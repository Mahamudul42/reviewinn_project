"""
Enterprise-grade CoreUser service for the new unified user system.
This service handles all user and profile operations using the core_users table.
"""
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy import and_, or_, func
import logging

from models.user import User as CoreUser
from schemas.user import UserCreateRequest, UserUpdateRequest, UserProfileResponse
from core.exceptions.base import ValidationError, ReviewPlatformException
from core.exceptions.domain_exceptions import UserNotFoundError, DuplicateUserError
from auth.production_auth_system import get_auth_system

logger = logging.getLogger(__name__)


class CoreUserService:
    """Enterprise-grade service for core user operations."""
    
    def __init__(self, db: Session):
        """Initialize service with database session."""
        self.db = db
        self.auth_system = get_auth_system()  # Use production auth system

    def get_user_by_id(self, user_id: int) -> Optional[CoreUser]:
        """Get user by ID with error handling."""
        try:
            return self.db.query(CoreUser).filter(
                and_(
                    CoreUser.user_id == user_id,
                    CoreUser.is_active == True
                )
            ).first()
        except SQLAlchemyError as e:
            logger.error(f"Database error retrieving user {user_id}: {str(e)}")
            raise ValidationError(f"Error retrieving user: {str(e)}")

    def get_user_by_username(self, username: str) -> Optional[CoreUser]:
        """Get user by username."""
        try:
            return self.db.query(CoreUser).filter(
                and_(
                    CoreUser.username == username,
                    CoreUser.is_active == True
                )
            ).first()
        except SQLAlchemyError as e:
            logger.error(f"Database error retrieving user by username {username}: {str(e)}")
            raise ValidationError(f"Error retrieving user: {str(e)}")

    def get_user_by_email(self, email: str) -> Optional[CoreUser]:
        """Get user by email."""
        try:
            return self.db.query(CoreUser).filter(
                and_(
                    CoreUser.email == email,
                    CoreUser.is_active == True
                )
            ).first()
        except SQLAlchemyError as e:
            logger.error(f"Database error retrieving user by email {email}: {str(e)}")
            raise ValidationError(f"Error retrieving user: {str(e)}")

    def get_user_profile_by_identifier(self, identifier: str) -> UserProfileResponse:
        """
        Get complete user profile by username or user_id.
        Returns enterprise-grade profile response with comprehensive data.
        """
        user = None
        
        # Try to determine if identifier is numeric (user_id) or string (username)
        if identifier.isdigit():
            user = self.get_user_by_id(int(identifier))
        else:
            user = self.get_user_by_username(identifier)
        
        if not user:
            raise UserNotFoundError(user_id=identifier if identifier.isdigit() else None, username=identifier if not identifier.isdigit() else None)
        
        return self._build_user_profile_response(user)

    def update_user_profile(self, user_id: int, profile_data: Dict[str, Any]) -> UserProfileResponse:
        """
        Update user profile with enterprise-grade validation and error handling.
        All profile fields are now in the core_users table.
        """
        try:
            user = self.get_user_by_id(user_id)
            if not user:
                raise UserNotFoundError(user_id=str(user_id))

            # Validate and sanitize input data
            validated_data = self._validate_profile_data(profile_data)
            
            # Update user fields
            for field, value in validated_data.items():
                if hasattr(user, field):
                    setattr(user, field, value)
                else:
                    logger.warning(f"Attempted to update non-existent field: {field}")

            # Update timestamps
            user.updated_at = func.now()
            
            # Commit changes
            self.db.commit()
            self.db.refresh(user)
            
            logger.info(f"Successfully updated profile for user {user_id}")
            return self._build_user_profile_response(user)
            
        except IntegrityError as e:
            self.db.rollback()
            logger.error(f"Integrity constraint violation updating user {user_id}: {str(e)}")
            if "username" in str(e):
                raise DuplicateUserError("username", "unknown")
            elif "email" in str(e):
                raise DuplicateUserError("email", "unknown")
            else:
                raise ValidationError(f"Data integrity error: {str(e)}")
                
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Database error updating user {user_id}: {str(e)}")
            raise ValidationError(f"Failed to update profile: {str(e)}")

    def create_user(self, user_data: UserCreateRequest) -> UserProfileResponse:
        """Create new user with enterprise-grade validation."""
        try:
            # Check for existing users
            if self.get_user_by_email(user_data.email):
                raise DuplicateUserError("email", user_data.email)
            
            if user_data.username and self.get_user_by_username(user_data.username):
                raise DuplicateUserError("username", user_data.username)

            # Create new user with production auth system
            user = CoreUser(
                username=user_data.username,
                email=user_data.email,
                hashed_password=self.auth_system._hash_password(user_data.password),  # Use production password hashing
                first_name=getattr(user_data, 'first_name', None),
                last_name=getattr(user_data, 'last_name', None),
                display_name=getattr(user_data, 'display_name', user_data.username),
                is_active=True,
                is_verified=False,
                level=1,
                points=0
            )
            
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
            
            logger.info(f"Successfully created user {user.user_id} with username {user.username}")
            return self._build_user_profile_response(user)
            
        except IntegrityError as e:
            self.db.rollback()
            logger.error(f"Integrity error creating user: {str(e)}")
            if "username" in str(e):
                raise DuplicateUserError("username", "unknown")
            elif "email" in str(e):
                raise DuplicateUserError("email", "unknown")
            else:
                raise ValidationError(f"Data integrity error: {str(e)}")
                
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Database error creating user: {str(e)}")
            raise ValidationError(f"Failed to create user: {str(e)}")

    def search_users(self, query: str, limit: int = 20, offset: int = 0) -> List[UserProfileResponse]:
        """Search users with enterprise-grade filtering."""
        try:
            search_filter = or_(
                CoreUser.username.ilike(f"%{query}%"),
                CoreUser.display_name.ilike(f"%{query}%"),
                CoreUser.first_name.ilike(f"%{query}%"),
                CoreUser.last_name.ilike(f"%{query}%")
            )
            
            users = self.db.query(CoreUser).filter(
                and_(
                    search_filter,
                    CoreUser.is_active == True
                )
            ).limit(limit).offset(offset).all()
            
            return [self._build_user_profile_response(user) for user in users]
            
        except SQLAlchemyError as e:
            logger.error(f"Database error searching users with query '{query}': {str(e)}")
            raise ValidationError(f"Search failed: {str(e)}")

    def get_user_stats(self, user_id: int) -> Dict[str, Any]:
        """Get comprehensive user statistics."""
        try:
            user = self.get_user_by_id(user_id)
            if not user:
                raise UserNotFoundError(user_id=str(user_id))
            
            # Get additional stats from denormalized fields
            stats = {
                "user_id": user.user_id,
                "review_count": user.review_count,
                "follower_count": user.follower_count,
                "following_count": user.following_count,
                "friend_count": user.friend_count,
                "level": user.level,
                "points": user.points,
                "is_verified": user.is_verified,
                "is_premium": user.is_premium,
                "member_since": user.created_at.isoformat() if user.created_at else None,
                "last_active": user.last_active_at.isoformat() if user.last_active_at else None
            }
            
            return stats
            
        except SQLAlchemyError as e:
            logger.error(f"Database error getting stats for user {user_id}: {str(e)}")
            raise ValidationError(f"Failed to get user stats: {str(e)}")

    def _validate_profile_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and sanitize profile data with enterprise-grade checks."""
        validated = {}
        
        # Allowed fields that can be updated
        allowed_fields = {
            'first_name', 'last_name', 'display_name', 'bio', 'avatar',
            'country', 'city', 'profile_data', 'preferences'
        }
        
        for field, value in data.items():
            if field not in allowed_fields:
                logger.warning(f"Attempted to update restricted field: {field}")
                continue
                
            # Basic validation
            if field in ['first_name', 'last_name', 'display_name'] and value:
                if len(str(value).strip()) > 100:
                    raise ValidationError(f"{field} must be less than 100 characters")
                validated[field] = str(value).strip()
                
            elif field == 'bio' and value:
                if len(str(value).strip()) > 1000:
                    raise ValidationError("Bio must be less than 1000 characters")
                validated[field] = str(value).strip()
                
            elif field == 'avatar' and value:
                if len(str(value)) > 500:
                    raise ValidationError("Avatar URL must be less than 500 characters")
                validated[field] = str(value)
                
            elif field in ['country', 'city'] and value:
                if len(str(value).strip()) > 100:
                    raise ValidationError(f"{field} must be less than 100 characters")
                validated[field] = str(value).strip()
                
            elif field in ['profile_data', 'preferences'] and isinstance(value, dict):
                validated[field] = value
            
            elif value is not None:
                validated[field] = value
        
        return validated

    def _build_user_profile_response(self, user: CoreUser) -> UserProfileResponse:
        """Build comprehensive user profile response with enterprise-grade data structure."""
        return UserProfileResponse(
            # Basic identifiers - multiple formats for compatibility
            user_id=user.user_id,
            id=str(user.user_id),
            
            # Authentication info
            email=user.email,
            username=user.username,
            
            # Display information
            name=user.display_name or f"{user.first_name or ''} {user.last_name or ''}".strip() or user.username,
            display_name=user.display_name,
            first_name=user.first_name,
            last_name=user.last_name,
            full_name=f"{user.first_name or ''} {user.last_name or ''}".strip() or user.display_name or user.username,
            
            # Profile info
            avatar=user.avatar,
            bio=user.bio,
            
            # Location
            location=f"{user.city or ''}, {user.country or ''}".strip(', ') if user.city or user.country else None,
            country=user.country,
            city=user.city,
            
            # Status flags
            is_verified=user.is_verified,
            isVerified=user.is_verified,  # camelCase for frontend compatibility
            is_active=user.is_active,
            is_premium=user.is_premium,
            
            # Gamification
            level=user.level,
            points=user.points,
            
            # Social stats
            followers_count=user.follower_count,
            following_count=user.following_count,
            friend_count=user.friend_count,
            
            # Content stats
            reviews_count=user.review_count,
            
            # Activity
            last_active_at=user.last_active_at,
            last_login_at=user.last_login_at,
            
            # Timestamps
            created_at=user.created_at,
            updated_at=user.updated_at,
            createdAt=user.created_at.isoformat() if user.created_at else None,  # camelCase compatibility
            
            # Extended data
            profile_data=user.profile_data or {},
            preferences=user.preferences or {},
            verification_data=user.verification_data or {},
            
            # Computed fields
            stats={
                "totalReviews": user.review_count,
                "totalFollowers": user.follower_count,
                "totalFollowing": user.following_count,
                "level": user.level,
                "points": user.points,
                "joinDate": user.created_at.strftime("%B %Y") if user.created_at else "Unknown"
            }
        )

    def deactivate_user(self, user_id: int) -> bool:
        """Soft delete user by deactivating."""
        try:
            user = self.get_user_by_id(user_id)
            if not user:
                raise UserNotFoundError(user_id=str(user_id))
            
            user.is_active = False
            user.updated_at = func.now()
            
            self.db.commit()
            logger.info(f"Successfully deactivated user {user_id}")
            return True
            
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Database error deactivating user {user_id}: {str(e)}")
            raise ValidationError(f"Failed to deactivate user: {str(e)}")

    def reactivate_user(self, user_id: int) -> bool:
        """Reactivate a deactivated user."""
        try:
            user = self.db.query(CoreUser).filter(CoreUser.user_id == user_id).first()
            if not user:
                raise UserNotFoundError(user_id=str(user_id))
            
            user.is_active = True
            user.updated_at = func.now()
            
            self.db.commit()
            logger.info(f"Successfully reactivated user {user_id}")
            return True
            
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Database error reactivating user {user_id}: {str(e)}")
            raise ValidationError(f"Failed to reactivate user: {str(e)}")