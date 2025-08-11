"""
Review-related schemas.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime
from decimal import Decimal
from .common import BaseResponseSchema, TimestampMixin


class ReviewCreateRequest(BaseModel):
    """Schema for creating a new review with dynamic criteria and fields."""
    entity_id: int = Field(..., description="ID of the entity being reviewed")
    title: str = Field(..., min_length=1, max_length=200, description="Review title (mandatory, max 200 characters)")
    content: str = Field(..., min_length=10, max_length=10000, description="Review description (mandatory, max 10000 characters)")
    overall_rating: Decimal = Field(..., ge=1.0, le=5.0, description="Overall rating (1-5)")
    pros: Optional[List[str]] = Field(None, max_items=5, description="List of pros (max 5 points, each max 100 characters)")
    cons: Optional[List[str]] = Field(None, max_items=5, description="List of cons (max 5 points, each max 100 characters)")
    images: Optional[List[str]] = Field(None, max_items=5, description="List of image URLs (max 5 images)")
    is_anonymous: bool = Field(False, description="Whether review is anonymous")
    
    # Dynamic criteria ratings - any criteria can be submitted
    ratings: Optional[Dict[str, float]] = Field(None, description="Dynamic criteria ratings")
    
    # Dynamic form fields - any additional fields from entity-specific forms
    additional_fields: Optional[Dict[str, Any]] = Field(None, description="Additional form fields")
    
    # Legacy category-specific ratings (kept for backward compatibility)
    service_rating: Optional[Decimal] = Field(None, ge=1.0, le=5.0, description="Service rating")
    quality_rating: Optional[Decimal] = Field(None, ge=1.0, le=5.0, description="Quality rating")
    value_rating: Optional[Decimal] = Field(None, ge=1.0, le=5.0, description="Value rating")
    
    @validator('pros', 'cons')
    def validate_pros_cons(cls, v):
        if v:
            if len(v) > 5:
                raise ValueError('Maximum 5 items allowed')
            for item in v:
                if len(item) > 100:
                    raise ValueError('Each item must be maximum 100 characters')
        return v
    
    @validator('images')
    def validate_images(cls, v):
        if v and len(v) > 5:
            raise ValueError('Maximum 5 images allowed')
        return v
    
    @validator('title')
    def validate_title(cls, v):
        if v and len(v) > 200:
            raise ValueError('Title must be maximum 200 characters')
        return v
    
    @validator('ratings')
    def validate_ratings(cls, v):
        if v:
            for key, rating in v.items():
                if not isinstance(rating, (int, float)) or not (1.0 <= rating <= 5.0):
                    raise ValueError(f'Rating {key} must be between 1.0 and 5.0')
        return v


class ReviewUpdateRequest(BaseModel):
    """Schema for updating an existing review."""
    title: Optional[str] = Field(None, max_length=255, description="Review title")
    content: Optional[str] = Field(None, min_length=10, max_length=5000, description="Review content")
    overall_rating: Optional[Decimal] = Field(None, ge=1.0, le=5.0, description="Overall rating")
    pros: Optional[List[str]] = Field(None, description="List of pros")
    cons: Optional[List[str]] = Field(None, description="List of cons")
    is_anonymous: Optional[bool] = Field(None, description="Whether review is anonymous")
    
    # Category-specific ratings
    service_rating: Optional[Decimal] = Field(None, ge=1.0, le=5.0, description="Service rating")
    quality_rating: Optional[Decimal] = Field(None, ge=1.0, le=5.0, description="Quality rating")
    value_rating: Optional[Decimal] = Field(None, ge=1.0, le=5.0, description="Value rating")


class ReviewResponse(BaseResponseSchema, TimestampMixin):
    """Schema for review response."""
    review_id: int = Field(..., description="Review ID")
    id: str = Field(..., description="Review ID as string (frontend compatibility)")
    user_id: int = Field(..., description="Author user ID")
    entity_id: int = Field(..., description="Entity ID")
    title: Optional[str] = Field(None, description="Review title")
    content: str = Field(..., description="Review content")
    overall_rating: Decimal = Field(..., description="Overall rating")
    pros: List[str] = Field(default_factory=list, description="List of pros")
    cons: List[str] = Field(default_factory=list, description="List of cons")
    is_anonymous: bool = Field(False, description="Whether review is anonymous")
    is_verified: bool = Field(False, description="Whether review is verified")
    helpful_count: int = Field(0, description="Number of helpful votes")
    view_count: int = Field(0, description="Number of views")
    
    # Dynamic criteria ratings and additional fields
    ratings: Dict[str, float] = Field(default_factory=dict, description="Dynamic criteria ratings")
    criteria: Dict[str, Any] = Field(default_factory=dict, description="Additional dynamic form fields")
    
    # Category-specific ratings (legacy)
    service_rating: Optional[Decimal] = Field(None, description="Service rating")
    quality_rating: Optional[Decimal] = Field(None, description="Quality rating")
    value_rating: Optional[Decimal] = Field(None, description="Value rating")
    
    # Related data
    author_name: Optional[str] = Field(None, description="Author name (if not anonymous)")
    author_avatar: Optional[str] = Field(None, description="Author avatar")
    entity_name: str = Field(..., description="Entity name")
    entity_category: str = Field(..., description="Entity category")
    comment_count: int = Field(0, description="Number of comments")
    reaction_count: int = Field(0, description="Number of reactions")
    
    # User interaction
    user_reaction: Optional[str] = Field(None, description="Current user's reaction")
    user_helpful_vote: Optional[bool] = Field(None, description="Whether user voted helpful")
    
    @validator('id', pre=False, always=True)
    def set_id_from_review_id(cls, v, values):
        return str(values.get('review_id', v))


class ReviewListResponse(BaseModel):
    """Schema for review list response."""
    reviews: List[ReviewResponse] = Field(..., description="List of reviews")
    total: int = Field(..., description="Total number of reviews")
    average_rating: Decimal = Field(0.0, description="Average rating")
    rating_distribution: Dict[str, int] = Field(
        default_factory=dict, description="Rating distribution (1-5 stars)"
    )


class ReviewReactionRequest(BaseModel):
    """Schema for review reaction request."""
    reaction_type: str = Field(
        ..., 
        pattern="^(like|helpful|insightful|disagree)$", 
        description="Type of reaction"
    )


class ReviewReactionResponse(BaseModel):
    """Schema for review reaction response."""
    review_id: int = Field(..., description="Review ID")
    user_id: int = Field(..., description="User ID")
    reaction_type: str = Field(..., description="Reaction type")
    created_at: datetime = Field(..., description="Reaction timestamp")


class ReviewCommentRequest(BaseModel):
    """Schema for review comment request."""
    content: str = Field(..., min_length=1, max_length=1000, description="Comment content")
    parent_comment_id: Optional[int] = Field(None, description="Parent comment ID for replies")


class ReviewCommentResponse(BaseResponseSchema, TimestampMixin):
    """Schema for review comment response."""
    comment_id: int = Field(..., description="Comment ID")
    review_id: int = Field(..., description="Review ID")
    user_id: int = Field(..., description="User ID")
    content: str = Field(..., description="Comment content")
    parent_comment_id: Optional[int] = Field(None, description="Parent comment ID")
    likes: int = Field(0, description="Number of likes")
    
    # Related data
    author_name: str = Field(..., description="Author name")
    author_avatar: Optional[str] = Field(None, description="Author avatar")
    replies: List['ReviewCommentResponse'] = Field(default_factory=list, description="Replies")
    
    # User interaction
    user_liked: Optional[bool] = Field(None, description="Whether current user liked")


class ReviewStatsResponse(BaseModel):
    """Schema for review statistics."""
    total_reviews: int = Field(0, description="Total number of reviews")
    average_rating: Decimal = Field(0.0, description="Average rating")
    rating_distribution: Dict[str, int] = Field(default_factory=dict, description="Rating counts")
    recent_reviews_count: int = Field(0, description="Reviews in last 30 days")
    verified_reviews_count: int = Field(0, description="Number of verified reviews")
    helpful_reviews_count: int = Field(0, description="Reviews with helpful votes")


class ReviewSearchFilters(BaseModel):
    """Schema for review search filters."""
    entity_id: Optional[int] = Field(None, description="Filter by entity ID")
    user_id: Optional[int] = Field(None, description="Filter by user ID")
    rating_min: Optional[Decimal] = Field(None, ge=1.0, le=5.0, description="Minimum rating")
    rating_max: Optional[Decimal] = Field(None, ge=1.0, le=5.0, description="Maximum rating")
    verified_only: Optional[bool] = Field(None, description="Show only verified reviews")
    category: Optional[str] = Field(None, description="Filter by entity category")
    date_from: Optional[datetime] = Field(None, description="Filter from date")
    date_to: Optional[datetime] = Field(None, description="Filter to date")
    has_photos: Optional[bool] = Field(None, description="Reviews with photos only")
    min_helpful_votes: Optional[int] = Field(None, ge=0, description="Minimum helpful votes")
    sort_by: str = Field("created_at", description="Sort field")
    sort_order: str = Field("desc", pattern="^(asc|desc)$", description="Sort order")
    page: int = Field(1, ge=1, description="Page number")
    per_page: int = Field(20, ge=1, le=100, description="Items per page")


# Enable forward references for recursive types
ReviewCommentResponse.model_rebuild()
