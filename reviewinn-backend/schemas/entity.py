from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class EntityBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    avatar: Optional[str] = Field(None, max_length=255)
    website: Optional[str] = Field(None, max_length=255)
    images: Optional[List[str]] = Field(default_factory=list, description="Array of image URLs")
    # JSONB category approach - categories stored as full objects
    root_category: Optional[Dict[str, Any]] = Field(None, description="Root category JSONB object")
    final_category: Optional[Dict[str, Any]] = Field(None, description="Final category JSONB object")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")
    roles: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Entity roles")
    related_entities: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Related entities")
    business_info: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Business information")
    claim_data: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Claim-related data")
    view_analytics: Optional[Dict[str, Any]] = Field(default_factory=dict, description="View analytics data")

class EntityCreate(EntityBase):
    pass

class EntityUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    avatar: Optional[str] = Field(None, max_length=255)
    website: Optional[str] = Field(None, max_length=255)
    images: Optional[List[str]] = Field(None, description="Array of image URLs")
    root_category: Optional[Dict[str, Any]] = Field(None, description="Root category JSONB object")
    final_category: Optional[Dict[str, Any]] = Field(None, description="Final category JSONB object")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")
    roles: Optional[List[Dict[str, Any]]] = Field(None, description="Entity roles")
    related_entities: Optional[List[Dict[str, Any]]] = Field(None, description="Related entities")
    business_info: Optional[Dict[str, Any]] = Field(None, description="Business information")
    claim_data: Optional[Dict[str, Any]] = Field(None, description="Claim-related data")
    view_analytics: Optional[Dict[str, Any]] = Field(None, description="View analytics data")
    is_verified: Optional[bool] = Field(None, description="Verification status")
    is_active: Optional[bool] = Field(None, description="Active status")
    is_claimed: Optional[bool] = Field(None, description="Claimed status")

class EntityResponse(BaseModel):
    entity_id: int
    name: str
    description: Optional[str] = None
    avatar: Optional[str] = None
    website: Optional[str] = None
    images: Optional[List[str]] = Field(default_factory=list)
    root_category: Optional[Dict[str, Any]] = None
    final_category: Optional[Dict[str, Any]] = None
    is_verified: bool = False
    is_active: bool = True
    is_claimed: bool = False
    claimed_by: Optional[int] = None
    claimed_at: Optional[datetime] = None
    # Cached engagement metrics for 10M+ user performance
    average_rating: float = 0.0
    review_count: int = 0
    reaction_count: int = 0
    comment_count: int = 0
    view_count: int = 0
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    roles: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    related_entities: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    business_info: Optional[Dict[str, Any]] = Field(default_factory=dict)
    claim_data: Optional[Dict[str, Any]] = Field(default_factory=dict)
    view_analytics: Optional[Dict[str, Any]] = Field(default_factory=dict)
    created_at: datetime
    updated_at: Optional[datetime] = None
    # Computed fields for frontend compatibility
    category_breadcrumb: Optional[List[Dict[str, Any]]] = None
    category_display: Optional[str] = None

    class Config:
        from_attributes = True

class EntityListResponse(BaseModel):
    entities: list[EntityResponse]
    total: int
    page: int
    limit: int
    pages: int

class EntitySearchParams(BaseModel):
    query: Optional[str] = None
    final_category_id: Optional[int] = None
    root_category_id: Optional[int] = None
    min_rating: Optional[float] = Field(None, ge=0, le=5)
    max_rating: Optional[float] = Field(None, ge=0, le=5)
    has_reviews: Optional[bool] = None
    verified_only: Optional[bool] = None
    is_active: Optional[bool] = True
    sort_by: str = "name"  # name, rating, reviewCount, reactionCount, commentCount, trending
    sort_order: str = "asc"  # asc, desc
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)

class EntityStats(BaseModel):
    total_entities: int
    verified_entities: int
    total_reviews: int
    average_rating: float
    total_reactions: int
    total_comments: int
    total_views: int
    rating_distribution: Dict[int, int]
    recent_reviews: int
    entities_with_reviews: int
    entities_with_reactions: int
    entities_with_comments: int 