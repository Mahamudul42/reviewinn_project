"""
Entity schemas for data validation and serialization.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime


class BaseEntitySchema(BaseModel):
    """Base schema for entity data."""
    
    class Config:
        from_attributes = True
        populate_by_name = True


class CreateEntitySchema(BaseEntitySchema):
    """Schema for creating a new entity."""
    
    name: str = Field(..., min_length=1, max_length=255, description="Entity name")
    category: str = Field(..., description="Entity category")
    description: Optional[str] = Field(None, max_length=2000, description="Entity description")
    location: Optional[str] = Field(None, max_length=255, description="Entity location")
    website: Optional[str] = Field(None, max_length=500, description="Entity website URL")
    phone: Optional[str] = Field(None, max_length=20, description="Entity phone number")
    email: Optional[str] = Field(None, max_length=255, description="Entity email")
    image_url: Optional[str] = Field(None, max_length=500, description="Entity image URL")
    tags: Optional[List[str]] = Field(default_factory=list, description="Entity tags")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")
    
    @validator('website')
    def validate_website(cls, v):
        if v and not v.startswith(('http://', 'https://')):
            v = f"https://{v}"
        return v
    
    @validator('email')
    def validate_email(cls, v):
        if v:
            import re
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, v):
                raise ValueError('Invalid email format')
        return v


class UpdateEntitySchema(BaseEntitySchema):
    """Schema for updating an entity."""
    
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None)
    description: Optional[str] = Field(None, max_length=2000)
    location: Optional[str] = Field(None, max_length=255)
    website: Optional[str] = Field(None, max_length=500)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=255)
    image_url: Optional[str] = Field(None, max_length=500)
    tags: Optional[List[str]] = Field(None)
    metadata: Optional[Dict[str, Any]] = Field(None)
    
    @validator('website')
    def validate_website(cls, v):
        if v and not v.startswith(('http://', 'https://')):
            v = f"https://{v}"
        return v
    
    @validator('email')
    def validate_email(cls, v):
        if v:
            import re
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, v):
                raise ValueError('Invalid email format')
        return v


class EntityResponseSchema(BaseEntitySchema):
    """Schema for entity response data."""
    
    id: int
    name: str
    category: str
    description: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    image_url: Optional[str] = None
    tags: List[str] = []
    metadata: Dict[str, Any] = {}
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Analytics fields
    view_count: Optional[int] = 0
    review_count: Optional[int] = 0
    average_rating: Optional[float] = None
    trending_score: Optional[float] = None


class EntityStatsSchema(BaseEntitySchema):
    """Schema for entity statistics."""
    
    entity_id: int
    total_views: int = 0
    total_reviews: int = 0
    average_rating: Optional[float] = None
    weekly_views: int = 0
    monthly_views: int = 0
    trending_score: float = 0.0
    last_updated: str


class EntitySearchSchema(BaseEntitySchema):
    """Schema for entity search parameters."""
    
    query: str = Field("", description="Search query")
    category: Optional[str] = Field(None, description="Filter by category")
    location: Optional[str] = Field(None, description="Filter by location")
    min_rating: Optional[float] = Field(None, ge=0, le=5, description="Minimum rating filter")
    max_rating: Optional[float] = Field(None, ge=0, le=5, description="Maximum rating filter")
    tags: Optional[List[str]] = Field(None, description="Filter by tags")
    skip: int = Field(0, ge=0, description="Number of results to skip")
    limit: int = Field(20, ge=1, le=100, description="Maximum number of results")
    sort_by: Optional[str] = Field("relevance", description="Sort criteria")
    sort_order: Optional[str] = Field("desc", regex="^(asc|desc)$", description="Sort order")


class EntityListResponseSchema(BaseEntitySchema):
    """Schema for paginated entity list response."""
    
    entities: List[EntityResponseSchema]
    total: int
    skip: int
    limit: int
    has_more: bool