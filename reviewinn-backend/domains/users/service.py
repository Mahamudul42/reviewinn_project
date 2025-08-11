"""
User domain service.
Implements business logic for user management operations.
"""

from typing import Optional, Dict, Any
from datetime import datetime
import logging

from shared.interfaces.services import IUserService
from core.exceptions import (
    UserNotFoundError, InvalidCredentialsError,
    InsufficientPermissionsError, ValidationError
)
from core.config.settings import get_settings
from core.config.cache import cache_manager
from shared.utils import (
    hash_password, verify_password, sanitize_text
)
from shared.constants import UserRole, UserStatus, CACHE_TTL_MEDIUM

from .repository import UserRepository
from .models import User, UserProfile
from .schemas import (
    UserCreateSchema, UserUpdateSchema, UserProfileUpdateSchema,
    PasswordChangeSchema
)

logger = logging.getLogger(__name__)


class UserService(IUserService):
    """Service for user business logic operations."""
    
    def __init__(self, repository: UserRepository):
        self.repository = repository
        self.settings = get_settings()
    
    async def create(self, data: Dict[str, Any], user_id: Optional[str] = None) -> User:
        """Create a new user with validation."""
        try:
            # Validate input data
            user_data = UserCreateSchema(**data)
            
            # Hash password
            password_hash = hash_password(user_data.password)
            
            # Prepare user data
            create_data = {
                "username": user_data.username,
                "email": user_data.email.lower(),
                "password_hash": password_hash,
                "first_name": user_data.first_name,
                "last_name": user_data.last_name,
                "display_name": user_data.display_name or user_data.username,
                "role": UserRole.USER,
                "status": UserStatus.ACTIVE
            }
            
            # Create user
            user = await self.repository.create(create_data)
            
            # Cache user data
            await self._cache_user(user)
            
            logger.info(f"User service created user: {user.username}")
            return user
            
        except Exception as e:
            logger.error(f"Error in user service create: {e}")
            raise
    
    async def register(self, user_data: Dict[str, Any]) -> User:
        """Register a new user."""
        return await self.create(user_data)
    
    async def authenticate(self, email: str, password: str) -> Optional[User]:
        """Authenticate user credentials."""
        try:
            # Get user by email
            user = await self.repository.get_by_email(email.lower())
            if not user:
                raise InvalidCredentialsError()
            
            # Check if user is active
            if user.status != UserStatus.ACTIVE:
                raise InvalidCredentialsError()
            
            # Verify password
            if not verify_password(password, user.password_hash):
                raise InvalidCredentialsError()
            
            # Update last login
            await self.repository.update(user.id, {"last_login_at": datetime.utcnow()})
            
            logger.info(f"User authenticated: {user.username}")
            return user
            
        except InvalidCredentialsError:
            raise
        except Exception as e:
            logger.error(f"Error in user authentication: {e}")
            raise InvalidCredentialsError()
    
    async def get_by_id(self, entity_id: str, user_id: Optional[str] = None) -> Optional[User]:
        """Get user by ID with caching."""
        try:
            # Try cache first
            cache_key = f"user:{entity_id}"
            cached_user = await cache_manager.get(cache_key)
            if cached_user:
                return cached_user
            
            # Get from database
            user = await self.repository.get_by_id(int(entity_id))
            if user:
                await self._cache_user(user)
            
            return user
            
        except Exception as e:
            logger.error(f"Error getting user by ID {entity_id}: {e}")
            return None
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email address."""
        try:
            return await self.repository.get_by_email(email.lower())
        except Exception as e:
            logger.error(f"Error getting user by email: {e}")
            return None
    
    async def get_by_username(self, username: str) -> Optional[User]:
        """Get user by username."""
        try:
            return await self.repository.get_by_username(username)
        except Exception as e:
            logger.error(f"Error getting user by username: {e}")
            return None
    
    async def update(self, entity_id: str, data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[User]:
        """Update user with validation and permissions check."""
        try:
            # Check permissions
            if user_id and user_id != entity_id:
                # Only allow admin/moderator to update other users
                requesting_user = await self.get_by_id(user_id)
                if not requesting_user or not requesting_user.is_moderator:
                    raise InsufficientPermissionsError("update user profile")
            
            # Validate update data
            if not data:
                return await self.get_by_id(entity_id)
            
            update_data = UserUpdateSchema(**data)
            
            # Sanitize text fields
            sanitized_data = {}
            if update_data.first_name:
                sanitized_data["first_name"] = sanitize_text(update_data.first_name, 50)
            if update_data.last_name:
                sanitized_data["last_name"] = sanitize_text(update_data.last_name, 50)
            if update_data.display_name:
                sanitized_data["display_name"] = sanitize_text(update_data.display_name, 100)
            
            # Update user
            user = await self.repository.update(int(entity_id), sanitized_data)
            if user:
                # Clear cache
                await self._clear_user_cache(user.id)
                await self._cache_user(user)
            
            return user
            
        except Exception as e:
            logger.error(f"Error updating user {entity_id}: {e}")
            raise
    
    async def update_password(self, user_id: str, old_password: str, new_password: str) -> bool:
        """Update user password with validation."""
        try:
            user = await self.get_by_id(user_id)
            if not user:
                raise UserNotFoundError(user_id)
            
            # Verify old password
            if not verify_password(old_password, user.password_hash):
                raise InvalidCredentialsError()
            
            # Validate new password
            password_data = PasswordChangeSchema(
                current_password=old_password,
                new_password=new_password
            )
            
            # Hash new password
            new_password_hash = hash_password(password_data.new_password)
            
            # Update password
            await self.repository.update(int(user_id), {"password_hash": new_password_hash})
            
            # Clear cache
            await self._clear_user_cache(int(user_id))
            
            logger.info(f"Password updated for user: {user.username}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating password for user {user_id}: {e}")
            raise
    
    async def update_profile(self, user_id: str, profile_data: Dict[str, Any]) -> Optional[UserProfile]:
        """Update user profile."""
        try:
            # Validate profile data
            profile_update = UserProfileUpdateSchema(**profile_data)
            
            # Sanitize text fields
            sanitized_data = {}
            for field, value in profile_update.dict(exclude_unset=True).items():
                if isinstance(value, str):
                    max_lengths = {
                        "bio": 500,
                        "location": 100,
                        "website": 255,
                        "twitter_handle": 50,
                        "instagram_handle": 50,
                        "linkedin_url": 255
                    }
                    sanitized_data[field] = sanitize_text(value, max_lengths.get(field))
                else:
                    sanitized_data[field] = value
            
            # Update profile
            profile = await self.repository.update_profile(int(user_id), sanitized_data)
            
            # Clear user cache
            await self._clear_user_cache(int(user_id))
            
            return profile
            
        except Exception as e:
            logger.error(f"Error updating profile for user {user_id}: {e}")
            raise
    
    async def delete(self, entity_id: str, user_id: Optional[str] = None) -> bool:
        """Deactivate user account."""
        return await self.deactivate_user(entity_id, "Account deleted by user")
    
    async def deactivate_user(self, user_id: str, reason: Optional[str] = None) -> bool:
        """Deactivate user account."""
        try:
            user = await self.get_by_id(user_id)
            if not user:
                raise UserNotFoundError(user_id)
            
            # Update status
            await self.repository.update(int(user_id), {
                "status": UserStatus.INACTIVE,
                "updated_at": datetime.utcnow()
            })
            
            # Record activity
            await self.repository.record_activity({
                "user_id": int(user_id),
                "activity_type": "account_deactivated",
                "description": reason or "Account deactivated",
                "metadata": f'{{"reason": "{reason}"}}'
            })
            
            # Clear cache
            await self._clear_user_cache(int(user_id))
            
            logger.info(f"User deactivated: {user.username}")
            return True
            
        except Exception as e:
            logger.error(f"Error deactivating user {user_id}: {e}")
            return False
    
    async def list(self, filters: Optional[Dict[str, Any]] = None, page: int = 1, size: int = 20) -> Dict[str, Any]:
        """List users with filtering and pagination."""
        try:
            skip = (page - 1) * size
            
            search_params = filters or {}
            search_params.update({
                "skip": skip,
                "limit": size
            })
            
            result = await self.repository.search_users(**search_params)
            
            return result
            
        except Exception as e:
            logger.error(f"Error listing users: {e}")
            raise
    
    async def follow_user(self, follower_id: str, following_id: str) -> bool:
        """Follow another user."""
        try:
            if follower_id == following_id:
                raise ValidationError("Cannot follow yourself")
            
            # Check if users exist
            follower = await self.get_by_id(follower_id)
            following = await self.get_by_id(following_id)
            
            if not follower:
                raise UserNotFoundError(follower_id)
            if not following:
                raise UserNotFoundError(following_id)
            
            # Create follow relationship
            success = await self.repository.follow_user(int(follower_id), int(following_id))
            
            if success:
                # Record activity
                await self.repository.record_activity({
                    "user_id": int(follower_id),
                    "activity_type": "user_followed",
                    "description": f"Started following {following.username}",
                    "entity_type": "user",
                    "entity_id": int(following_id)
                })
                
                # Clear cache
                await self._clear_user_cache(int(follower_id))
                await self._clear_user_cache(int(following_id))
            
            return success
            
        except Exception as e:
            logger.error(f"Error following user: {e}")
            raise
    
    async def unfollow_user(self, follower_id: str, following_id: str) -> bool:
        """Unfollow a user."""
        try:
            success = await self.repository.unfollow_user(int(follower_id), int(following_id))
            
            if success:
                # Clear cache
                await self._clear_user_cache(int(follower_id))
                await self._clear_user_cache(int(following_id))
            
            return success
            
        except Exception as e:
            logger.error(f"Error unfollowing user: {e}")
            return False
    
    async def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Get user statistics."""
        try:
            user = await self.get_by_id(user_id)
            if not user:
                raise UserNotFoundError(user_id)
            
            # Get cached stats
            cache_key = f"user_stats:{user_id}"
            cached_stats = await cache_manager.get(cache_key)
            if cached_stats:
                return cached_stats
            
            # Calculate stats
            profile = user.profile
            stats = {
                "total_reviews": profile.review_count if profile else 0,
                "total_followers": profile.follower_count if profile else 0,
                "total_following": profile.following_count if profile else 0,
                "join_date": user.created_at,
                "last_activity": user.last_login_at or user.created_at,
                "profile_completion": self._calculate_profile_completion(user)
            }
            
            # Cache stats
            await cache_manager.set(cache_key, stats, CACHE_TTL_MEDIUM)
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting user stats: {e}")
            raise
    
    def _calculate_profile_completion(self, user: User) -> float:
        """Calculate profile completion percentage."""
        total_fields = 10
        completed_fields = 0
        
        # Required fields (always completed)
        completed_fields += 3  # username, email, password
        
        # Optional fields
        if user.first_name:
            completed_fields += 1
        if user.last_name:
            completed_fields += 1
        if user.display_name and user.display_name != user.username:
            completed_fields += 1
        
        if user.profile:
            if user.profile.bio:
                completed_fields += 1
            if user.profile.location:
                completed_fields += 1
            if user.profile.website:
                completed_fields += 1
            if user.profile.avatar_url:
                completed_fields += 1
        
        return (completed_fields / total_fields) * 100
    
    async def _cache_user(self, user: User) -> None:
        """Cache user data."""
        try:
            cache_key = f"user:{user.id}"
            await cache_manager.set(cache_key, user, CACHE_TTL_MEDIUM)
        except Exception as e:
            logger.warning(f"Failed to cache user {user.id}: {e}")
    
    async def _clear_user_cache(self, user_id: int) -> None:
        """Clear user cache."""
        try:
            cache_key = f"user:{user_id}"
            await cache_manager.delete(cache_key)
            
            # Also clear stats cache
            stats_key = f"user_stats:{user_id}"
            await cache_manager.delete(stats_key)
        except Exception as e:
            logger.warning(f"Failed to clear cache for user {user_id}: {e}")