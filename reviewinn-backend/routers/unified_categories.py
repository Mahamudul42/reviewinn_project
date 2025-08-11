"""
Unified Categories API Router
Handles all category-related endpoints with unified hierarchical structure
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import logging

from database import get_db
from services.unified_category_service import unified_category_service
from schemas.unified_category import (
    UnifiedCategoryResponse, 
    UnifiedCategoryCreate, 
    UnifiedCategoryUpdate,
    UnifiedCategorySearchResult,
    UnifiedCategoryHierarchy
)
from pydantic import BaseModel

router = APIRouter(prefix="/unified-categories", tags=["unified-categories"])
logger = logging.getLogger(__name__)


@router.get("/", response_model=List[UnifiedCategoryResponse])
async def get_all_categories(
    include_inactive: bool = Query(False, description="Include inactive categories"),
    db: Session = Depends(get_db)
):
    """Get all categories in hierarchical structure."""
    try:
        categories = await unified_category_service.get_all_categories(db, include_inactive)
        return categories
    except Exception as e:
        logger.error(f"Error getting all categories: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get categories: {str(e)}")


@router.get("/roots", response_model=List[UnifiedCategoryResponse])
async def get_root_categories(db: Session = Depends(get_db)):
    """Get only root-level categories."""
    try:
        categories = await unified_category_service.get_root_categories(db)
        return categories
    except Exception as e:
        logger.error(f"Error getting root categories: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get root categories: {str(e)}")


@router.get("/leaf", response_model=List[UnifiedCategoryResponse])
async def get_leaf_categories(
    root_category_id: Optional[int] = Query(None, description="Filter by root category"),
    db: Session = Depends(get_db)
):
    """Get all leaf categories (categories without children) for entity assignment."""
    try:
        categories = await unified_category_service.get_leaf_categories(db, root_category_id)
        return categories
    except Exception as e:
        logger.error(f"Error getting leaf categories: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get leaf categories: {str(e)}")


@router.get("/search", response_model=List[UnifiedCategorySearchResult])
async def search_categories(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results"),
    db: Session = Depends(get_db)
):
    """Search categories by name."""
    try:
        results = await unified_category_service.search_categories(db, q, limit)
        return results
    except Exception as e:
        logger.error(f"Error searching categories: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to search categories: {str(e)}")


@router.get("/hierarchy", response_model=UnifiedCategoryHierarchy)
async def get_category_hierarchy(
    category_id: Optional[int] = Query(None, description="Get hierarchy for specific category"),
    db: Session = Depends(get_db)
):
    """Get the complete category hierarchy."""
    try:
        hierarchy = await unified_category_service.get_category_hierarchy(db, category_id)
        return hierarchy
    except Exception as e:
        logger.error(f"Error getting category hierarchy: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get category hierarchy: {str(e)}")


@router.post("/", response_model=UnifiedCategoryResponse)
async def create_category(
    category_data: UnifiedCategoryCreate,
    db: Session = Depends(get_db)
):
    """Create a new category."""
    try:
        category = await unified_category_service.create_category(db, category_data)
        return category
    except ValueError as e:
        logger.error(f"Validation error creating category: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating category: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create category: {str(e)}")


@router.get("/frontend")
async def get_categories_for_frontend(
    format: str = Query("hierarchical", description="Format type"),
    db: Session = Depends(get_db)
):
    """Get categories formatted for frontend consumption."""
    try:
        categories = await unified_category_service.get_categories_for_frontend(db, format)
        return {
            "categories": categories,
            "format": format,
            "total": len(categories)
        }
    except Exception as e:
        logger.error(f"Error getting categories for frontend: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get categories for frontend: {str(e)}")


@router.get("/{category_id}", response_model=UnifiedCategoryResponse)
async def get_category_by_id(
    category_id: int = Path(..., description="Category ID"),
    include_children: bool = Query(True, description="Include child categories"),
    include_ancestors: bool = Query(True, description="Include ancestor categories"),
    db: Session = Depends(get_db)
):
    """Get a specific category by ID."""
    try:
        category = await unified_category_service.get_category_by_id(
            db, category_id, include_children, include_ancestors
        )
        
        if not category:
            raise HTTPException(status_code=404, detail=f"Category with ID {category_id} not found")
        
        return category
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting category by ID: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get category: {str(e)}")


# Custom Category Models
class CustomCategoryCreate(BaseModel):
    name: str
    parent_custom_id: int
    user_id: Optional[int] = None


@router.post("/custom", response_model=UnifiedCategoryResponse)
async def create_custom_category(
    custom_data: CustomCategoryCreate,
    db: Session = Depends(get_db)
):
    """Create a custom user-defined category under a 'Custom' parent."""
    try:
        category = await unified_category_service.create_custom_category(
            db, 
            custom_data.name, 
            custom_data.parent_custom_id, 
            custom_data.user_id
        )
        return category
    except ValueError as e:
        logger.error(f"Validation error creating custom category: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating custom category: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create custom category: {str(e)}")


@router.get("/custom/{parent_custom_id}", response_model=List[UnifiedCategoryResponse])
async def get_custom_categories(
    parent_custom_id: int = Path(..., description="Parent Custom category ID"),
    db: Session = Depends(get_db)
):
    """Get all user-created custom categories under a specific 'Custom' parent."""
    try:
        categories = await unified_category_service.get_custom_categories_by_parent(db, parent_custom_id)
        return categories
    except ValueError as e:
        logger.error(f"Validation error getting custom categories: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting custom categories: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get custom categories: {str(e)}")


@router.get("/{parent_id}/children", response_model=List[UnifiedCategoryResponse])
async def get_children_categories(
    parent_id: int = Path(..., description="Parent category ID"),
    db: Session = Depends(get_db)
):
    """Get direct children of a category."""
    try:
        children = await unified_category_service.get_children_categories(db, parent_id)
        return children
    except Exception as e:
        logger.error(f"Error getting children categories: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get children categories: {str(e)}")


# Legacy compatibility endpoints
@router.get("/legacy/categories", response_model=List[Dict[str, Any]])
async def get_legacy_categories(db: Session = Depends(get_db)):
    """Legacy endpoint for backward compatibility."""
    try:
        root_categories = await unified_category_service.get_root_categories(db)
        
        # Transform to legacy format
        legacy_format = []
        for category in root_categories:
            legacy_format.append({
                "id": category["id"],
                "name": category["name"],
                "category_id": category["id"]  # For legacy compatibility
            })
        
        return legacy_format
    except Exception as e:
        logger.error(f"Error in legacy categories endpoint: {e}")
        raise HTTPException(status_code=500, detail="Failed to get categories")