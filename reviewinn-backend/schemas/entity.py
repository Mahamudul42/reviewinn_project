from pydantic import BaseModel, Field
from models.entity import EntityCategory
from typing import Optional, Dict, Any
from datetime import datetime

class EntityBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=1000)
    entity_type: Optional[str] = Field(None, min_length=1, max_length=50)  # Make optional since model doesn't have it
    category: EntityCategory
    subcategory: Optional[str] = Field(None, max_length=100)
    unified_category_id: Optional[int] = Field(None)  # New unified category reference
    root_category_id: Optional[int] = Field(None)  # Root level category (level 1)
    final_category_id: Optional[int] = Field(None)  # Final selected category (any level)
    avatar: Optional[str] = Field(None, max_length=500)  # Image URL
    location: Optional[str] = Field(None, max_length=200)
    website: Optional[str] = Field(None, max_length=200)
    contact_info: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    # Additional fields that frontend sends
    context: Optional[Dict[str, Any]] = None
    additionalContexts: Optional[list] = None
    fields: Optional[Dict[str, Any]] = None
    customFields: Optional[Dict[str, Any]] = None

class EntityCreate(EntityBase):
    pass

class EntityUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1, max_length=1000)
    entity_type: Optional[str] = Field(None, min_length=1, max_length=50)
    category: Optional[EntityCategory] = None
    subcategory: Optional[str] = Field(None, max_length=100)
    unified_category_id: Optional[int] = Field(None)
    root_category_id: Optional[int] = Field(None)
    final_category_id: Optional[int] = Field(None)
    avatar: Optional[str] = Field(None, max_length=500)  # Image URL
    location: Optional[str] = Field(None, max_length=200)
    website: Optional[str] = Field(None, max_length=200)
    contact_info: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

class EntityResponse(EntityBase):
    entity_id: int
    created_by: Optional[int] = None
    is_verified: bool = False
    is_claimed: bool = False
    claimed_by: Optional[int] = None
    claimed_at: Optional[datetime] = None
    review_count: int = 0
    average_rating: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    # New hierarchical category fields
    root_category_id: Optional[int] = None
    final_category_id: Optional[int] = None
    category_breadcrumb: Optional[list] = None
    category_display: Optional[str] = None
    root_category: Optional[Dict[str, Any]] = None
    final_category: Optional[Dict[str, Any]] = None

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
    category: Optional[EntityCategory] = None
    subcategory: Optional[str] = None
    entity_type: Optional[str] = None
    location: Optional[str] = None
    min_rating: Optional[float] = Field(None, ge=0, le=5)
    max_rating: Optional[float] = Field(None, ge=0, le=5)
    has_reviews: Optional[bool] = None
    verified_only: Optional[bool] = None
    sort_by: str = "name"
    sort_order: str = "asc"
    page: int = 1
    limit: int = 20

class EntityStats(BaseModel):
    total_reviews: int
    average_rating: float
    rating_distribution: Dict[int, int]
    recent_reviews: int
    total_entities: int
    verified_entities: int 