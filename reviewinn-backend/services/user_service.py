"""
User service layer for handling user-related business logic.
Enhanced with proper dependency injection and comprehensive error handling.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

# from .base import BaseService
from repositories.user_repository import UserRepository
from models.user import User
from models.user_profile import UserProfile
from models.user_progress import UserProgress
from schemas.user import (
    UserCreateRequest, 
    UserUpdateRequest, 
    UserResponse,
    UserProfileResponse,
    UserStatsResponse
)
from schemas.common import PaginatedAPIResponse
from core.exceptions import (
    NotFoundError, 
    ValidationError, 
    DuplicateError,
    BusinessLogicError
)


class UserService:
    """Service for user-related business logic with enhanced architecture."""
    
    def __init__(self, user_repository: UserRepository):
        """Initialize with repository dependency injection."""
        self.user_repository = user_repository
    
    def get_user_by_id(self, user_id: int) -> UserResponse:
        """Get user by ID with full profile data."""
        user = self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User", user_id)
        
        # Get additional user data
        progress = self.user_repository.get_user_progress(user_id)
        stats = self.user_repository.get_user_stats(user_id)
        
        # Safely get profile data if it exists
        profile_location = None
        profile_website = None
        if hasattr(user, 'profile') and user.profile:
            profile_location = getattr(user.profile, 'location', None)
            profile_website = getattr(user.profile, 'website', None)
        
        return UserResponse(
            user_id=user.user_id,
            id=str(user.user_id),
            email=user.email,
            full_name=user.name,
            first_name=getattr(user, 'first_name', None),
            last_name=getattr(user, 'last_name', None),
            name=user.name,
            username=user.username,
            avatar=user.avatar,
            bio=user.bio,
            location=profile_location,
            website=profile_website,
            is_verified=user.is_verified,
            isVerified=user.is_verified,
            level=progress.get('level', 1) if progress else 1,
            points=progress.get('points', 0) if progress else 0,
            created_at=user.created_at,
            createdAt=user.created_at.isoformat()
        )
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        return self.user_repository.find_by_email(email)
    
    async def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username."""
        return self.user_repository.find_by_username(username)
    
    async def create_user(self, user_data: UserCreateRequest) -> UserResponse:
        """Create a new user with validation."""
        # Validate unique constraints
        if self.user_repository.find_by_email(user_data.email):
            raise DuplicateError("Email already registered")
        
        if user_data.username and self.user_repository.find_by_username(user_data.username):
            raise DuplicateError("Username already taken")
        
        # Create user with production auth system password hashing
        from auth.production_auth_system import get_auth_system
        auth_system = get_auth_system()
        
        user_dict = user_data.dict(exclude={'password'})
        user_dict['password_hash'] = auth_system._hash_password(user_data.password)
        
        user = User(**user_dict)
        created_user = self.user_repository.create(user)
        
        # Initialize user progress
        self._initialize_user_progress(created_user.user_id)
        
        return self.get_user_by_id(created_user.user_id)
    
    def update_user(self, user_id: int, update_data: UserUpdateRequest) -> UserResponse:
        """Update user information with validation."""
        user = self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User", user_id)
        
        update_dict = update_data.dict(exclude_unset=True)
        
        # Check for email conflicts if email is being updated
        if "email" in update_dict and update_dict["email"] != user.email:
            existing_user = self.user_repository.find_by_email(update_dict["email"])
            if existing_user and existing_user.user_id != user_id:
                raise DuplicateError("Email already registered")
        
        # Check for username conflicts if username is being updated
        if "username" in update_dict and update_dict["username"] != user.username:
            existing_user = self.user_repository.find_by_username(update_dict["username"])
            if existing_user and existing_user.user_id != user_id:
                raise DuplicateError("Username already taken")
        
        # Separate User fields from UserProfile fields
        user_fields = {}
        profile_fields = {}
        
        for field, value in update_dict.items():
            if field in ['location', 'website']:
                profile_fields[field] = value
            else:
                user_fields[field] = value
        
        # Update User fields if there are any
        if user_fields:
            updated_user = self.user_repository.update(self.user_repository.db, db_obj=user, obj_in=user_fields)
        else:
            updated_user = user
        
        # Update or create UserProfile if there are profile fields
        if profile_fields:
            existing_profile = self.user_repository.get_user_profile(user_id)
            if existing_profile:
                # Update existing profile
                for field, value in profile_fields.items():
                    setattr(existing_profile, field, value)
                self.user_repository.db.commit()
                self.user_repository.db.refresh(existing_profile)
            else:
                # Create new profile
                new_profile = UserProfile(
                    user_id=user_id,
                    location=profile_fields.get('location'),
                    website=profile_fields.get('website'),
                    bio=user.bio,  # Copy bio from user to profile if needed
                    first_name=getattr(user, 'first_name', None),
                    last_name=getattr(user, 'last_name', None),
                    avatar=user.avatar
                )
                self.user_repository.db.add(new_profile)
                self.user_repository.db.commit()
                self.user_repository.db.refresh(new_profile)
        
        return self.get_user_by_id(updated_user.user_id)
    
    async def delete_user(self, user_id: int) -> bool:
        """Delete user (soft delete)."""
        user = self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User", user_id)
        
        return self.user_repository.soft_delete(user)
    
    def get_users_paginated(
        self, 
        page: int = 1, 
        per_page: int = 20,
        filters: Optional[Dict[str, Any]] = None
    ) -> PaginatedAPIResponse:
        """Get paginated list of users with filters."""
        if per_page > 100:
            raise ValidationError("per_page cannot exceed 100")
        
        result = self.user_repository.get_paginated(
            page=page,
            per_page=per_page,
            filters=filters or {}
        )
        
        users = [self.get_user_by_id(user.user_id) for user in result.items]
        
        return PaginatedAPIResponse(
            data=users,
            pagination={
                "total": result.total,
                "page": page,
                "per_page": per_page,
                "pages": (result.total + per_page - 1) // per_page,
                "has_next": page * per_page < result.total,
                "has_prev": page > 1
            }
        )
    
    def get_user_profile(self, user_id: int) -> UserProfileResponse:
        """Get complete user profile with extended information."""
        user = self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User", user_id)
        
        profile = self.user_repository.get_user_profile(user_id)
        progress = self.user_repository.get_user_progress(user_id)
        stats = self.user_repository.get_user_stats(user_id)
        badges = self.user_repository.get_user_badges(user_id)
        connections = self.user_repository.get_user_connections_count(user_id)
        
        return UserProfileResponse(
            user_id=user.user_id,
            id=str(user.user_id),
            email=user.email,
            full_name=user.name,
            first_name=getattr(user, 'first_name', None),
            last_name=getattr(user, 'last_name', None),
            name=user.name,
            username=user.username,
            avatar=user.avatar,
            bio=user.bio,
            is_verified=user.is_verified,
            isVerified=user.is_verified,
            level=progress.get('level', 1) if progress else 1,
            points=progress.get('points', 0) if progress else 0,
            created_at=user.created_at,
            createdAt=user.created_at.isoformat(),
            
            # Extended profile data
            location=profile.location if profile else None,
            website=getattr(profile, 'website', None) if profile else None,
            social_links=getattr(profile, 'social_links', {}) if profile else {},
            privacy_settings=getattr(profile, 'privacy_settings', {}) if profile else {},
            
            # Gamification data
            badges_earned=badges,
            daily_streak=progress.get('daily_streak', 0) if progress else 0,
            reviews_count=stats.get('reviews_count', 0),
            helpful_votes=stats.get('helpful_votes', 0),
            following_count=connections.get('following', 0),
            followers_count=connections.get('followers', 0)
        )
    
    def get_user_stats(self, user_id: int) -> UserStatsResponse:
        """Get user statistics."""
        user = self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User", user_id)
        
        stats = self.user_repository.get_detailed_user_stats(user_id)
        
        return UserStatsResponse(**stats)
    
    async def follow_user(self, follower_id: int, target_user_id: int) -> bool:
        """Follow another user."""
        if follower_id == target_user_id:
            raise BusinessLogicError("Cannot follow yourself")
        
        # Check if both users exist
        follower = self.user_repository.get_by_id(follower_id)
        target = self.user_repository.get_by_id(target_user_id)
        
        if not follower:
            raise NotFoundError("User", follower_id)
        if not target:
            raise NotFoundError("User", target_user_id)
        
        return self.user_repository.create_connection(
            follower_id, target_user_id, "follow"
        )
    
    async def unfollow_user(self, follower_id: int, target_user_id: int) -> bool:
        """Unfollow a user."""
        return self.user_repository.remove_connection(
            follower_id, target_user_id, "follow"
        )
    
    async def search_users(
        self, 
        query: str, 
        filters: Optional[Dict[str, Any]] = None,
        page: int = 1,
        per_page: int = 20
    ) -> PaginatedAPIResponse:
        """Search users by query with filters."""
        result = self.user_repository.search(
            query=query,
            filters=filters or {},
            page=page,
            per_page=per_page
        )
        
        users = [self.get_user_by_id(user.user_id) for user in result.items]
        
        return PaginatedAPIResponse(
            data=users,
            pagination={
                "total": result.total,
                "page": page,
                "per_page": per_page,
                "pages": (result.total + per_page - 1) // per_page,
                "has_next": page * per_page < result.total,
                "has_prev": page > 1
            }
        )
    
    def _hash_password(self, password: str) -> str:
        """
        DEPRECATED: Password hashing now handled by production auth system.
        
        Use auth.production_auth_system.ProductionAuthSystem._hash_password() instead.
        This method is kept for compatibility but should not be used.
        """
        from auth.production_auth_system import get_auth_system
        auth_system = get_auth_system()
        return auth_system._hash_password(password)
    
    async def get_user_profile_by_identifier(self, user_identifier: str) -> UserProfileResponse:
        """Get user profile by username or user ID."""
        user = None
        
        # Try to find by username first
        if user_identifier.isdigit():
            user = self.user_repository.get_by_id(int(user_identifier))
        else:
            user = self.user_repository.get_by_username(user_identifier)
        
        if not user:
            raise NotFoundError("User", user_identifier)
        
        return self.get_user_profile(user.user_id)
    
    async def get_user_reviews(
        self,
        user_id: int,
        page: int = 1,
        size: int = 20,
        sort_by: str = "created_at",
        order: str = "desc",
        current_user_id: int = None
    ) -> PaginatedAPIResponse:
        """Get user's reviews with pagination and optimized entity data loading."""
        user = self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User", user_id)
        
        # Get reviews from review repository with optimized entity loading
        from repositories.review_repository import ReviewRepository
        review_repo = ReviewRepository(self.user_repository.db)
        
        # Get paginated reviews with joined entity data for efficiency
        reviews = review_repo.get_reviews_by_user_with_entities(
            user_id=user_id,
            page=page,
            per_page=size,
            sort_by=sort_by,
            order=order
        )
        
        # Convert to response format with full entity data
        review_responses = []
        for review in reviews.items:
            # Get user info for the review
            review_user = self.user_repository.get_by_id(review.user_id) if review.user_id else None
            
            # Get reaction summary for this review (including user's reaction)
            reaction_summary = self._get_reaction_summary_for_review(review.review_id, current_user_id)
            
            # Build comprehensive entity object with all required fields for homepage-style cards
            entity_data = None
            if hasattr(review, 'entity') and review.entity:
                entity = review.entity
                entity_data = {
                    "id": str(entity.entity_id),
                    "entity_id": entity.entity_id,
                    "name": entity.name,
                    "description": entity.description,
                    # Use hierarchical category names for legacy compatibility
                    "category": entity.root_category.name if hasattr(entity, 'root_category') and entity.root_category else 'General',
                    "subcategory": entity.final_category.name if hasattr(entity, 'final_category') and entity.final_category else None,
                    "avatar": entity.avatar,
                    "isVerified": entity.is_verified,
                    "isClaimed": entity.is_claimed,
                    "claimedBy": entity.claimed_by,
                    "claimedAt": entity.claimed_at.isoformat() if entity.claimed_at else None,
                    "context": entity.context or {},
                    "average_rating": float(entity.average_rating) if entity.average_rating else 0,
                    "averageRating": float(entity.average_rating) if entity.average_rating else 0,
                    "rating": float(entity.average_rating) if entity.average_rating else 0,
                    "review_count": entity.review_count or 0,
                    "reviewCount": entity.review_count or 0,
                    "view_count": entity.view_count or 0,
                    "viewCount": entity.view_count or 0,
                    "createdAt": entity.created_at.isoformat() if entity.created_at else None,
                    "updatedAt": entity.updated_at.isoformat() if entity.updated_at else None,
                    # Category information for breadcrumb display (hierarchical system)
                    "root_category_name": entity.root_category.name if hasattr(entity, 'root_category') and entity.root_category else None,
                    "final_category_name": entity.final_category.name if hasattr(entity, 'final_category') and entity.final_category else None,
                    "root_category_id": entity.root_category_id,
                    "final_category_id": entity.final_category_id,
                }
                
                # Add category relationships if they exist
                if hasattr(entity, 'root_category') and entity.root_category:
                    entity_data["root_category"] = {
                        "id": entity.root_category.id,
                        "name": entity.root_category.name,
                        "slug": entity.root_category.slug,
                        "icon": getattr(entity.root_category, 'icon', None),
                        "color": getattr(entity.root_category, 'color', None),
                        "level": getattr(entity.root_category, 'level', 1)
                    }
                
                if hasattr(entity, 'final_category') and entity.final_category:
                    entity_data["final_category"] = {
                        "id": entity.final_category.id,
                        "name": entity.final_category.name,
                        "slug": entity.final_category.slug,
                        "level": getattr(entity.final_category, 'level', 1),
                        "icon": getattr(entity.final_category, 'icon', None),
                        "color": getattr(entity.final_category, 'color', None)
                    }
                    
                    # Build category breadcrumb for UI display
                    category_breadcrumb = []
                    if entity.root_category and entity.root_category.id != entity.final_category.id:
                        category_breadcrumb.append({
                            "id": entity.root_category.id,
                            "name": entity.root_category.name,
                            "slug": entity.root_category.slug,
                            "level": entity.root_category.level
                        })
                    category_breadcrumb.append({
                        "id": entity.final_category.id,
                        "name": entity.final_category.name,
                        "slug": entity.final_category.slug,
                        "level": entity.final_category.level
                    })
                    entity_data["category_breadcrumb"] = category_breadcrumb
                    entity_data["category_display"] = " > ".join([part["name"] for part in category_breadcrumb])
            
            review_responses.append({
                "id": review.review_id,
                "review_id": review.review_id,
                "entity_id": review.entity_id,
                "user_id": review.user_id,
                "title": review.title,
                "content": review.content,
                "overall_rating": review.overall_rating,
                "ratings": review.ratings or {},
                "criteria": getattr(review, 'criteria', {}) or {},
                "pros": review.pros or [],
                "cons": review.cons or [],
                "images": getattr(review, 'images', []) or [],
                "is_anonymous": review.is_anonymous,
                "is_verified": review.is_verified,
                "view_count": getattr(review, 'view_count', 0),
                "reactions": reaction_summary.get('reactions', {}),
                "user_reaction": reaction_summary.get('user_reaction'),
                "top_reactions": reaction_summary.get('top_reactions', []),
                "total_reactions": reaction_summary.get('total', 0),
                "created_at": review.created_at.isoformat() if review.created_at else None,
                "updated_at": review.updated_at.isoformat() if review.updated_at else None,
                "entity": entity_data,
                "user": {
                    "id": review_user.user_id if review_user else review.user_id,
                    "name": review_user.name if review_user else "Unknown User",
                    "username": review_user.username if review_user else None,
                    "avatar": review_user.avatar if review_user else None,
                    "is_verified": review_user.is_verified if review_user else False
                } if review_user else None
            })
        
        return PaginatedAPIResponse(
            data=review_responses,
            pagination={
                "total": reviews.total,
                "page": page,
                "per_page": size,
                "pages": (reviews.total + size - 1) // size,
                "has_next": page * size < reviews.total,
                "has_prev": page > 1
            }
        )
    
    def _initialize_user_progress(self, user_id: int) -> None:
        """Initialize user progress record."""
        progress = UserProgress(
            user_id=user_id,
            points=0,
            level=1,
            progress_to_next_level=0,
            daily_streak=0,
            published_reviews=0,
            review_target=10,
            total_helpful_votes=0,
            average_rating_given=0.0,
            entities_reviewed=0
        )
        self.user_repository.create_user_progress(progress)
    
    def _get_reaction_summary_for_review(self, review_id: int, current_user_id: int = None) -> dict:
        """Get reaction summary for a review including user's reaction."""
        from sqlalchemy import func
        from models.review_reaction import ReviewReaction
        
        try:
            # Get reaction counts
            counts = (
                self.user_repository.db.query(ReviewReaction.reaction_type, func.count(ReviewReaction.reaction_id))
                .filter(ReviewReaction.review_id == review_id)
                .group_by(ReviewReaction.reaction_type)
                .all()
            )
            
            reaction_counts = {r.value: c for r, c in counts}
            
            # Top 3 reactions by count
            top_reactions = sorted(reaction_counts.items(), key=lambda x: x[1], reverse=True)[:3]
            total = sum(reaction_counts.values())
            
            # Get user's reaction if current user is provided
            user_reaction = None
            if current_user_id:
                user_reaction_obj = self.user_repository.db.query(ReviewReaction).filter_by(
                    review_id=review_id, 
                    user_id=current_user_id
                ).first()
                if user_reaction_obj:
                    user_reaction = user_reaction_obj.reaction_type.value
            
            return {
                "reactions": reaction_counts,
                "top_reactions": [r[0] for r in top_reactions],
                "total_reactions": total,
                "total": total,
                "user_reaction": user_reaction
            }
            
        except Exception as e:
            # Return empty summary if there's an error
            return {
                "reactions": {},
                "top_reactions": [],
                "total_reactions": 0,
                "total": 0,
                "user_reaction": None
            }
    
