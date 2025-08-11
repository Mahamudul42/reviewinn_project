"""
Unified Category Schemas - Pydantic models for unified category API
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime


class UnifiedCategoryBase(BaseModel):
    """Base schema for unified category."""
    name: str = Field(..., min_length=1, max_length=200, description="Category name")
    description: Optional[str] = Field(None, max_length=1000, description="Category description")
    icon: Optional[str] = Field(None, max_length=50, description="Icon name for frontend")
    color: Optional[str] = Field(None, max_length=20, description="Color code for frontend")
    sort_order: Optional[int] = Field(0, ge=0, description="Sort order within parent")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")


class UnifiedCategoryCreate(UnifiedCategoryBase):
    """Schema for creating a new category."""
    parent_id: Optional[int] = Field(None, description="Parent category ID")
    slug: Optional[str] = Field(None, max_length=100, description="URL-friendly slug (auto-generated if not provided)")
    
    @validator('slug')
    def validate_slug(cls, v):
        if v is not None:
            import re
            if not re.match(r'^[a-z0-9-]+$', v):
                raise ValueError('Slug must contain only lowercase letters, numbers, and hyphens')
        return v


class UnifiedCategoryUpdate(BaseModel):
    """Schema for updating an existing category."""
    name: Optional[str] = Field(None, min_length=1, max_length=200, description="Category name")
    description: Optional[str] = Field(None, max_length=1000, description="Category description")
    icon: Optional[str] = Field(None, max_length=50, description="Icon name for frontend")
    color: Optional[str] = Field(None, max_length=20, description="Color code for frontend")
    sort_order: Optional[int] = Field(None, ge=0, description="Sort order within parent")
    is_active: Optional[bool] = Field(None, description="Whether category is active")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")


class UnifiedCategoryBreadcrumb(BaseModel):
    """Schema for breadcrumb item."""
    id: int
    name: str
    slug: str
    level: int


class UnifiedCategoryResponse(UnifiedCategoryBase):
    """Schema for category response."""
    id: int
    slug: str
    parent_id: Optional[int]
    path: Optional[str]
    level: int
    is_active: bool
    is_root: bool
    is_leaf: bool
    created_at: datetime
    updated_at: datetime
    
    # Optional nested data
    children: Optional[List['UnifiedCategoryResponse']] = None
    ancestors: Optional[List['UnifiedCategoryResponse']] = None
    breadcrumb: Optional[List[UnifiedCategoryBreadcrumb]] = None
    
    class Config:
        from_attributes = True


class UnifiedCategorySearchResult(BaseModel):
    """Schema for search results."""
    id: int
    name: str
    slug: str
    level: int
    path_text: str
    type: str  # 'root_category' or 'subcategory'
    display_name: str
    category_id: Optional[int] = None  # For subcategories, the root category ID
    
    class Config:
        from_attributes = True


class UnifiedCategoryHierarchy(BaseModel):
    """Schema for category hierarchy response."""
    categories: Optional[List[UnifiedCategoryResponse]] = None
    category: Optional[UnifiedCategoryResponse] = None  # For single category hierarchy
    total_count: Optional[int] = None
    
    class Config:
        from_attributes = True


class UnifiedCategoryFrontend(BaseModel):
    """Schema for frontend-compatible category format."""
    id: int
    name: str
    slug: str
    label: str  # Same as name, for dropdown compatibility
    value: int  # Same as id, for form compatibility
    category_id: Optional[int]  # Parent category ID for subcategories
    level: int
    path_text: str
    icon: Optional[str]
    color: Optional[str]
    is_leaf: bool
    
    class Config:
        from_attributes = True


class UnifiedCategoryStats(BaseModel):
    """Schema for category statistics."""
    id: int
    name: str
    entity_count: int
    child_count: int
    level: int
    
    class Config:
        from_attributes = True


# Legacy compatibility schemas
class LegacyCategoryResponse(BaseModel):
    """Legacy category format for backward compatibility."""
    id: int
    category_id: int  # Same as id
    name: str
    
    class Config:
        from_attributes = True


class LegacySubcategoryResponse(BaseModel):
    """Legacy subcategory format for backward compatibility."""
    id: int
    subcategory_id: int  # Same as id
    name: str
    category_id: int  # Parent category ID
    level: int
    path_text: str
    
    class Config:
        from_attributes = True


# Update forward references
UnifiedCategoryResponse.model_rebuild()