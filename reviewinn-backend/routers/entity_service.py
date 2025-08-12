"""
Unified Entity Service API Routes - World-class implementation
Clean API layer that delegates to the unified entity service
"""

from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException, Depends, Path, Body
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
import logging

from services.entity_service import (
    unified_entity_service,
    EntityListParams,
    EntitySortBy,
    EntitySortOrder,
    EntitySearchResult,
    EntityStats
)
from models.entity import EntityCategory
from database import get_db
from core import ValidationError, BusinessLogicError, NotFoundError
from core.auth_dependencies import AuthDependencies
from models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/entities", tags=["Entity Management"])


class EntityListRequest(BaseModel):
    """Request model for entity listing with comprehensive filtering"""
    page: int = Field(1, ge=1, description="Page number")
    limit: int = Field(20, ge=1, le=100, description="Items per page")
    root_category_id: Optional[int] = Field(None, description="Root category ID")
    final_category_id: Optional[int] = Field(None, description="Final category ID")
    search_query: Optional[str] = Field(None, description="Search query")
    sort_by: str = Field("created_at", description="Sort field")
    sort_order: str = Field("desc", description="Sort order")
    is_verified: Optional[bool] = Field(None, description="Filter by verified status")
    is_claimed: Optional[bool] = Field(None, description="Filter by claimed status")
    min_rating: Optional[float] = Field(None, ge=1, le=5, description="Minimum rating")
    max_rating: Optional[float] = Field(None, ge=1, le=5, description="Maximum rating")
    has_reviews: Optional[bool] = Field(None, description="Filter entities with reviews")
    location: Optional[str] = Field(None, description="Location filter")


class EntityResponse(BaseModel):
    """Response model for entity operations"""
    success: bool = Field(..., description="Operation success status")
    data: Optional[dict] = Field(None, description="Entity data")
    message: str = Field(..., description="Response message")


class EntityListResponse(BaseModel):
    """Response model for entity listing"""
    success: bool = Field(..., description="Operation success status")
    data: List[dict] = Field(..., description="List of entities")
    pagination: dict = Field(..., description="Pagination information")
    message: str = Field(..., description="Response message")


class EntityStatsResponse(BaseModel):
    """Response model for entity statistics"""
    success: bool = Field(..., description="Operation success status")
    data: dict = Field(..., description="Statistics data")
    message: str = Field(..., description="Response message")


class EntityCreateRequest(BaseModel):
    """Request model for entity creation"""
    name: str = Field(..., min_length=1, max_length=200, description="Entity name")
    description: str = Field(..., min_length=1, max_length=2000, description="Entity description")
    category: str = Field(..., description="Entity category")
    subcategory: Optional[int] = Field(None, description="Entity subcategory ID (unified category ID)")
    
    # Professional context fields
    context: Optional[dict] = Field(None, description="Professional context (for professionals)")
    additionalContexts: Optional[List[dict]] = Field(None, description="Additional professional contexts")
    fields: Optional[dict] = Field(None, description="Category-specific fields")
    customFields: Optional[dict] = Field(None, description="Custom form fields")
    
    # Legacy fields for backward compatibility
    entity_type: Optional[str] = Field(None, description="Entity type")
    location: Optional[str] = Field(None, max_length=200, description="Entity location")
    website: Optional[str] = Field(None, max_length=500, description="Entity website")
    contact_info: Optional[dict] = Field(None, description="Contact information")
    metadata: Optional[dict] = Field(None, description="Additional metadata")
    
    # Image support
    avatar: Optional[str] = Field(None, description="Entity avatar/image URL")
    imageFile: Optional[str] = Field(None, description="Image file data")


class EntityUpdateRequest(BaseModel):
    """Request model for entity updates with comprehensive validation"""
    name: Optional[str] = Field(None, min_length=1, max_length=200, description="Entity name")
    description: Optional[str] = Field(None, min_length=1, max_length=2000, description="Entity description")
    entity_type: Optional[str] = Field(None, description="Entity type")
    subcategory: Optional[str] = Field(None, max_length=100, description="Entity subcategory")
    location: Optional[str] = Field(None, max_length=200, description="Entity location")
    website: Optional[str] = Field(None, max_length=500, description="Entity website")
    contact_info: Optional[dict] = Field(None, description="Contact information")
    metadata: Optional[dict] = Field(None, description="Additional metadata")
    verified: Optional[bool] = Field(None, description="Verified status")
    claimed: Optional[bool] = Field(None, description="Claimed status")
    avatar: Optional[str] = Field(None, description="Entity avatar/image URL")
    
    # Professional context fields
    context: Optional[dict] = Field(None, description="Professional context")
    additionalContexts: Optional[List[dict]] = Field(None, description="Additional professional contexts")
    fields: Optional[dict] = Field(None, description="Category-specific fields")
    customFields: Optional[dict] = Field(None, description="Custom form fields")


class EntityDeleteRequest(BaseModel):
    """Request model for entity deletion with confirmation"""
    confirmation: str = Field(..., description="Confirmation text to prevent accidental deletion")
    reason: Optional[str] = Field(None, max_length=500, description="Reason for deletion")


# Helper function to check entity ownership/permissions
def _check_entity_permissions(entity: dict, current_user: User) -> bool:
    """Check if user has permission to modify entity"""
    if not current_user:
        return False
    
    # Admin and moderator users can modify any entity
    if current_user.role.value in ['admin', 'moderator']:
        return True
    
    # Entity owners can modify their claimed entities
    if entity.get('claimed_by') == current_user.user_id:
        return True
    
    return False


# Helper function to validate category
def _validate_category(category: str) -> EntityCategory:
    """Validate and return entity category"""
    try:
        return EntityCategory(category)
    except ValueError:
        raise ValidationError(f"Invalid category: {category}")


@router.get("/", response_model=EntityListResponse)
async def list_entities(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    root_category_id: Optional[int] = Query(None, description="Root category ID"),
    final_category_id: Optional[int] = Query(None, description="Final category ID"),
    search_query: Optional[str] = Query(None, description="Search query"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order"),
    is_verified: Optional[bool] = Query(None, description="Filter by verified status"),
    is_claimed: Optional[bool] = Query(None, description="Filter by claimed status"),
    min_rating: Optional[float] = Query(None, ge=1, le=5, description="Minimum rating"),
    max_rating: Optional[float] = Query(None, ge=1, le=5, description="Maximum rating"),
    has_reviews: Optional[bool] = Query(None, description="Filter entities with reviews"),
    location: Optional[str] = Query(None, description="Location filter"),
    db: Session = Depends(get_db)
):
    """
    List entities with comprehensive filtering and pagination.
    
    Supports filtering by:
    - Root and final category IDs
    - Search query
    - Verification and claim status
    - Rating range
    - Location
    - Review presence
    """
    try:
        # Build list parameters
        params = EntityListParams(
            page=page,
            limit=limit,
            root_category_id=root_category_id,
            final_category_id=final_category_id,
            search_query=search_query,
            sort_by=EntitySortBy(sort_by),
            sort_order=EntitySortOrder(sort_order),
            is_verified=is_verified,
            is_claimed=is_claimed,
            min_rating=min_rating,
            max_rating=max_rating,
            has_reviews=has_reviews,
            location=location
        )
        
        # Get entities from service
        result = await unified_entity_service.list_entities(db, params)
        
        # Calculate pages
        pages = (result.total + result.limit - 1) // result.limit if result.total > 0 else 0
        
        return EntityListResponse(
            success=True,
            data=result.entities,
            pagination={
                "page": result.page,
                "limit": result.limit,
                "total": result.total,
                "pages": pages
            },
            message="Entities retrieved successfully"
        )
        
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except BusinessLogicError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in list_entities: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/user/{user_id}/entities", response_model=EntityListResponse)
async def get_entities_by_user(
    user_id: int = Path(..., description="User ID"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order"),
    db: Session = Depends(get_db)
):
    """
    Get entities created/provided by a specific user.
    
    Returns entities that were:
    - Created by the user (claimed_by matches user_id)
    - With pagination and sorting support
    """
    try:
        # Build list parameters for user's entities
        params = EntityListParams(
            page=page,
            limit=limit,
            sort_by=EntitySortBy(sort_by),
            sort_order=EntitySortOrder(sort_order)
        )
        
        # Get entities from service with user filter
        result = await unified_entity_service.list_entities_by_user(db, params, user_id)
        
        # Calculate pages
        pages = (result.total + result.limit - 1) // result.limit if result.total > 0 else 0
        
        return EntityListResponse(
            success=True,
            data=result.entities,
            pagination={
                "page": result.page,
                "limit": result.limit,
                "total": result.total,
                "pages": pages
            },
            message=f"Retrieved {len(result.entities)} entities for user {user_id}"
        )
        
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except BusinessLogicError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in get_entities_by_user: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{entity_id}", response_model=EntityResponse)
async def get_entity(
    entity_id: int = Path(..., description="Entity ID"),
    db: Session = Depends(get_db)
):
    """
    Get a specific entity by ID with comprehensive details.
    
    Returns entity information including:
    - Basic entity details
    - Review statistics
    - Contact information
    - Metadata
    """
    try:
        entity = await unified_entity_service.get_entity_by_id(db, entity_id)
        
        if not entity:
            raise HTTPException(status_code=404, detail=f"Entity with ID {entity_id} not found")
        
        return EntityResponse(
            success=True,
            data=entity,
            message="Entity retrieved successfully"
        )
        
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except BusinessLogicError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in get_entity: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/", response_model=EntityResponse, status_code=201)
async def create_entity(
    entity_data: EntityCreateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(AuthDependencies.get_current_user_optional)
):
    """
    Create a new entity with validation.
    
    Creates a new entity with:
    - Input validation
    - Duplicate name checking
    - Proper categorization
    - Metadata support
    """
    try:
        # Validate category
        entity_category = _validate_category(entity_data.category)
        if not entity_category:
            raise HTTPException(status_code=400, detail="Category is required")
        
        # Prepare entity data for unified service
        entity_payload = {
            "name": entity_data.name,
            "description": entity_data.description,
            "entity_type": entity_data.entity_type or entity_data.category,  # Use category if entity_type not provided
            "category": entity_category,
            "subcategory": str(entity_data.subcategory) if entity_data.subcategory else None,  # Keep subcategory as string for backward compatibility
            "unified_category_id": entity_data.subcategory,  # Use subcategory as unified_category_id
            "avatar": entity_data.avatar,  # Add avatar directly to entity
            "contact_info": entity_data.contact_info or {},
            "metadata": entity_data.metadata or {}
        }
        
        # Add location to contact_info if provided
        if entity_data.location:
            entity_payload["contact_info"]["location"] = entity_data.location
        
        # Add website to contact_info if provided
        if entity_data.website:
            entity_payload["contact_info"]["website"] = entity_data.website
        
        # Add professional context fields to metadata if provided
        if entity_data.context:
            entity_payload["metadata"]["context"] = entity_data.context
        if entity_data.additionalContexts:
            entity_payload["metadata"]["additionalContexts"] = entity_data.additionalContexts
        if entity_data.fields:
            entity_payload["metadata"]["fields"] = entity_data.fields
        if entity_data.customFields:
            entity_payload["metadata"]["customFields"] = entity_data.customFields
        # Avatar is already included in entity_payload above
        if entity_data.imageFile:
            entity_payload["metadata"]["imageFile"] = entity_data.imageFile

        # Create entity using unified service
        entity = await unified_entity_service.create_entity(
            db,
            created_by=current_user.user_id if current_user else None,
            **entity_payload
        )
        
        return EntityResponse(
            success=True,
            data=entity,
            message="Entity created successfully"
        )
        
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except BusinessLogicError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in create_entity: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/{entity_id}", response_model=EntityResponse)
async def update_entity(
    entity_id: int = Path(..., description="Entity ID"),
    entity_data: EntityUpdateRequest = Body(...),
    current_user: User = Depends(AuthDependencies.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update an existing entity with comprehensive validation and authorization.
    
    Updates entity information with:
    - Authorization checks (owner, admin, high-level users)
    - Partial update support
    - Validation
    - Metadata preservation
    - Audit logging
    """
    try:
        # Get existing entity to check permissions
        existing_entity = await unified_entity_service.get_entity_by_id(db, entity_id)
        if not existing_entity:
            raise HTTPException(status_code=404, detail=f"Entity with ID {entity_id} not found")
        
        # Check user permissions
        if not _check_entity_permissions(existing_entity, current_user):
            raise HTTPException(
                status_code=403, 
                detail="You don't have permission to modify this entity"
            )
        
        # Filter out None values for partial update
        update_data = {k: v for k, v in entity_data.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No update data provided")
        
        # Add audit information
        update_data["updated_by"] = current_user.user_id
        update_data["updated_at"] = "now()"
        
        # Update entity using unified service
        entity = await unified_entity_service.update_entity(db, entity_id, **update_data)
        
        if not entity:
            raise HTTPException(status_code=404, detail=f"Entity with ID {entity_id} not found")
        
        # Log the update for audit purposes
        logger.info(
            f"Entity {entity_id} updated by user {current_user.user_id}",
            extra={
                "entity_id": entity_id,
                "user_id": current_user.user_id,
                "updated_fields": list(update_data.keys())
            }
        )
        
        return EntityResponse(
            success=True,
            data=entity,
            message="Entity updated successfully"
        )
        
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except BusinessLogicError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in update_entity: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{entity_id}")
async def delete_entity(
    entity_id: int = Path(..., description="Entity ID"),
    delete_request: EntityDeleteRequest = Body(...),
    current_user: User = Depends(AuthDependencies.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete an entity with comprehensive safety checks and authorization.
    
    Deletes an entity with:
    - Authorization checks (owner, admin only)
    - Dependency checking (reviews, etc.)
    - Confirmation requirement
    - Cascade handling
    - Safety validations
    - Audit logging
    """
    try:
        # Get existing entity to check permissions
        existing_entity = await unified_entity_service.get_entity_by_id(db, entity_id)
        if not existing_entity:
            raise HTTPException(status_code=404, detail=f"Entity with ID {entity_id} not found")
        
        # Check user permissions - only owners and admins can delete
        if not _check_entity_permissions(existing_entity, current_user):
            raise HTTPException(
                status_code=403, 
                detail="You don't have permission to delete this entity"
            )
        
        # Validate confirmation
        if delete_request.confirmation != f"DELETE_ENTITY_{entity_id}":
            raise HTTPException(
                status_code=400, 
                detail="Invalid confirmation. Please type the exact confirmation text."
            )
        
        # Check for dependencies (reviews, etc.)
        review_count = await unified_entity_service.get_entity_review_count(db, entity_id)
        if review_count > 0:
            raise HTTPException(
                status_code=422,
                detail=f"Cannot delete entity with {review_count} existing reviews. Please remove all reviews first."
            )
        
        # Delete entity using unified service
        success = await unified_entity_service.delete_entity(db, entity_id)
        
        if not success:
            raise HTTPException(status_code=404, detail=f"Entity with ID {entity_id} not found")
        
        # Log the deletion for audit purposes
        logger.warning(
            f"Entity {entity_id} deleted by user {current_user.user_id}",
            extra={
                "entity_id": entity_id,
                "user_id": current_user.user_id,
                "entity_name": existing_entity.get("name"),
                "reason": delete_request.reason
            }
        )
        
        return {
            "success": True,
            "message": "Entity deleted successfully",
            "deleted_entity_id": entity_id
        }
        
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except BusinessLogicError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in delete_entity: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{entity_id}/stats", response_model=EntityStatsResponse)
async def get_entity_stats(
    entity_id: int = Path(..., description="Entity ID"),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive statistics for an entity.
    
    Returns detailed statistics including:
    - Review metrics
    - View statistics
    - Growth rates
    - Rating distribution
    """
    try:
        stats = await unified_entity_service.get_entity_stats(db, entity_id)
        
        return EntityStatsResponse(
            success=True,
            data=stats,
            message="Entity statistics retrieved successfully"
        )
        
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except BusinessLogicError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in get_entity_stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{entity_id}/view")
async def record_entity_view(
    entity_id: int = Path(..., description="Entity ID"),
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    """
    Record a user viewing an entity.
    
    Records entity views with:
    - Duplicate prevention
    - View count tracking
    - Spam protection
    """
    try:
        success = await unified_entity_service.record_entity_view(db, entity_id, user_id)
        
        if not success:
            raise HTTPException(status_code=404, detail=f"Entity with ID {entity_id} not found")
        
        return {
            "success": True,
            "message": "Entity view recorded successfully"
        }
        
    except Exception as e:
        logger.error(f"Unexpected error in record_entity_view: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/trending/list")
async def get_trending_entities(
    category: Optional[str] = Query(None, description="Entity category"),
    limit: int = Query(10, ge=1, le=50, description="Number of trending entities"),
    days: int = Query(30, ge=1, le=365, description="Days to look back for trending calculation"),
    db: Session = Depends(get_db)
):
    """
    Get trending entities based on recent activity.
    
    Returns entities trending by:
    - Recent review activity
    - Category filtering
    - Customizable time periods
    """
    try:
        entity_category = _validate_category(category)
        
        trending_entities = await unified_entity_service.get_trending_entities(
            db, 
            category=entity_category, 
            limit=limit, 
            days=days
        )
        
        return {
            "success": True,
            "data": {
                "entities": trending_entities,
                "total": len(trending_entities),
                "period_days": days,
                "category": category
            },
            "message": f"Retrieved {len(trending_entities)} trending entities"
        }
        
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except BusinessLogicError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in get_trending_entities: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{entity_id}/similar")
async def get_similar_entities(
    entity_id: int = Path(..., description="Entity ID"),
    limit: int = Query(5, ge=1, le=20, description="Number of similar entities"),
    db: Session = Depends(get_db)
):
    """
    Get entities similar to the given entity.
    
    Finds similar entities based on:
    - Category matching
    - Subcategory matching
    - Other similarity factors
    """
    try:
        similar_entities = await unified_entity_service.get_similar_entities(
            db, 
            entity_id=entity_id, 
            limit=limit
        )
        
        return {
            "success": True,
            "data": {
                "entities": similar_entities,
                "total": len(similar_entities),
                "reference_entity_id": entity_id
            },
            "message": f"Retrieved {len(similar_entities)} similar entities"
        }
        
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except BusinessLogicError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in get_similar_entities: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/search", response_model=EntityListResponse)
async def search_entities_post(
    search_data: dict = Body(...),
    db: Session = Depends(get_db)
):
    """
    Search entities using POST request (for frontend compatibility).
    
    Supports the same search functionality as GET /entities/ but with POST body.
    This endpoint is added for frontend compatibility with existing search modal.
    """
    try:
        # Extract search parameters from POST body
        query = search_data.get('query', '')
        limit = search_data.get('limit', 20)
        category = search_data.get('category')
        
        # Build list parameters
        params = EntityListParams(
            page=1,
            limit=min(limit, 100),  # Cap at 100
            search_query=query,
            sort_by=EntitySortBy.RATING,
            sort_order=EntitySortOrder.DESC
        )
        
        # If category is provided, try to map it
        if category:
            # For now, treat category as a search term too
            if query:
                params.search_query = f"{query} {category}"
            else:
                params.search_query = category
        
        # Get entities from service
        result = await unified_entity_service.list_entities(db, params)
        
        return EntityListResponse(
            success=True,
            data=result.entities,
            pagination={
                "page": result.page,
                "limit": result.limit,
                "total": result.total,
                "pages": (result.total + result.limit - 1) // result.limit if result.total > 0 else 0
            },
            message=f"Found {len(result.entities)} entities matching '{query}'"
        )
        
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except BusinessLogicError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in search_entities_post: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/health/check")
async def health_check():
    """
    Health check endpoint for entity service.
    """
    return {
        "success": True,
        "service": "entity_service",
        "status": "healthy",
        "version": "2.0.0"
    }