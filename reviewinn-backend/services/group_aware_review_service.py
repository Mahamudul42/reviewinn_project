"""
Enhanced Review Service with Group Integration.
Extends the existing review service to handle group-aware reviews.
"""
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, asc
from datetime import datetime, timezone
from fastapi import HTTPException

from .review_service import ReviewService
from models.review import Review, ReviewScope
from models.group import Group, GroupMembership, MembershipStatus
from models.entity import Entity
from models.user import User
from schemas.review import ReviewCreateRequest
from core.exceptions import (
    NotFoundError, 
    ValidationError, 
    DuplicateError,
    BusinessLogicError,
    PermissionDeniedError
)

class GroupAwareReviewService(ReviewService):
    """Enhanced review service with group functionality."""
    
    def __init__(self, db: Session):
        super().__init__(db)
    
    async def create_review_with_group_context(
        self, 
        review_data: ReviewCreateRequest,
        user_id: int
    ) -> Review:
        """Create a review with optional group context and visibility settings."""
        
        # Validate entity exists
        entity = self.db.query(Entity).filter(Entity.entity_id == review_data.entity_id).first()
        if not entity:
            raise NotFoundError(f"Entity with ID {review_data.entity_id} not found")
        
        # Validate user exists
        user = self.db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise NotFoundError(f"User with ID {user_id} not found")
        
        # Check if user already reviewed this entity
        existing_review = self.review_repository.find_by_entity_and_user(review_data.entity_id, user_id)
        if existing_review:
            raise DuplicateError("User has already reviewed this entity")
        
        # Validate group if specified
        if review_data.group_id:
            group = self.db.query(Group).filter(Group.group_id == review_data.group_id).first()
            if not group:
                raise NotFoundError(f"Group with ID {review_data.group_id} not found")
            
            # Check if user is a member of the group
            membership = self.db.query(GroupMembership).filter(
                GroupMembership.group_id == review_data.group_id,
                GroupMembership.user_id == user_id,
                GroupMembership.membership_status == MembershipStatus.ACTIVE.value
            ).first()
            
            if not membership:
                raise PermissionDeniedError("You must be a member of the group to post reviews in it")
            
            # Check if user has permission to post reviews in this group
            if not membership.can_post_reviews:
                raise PermissionDeniedError("You don't have permission to post reviews in this group")
            
            # Check if group requires approval for reviews
            if group.require_approval_for_reviews and membership.role not in ["owner", "admin", "moderator"]:
                # Set review as pending approval (you might want to implement this status)
                pass
        
        # Validate review scope
        if review_data.review_scope == ReviewScope.GROUP_ONLY and not review_data.group_id:
            raise ValidationError("Group ID is required for group-only reviews")
        
        # Set appropriate visibility settings based on scope
        visibility_settings = review_data.visibility_settings or {}
        if review_data.review_scope == ReviewScope.GROUP_ONLY:
            visibility_settings = {"public": False, "group_members": True}
        elif review_data.review_scope == ReviewScope.MIXED:
            visibility_settings = {"public": True, "group_members": True}
        elif review_data.review_scope == ReviewScope.PUBLIC:
            visibility_settings = {"public": True, "group_members": True}
        
        # Convert Pydantic model to dict for database insertion
        review_dict = {
            "entity_id": review_data.entity_id,
            "user_id": user_id,
            "title": review_data.title,
            "content": review_data.content,
            "overall_rating": float(review_data.overall_rating),
            "pros": review_data.pros or [],
            "cons": review_data.cons or [],
            "images": review_data.images or [],
            "is_anonymous": review_data.is_anonymous,
            "ratings": review_data.ratings or {},
            "group_id": review_data.group_id,
            "review_scope": review_data.review_scope.value,
            "group_context": review_data.group_context or {},
            "visibility_settings": visibility_settings,
            "created_at": datetime.now(timezone.utc)
        }
        
        # Add legacy ratings if provided
        if review_data.service_rating:
            review_dict["service_rating"] = float(review_data.service_rating)
        if review_data.quality_rating:
            review_dict["quality_rating"] = float(review_data.quality_rating)
        if review_data.value_rating:
            review_dict["value_rating"] = float(review_data.value_rating)
        
        try:
            review = Review(**review_dict)
            self.db.add(review)
            self.db.commit()
            self.db.refresh(review)
            
            # Update group review count if posted in a group
            if review_data.group_id:
                await self._update_group_review_count(review_data.group_id)
            
            # Update entity average rating
            await self._update_entity_rating(review_data.entity_id)
            
            return review
            
        except Exception as e:
            self.db.rollback()
            raise ValidationError(f"Failed to create review: {str(e)}")
    
    def get_reviews_for_group_feed(
        self, 
        group_id: int, 
        user_id: Optional[int] = None,
        page: int = 1,
        size: int = 20
    ) -> Tuple[List[Review], int]:
        """Get reviews for group feed with proper visibility filtering."""
        
        # Verify group exists
        group = self.db.query(Group).filter(Group.group_id == group_id).first()
        if not group:
            raise NotFoundError(f"Group with ID {group_id} not found")
        
        query = self.db.query(Review).filter(Review.group_id == group_id)
        
        # Apply visibility filters based on user membership
        if user_id:
            membership = self.db.query(GroupMembership).filter(
                GroupMembership.group_id == group_id,
                GroupMembership.user_id == user_id,
                GroupMembership.membership_status == MembershipStatus.ACTIVE.value
            ).first()
            
            if membership:
                # Group member can see all reviews posted in group
                query = query.filter(
                    Review.review_scope.in_([
                        ReviewScope.GROUP_ONLY.value, 
                        ReviewScope.MIXED.value, 
                        ReviewScope.PUBLIC.value
                    ])
                )
            else:
                # Non-members can only see public and mixed reviews
                query = query.filter(
                    Review.review_scope.in_([ReviewScope.PUBLIC.value, ReviewScope.MIXED.value])
                )
        else:
            # Anonymous users can only see public and mixed reviews
            query = query.filter(
                Review.review_scope.in_([ReviewScope.PUBLIC.value, ReviewScope.MIXED.value])
            )
        
        # Get total count
        total_count = query.count()
        
        # Apply pagination and ordering
        reviews = query.order_by(desc(Review.created_at)).offset(
            (page - 1) * size
        ).limit(size).all()
        
        return reviews, total_count
    
    def get_user_reviews_in_groups(
        self, 
        user_id: int, 
        page: int = 1, 
        size: int = 20
    ) -> Tuple[List[Review], int]:
        """Get all reviews posted by a user in various groups."""
        
        query = self.db.query(Review).filter(
            Review.user_id == user_id,
            Review.group_id.isnot(None)
        ).options(joinedload(Review.group))
        
        # Get total count
        total_count = query.count()
        
        # Apply pagination and ordering
        reviews = query.order_by(desc(Review.created_at)).offset(
            (page - 1) * size
        ).limit(size).all()
        
        return reviews, total_count
    
    def get_personalized_group_feed(
        self, 
        user_id: int, 
        page: int = 1, 
        size: int = 20
    ) -> Tuple[List[Review], int]:
        """Get personalized feed of reviews from user's groups."""
        
        # Get user's group memberships
        user_groups = self.db.query(GroupMembership.group_id).filter(
            GroupMembership.user_id == user_id,
            GroupMembership.membership_status == MembershipStatus.ACTIVE.value
        ).subquery()
        
        # Get reviews from user's groups
        query = self.db.query(Review).filter(
            Review.group_id.in_(user_groups)
        ).options(joinedload(Review.group), joinedload(Review.user), joinedload(Review.entity))
        
        # Apply visibility filters
        query = query.filter(
            Review.review_scope.in_([
                ReviewScope.GROUP_ONLY.value, 
                ReviewScope.MIXED.value, 
                ReviewScope.PUBLIC.value
            ])
        )
        
        # Get total count
        total_count = query.count()
        
        # Apply pagination and ordering
        reviews = query.order_by(desc(Review.created_at)).offset(
            (page - 1) * size
        ).limit(size).all()
        
        return reviews, total_count
    
    async def update_review_scope(
        self, 
        review_id: int, 
        user_id: int, 
        new_scope: ReviewScope,
        group_context: Optional[Dict[str, Any]] = None,
        visibility_settings: Optional[Dict[str, bool]] = None
    ) -> Review:
        """Update review visibility scope and group context."""
        
        review = self.db.query(Review).filter(
            Review.review_id == review_id,
            Review.user_id == user_id
        ).first()
        
        if not review:
            raise NotFoundError("Review not found or you don't have permission to edit it")
        
        # Validate scope change
        if new_scope == ReviewScope.GROUP_ONLY and not review.group_id:
            raise ValidationError("Cannot set review to group-only without a group")
        
        # Update scope and related fields
        review.review_scope = new_scope.value
        
        if group_context is not None:
            review.group_context = group_context
        
        if visibility_settings is not None:
            review.visibility_settings = visibility_settings
        else:
            # Set default visibility based on scope
            if new_scope == ReviewScope.GROUP_ONLY:
                review.visibility_settings = {"public": False, "group_members": True}
            elif new_scope == ReviewScope.MIXED:
                review.visibility_settings = {"public": True, "group_members": True}
            elif new_scope == ReviewScope.PUBLIC:
                review.visibility_settings = {"public": True, "group_members": True}
        
        review.updated_at = datetime.now(timezone.utc)
        
        try:
            self.db.commit()
            self.db.refresh(review)
            return review
        except Exception as e:
            self.db.rollback()
            raise ValidationError(f"Failed to update review scope: {str(e)}")
    
    def search_reviews_in_group(
        self, 
        group_id: int, 
        query: str, 
        user_id: Optional[int] = None,
        page: int = 1,
        size: int = 20
    ) -> Tuple[List[Review], int]:
        """Search reviews within a specific group."""
        
        # Verify group exists
        group = self.db.query(Group).filter(Group.group_id == group_id).first()
        if not group:
            raise NotFoundError(f"Group with ID {group_id} not found")
        
        # Build search query
        search_query = self.db.query(Review).filter(Review.group_id == group_id)
        
        # Apply search filters
        search_term = f"%{query}%"
        search_query = search_query.filter(
            or_(
                Review.title.ilike(search_term),
                Review.content.ilike(search_term)
            )
        )
        
        # Apply visibility filters
        if user_id:
            membership = self.db.query(GroupMembership).filter(
                GroupMembership.group_id == group_id,
                GroupMembership.user_id == user_id,
                GroupMembership.membership_status == MembershipStatus.ACTIVE.value
            ).first()
            
            if membership:
                search_query = search_query.filter(
                    Review.review_scope.in_([
                        ReviewScope.GROUP_ONLY.value, 
                        ReviewScope.MIXED.value, 
                        ReviewScope.PUBLIC.value
                    ])
                )
            else:
                search_query = search_query.filter(
                    Review.review_scope.in_([ReviewScope.PUBLIC.value, ReviewScope.MIXED.value])
                )
        else:
            search_query = search_query.filter(
                Review.review_scope.in_([ReviewScope.PUBLIC.value, ReviewScope.MIXED.value])
            )
        
        # Get total count
        total_count = search_query.count()
        
        # Apply pagination and ordering
        reviews = search_query.order_by(desc(Review.created_at)).offset(
            (page - 1) * size
        ).limit(size).all()
        
        return reviews, total_count
    
    async def _update_group_review_count(self, group_id: int):
        """Update the review count for a group."""
        try:
            review_count = self.db.query(Review).filter(Review.group_id == group_id).count()
            self.db.query(Group).filter(Group.group_id == group_id).update({
                "review_count": review_count,
                "updated_at": datetime.now(timezone.utc)
            })
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            # Log error but don't fail the main operation
            import logging
            logging.getLogger(__name__).error(f"Failed to update group review count: {e}")
    
    def get_group_review_stats(self, group_id: int) -> Dict[str, Any]:
        """Get review statistics for a group."""
        
        # Verify group exists
        group = self.db.query(Group).filter(Group.group_id == group_id).first()
        if not group:
            raise NotFoundError(f"Group with ID {group_id} not found")
        
        # Get basic stats
        total_reviews = self.db.query(Review).filter(Review.group_id == group_id).count()
        
        # Get scope breakdown
        scope_stats = {}
        for scope in [ReviewScope.PUBLIC, ReviewScope.GROUP_ONLY, ReviewScope.MIXED]:
            count = self.db.query(Review).filter(
                Review.group_id == group_id,
                Review.review_scope == scope.value
            ).count()
            scope_stats[scope.value] = count
        
        # Get average rating
        from sqlalchemy import func
        avg_rating = self.db.query(func.avg(Review.overall_rating)).filter(
            Review.group_id == group_id
        ).scalar() or 0
        
        # Get top contributors
        from sqlalchemy import func
        top_contributors = self.db.query(
            Review.user_id,
            func.count(Review.review_id).label('review_count')
        ).filter(
            Review.group_id == group_id
        ).group_by(Review.user_id).order_by(
            desc(func.count(Review.review_id))
        ).limit(5).all()
        
        return {
            "total_reviews": total_reviews,
            "scope_breakdown": scope_stats,
            "average_rating": round(float(avg_rating), 2),
            "top_contributors": [
                {"user_id": user_id, "review_count": count} 
                for user_id, count in top_contributors
            ]
        }