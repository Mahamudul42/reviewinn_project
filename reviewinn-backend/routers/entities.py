from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from database import get_db
from models.entity import Entity
from models.user import User
from models.review import Review
from models.user_entity_view import UserEntityView
from schemas.entity import EntityCreate, EntityResponse
from auth.production_dependencies import CurrentUser, RequiredUser
from services.entity_service import EntityService, EntityListParams, EntitySortBy, EntitySortOrder
from sqlalchemy.sql import func
from core.responses import api_response, error_response, pagination_response
import traceback
import logging
from datetime import datetime

# Set up logger
logger = logging.getLogger(__name__)

router = APIRouter()
auth_service = AuthService()

@router.get("/", response_model=None)
async def get_entities(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    final_category_id: Optional[int] = Query(None, description="Filter by final category ID"),
    search: Optional[str] = Query(None, description="Search in name and description"),
    search_query: Optional[str] = Query(None, description="Search entities (frontend compatibility)"),
    sortBy: Optional[str] = Query("name", description="Sort by field (name, rating, reviewCount, reactionCount, commentCount, trending)"),
    sortOrder: Optional[str] = Query("asc", description="Sort order (asc, desc)"),
    hasReviews: Optional[bool] = Query(None, description="Filter by whether entity has reviews"),
    minRating: Optional[float] = Query(None, description="Minimum average rating filter"),
    verified: Optional[bool] = Query(None, description="Filter by verified status"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = CurrentUser
):
    """
    OPTIMIZED: Get entities with comprehensive engagement data in single API call.
    Same optimization pattern as user profile/homepage/entity details.
    Uses cached engagement metrics for 10k+ user performance.
    """
    try:
        logger.debug(f"Getting OPTIMIZED entities: page={page}, limit={limit}, final_category_id={final_category_id}")
        
        # PERFORMANCE OPTIMIZED: Direct query with indexed JSONB fields for 10M+ users
        query = db.query(Entity).filter(Entity.is_active == True)
        
        # Apply filters using JSONB category fields for enterprise scalability
        if final_category_id:
            query = query.filter(Entity.final_category['id'].astext == str(final_category_id))
        
        # Search in name and description with proper indexing
        search_term = search or search_query
        if search_term:
            search_filter = or_(
                Entity.name.ilike(f"%{search_term}%"),
                Entity.description.ilike(f"%{search_term}%")
            )
            query = query.filter(search_filter)
            
        # Filter by reviews using cached count
        if hasReviews is not None:
            if hasReviews:
                query = query.filter(Entity.review_count > 0)
            else:
                query = query.filter(Entity.review_count == 0)
        
        # Filter by minimum rating
        if minRating is not None:
            query = query.filter(Entity.average_rating >= minRating)
        
        # Filter by verified status
        if verified is not None:
            query = query.filter(Entity.is_verified == verified)
        
        # OPTIMIZED sorting with cached engagement metrics
        if sortBy == "name":
            sort_column = Entity.name
        elif sortBy == "rating":
            sort_column = Entity.average_rating
        elif sortBy == "reviewCount":
            sort_column = Entity.review_count
        elif sortBy == "reactionCount":  # NEW: Sort by total reactions
            sort_column = Entity.reaction_count
        elif sortBy == "commentCount":   # NEW: Sort by total comments  
            sort_column = Entity.comment_count
        elif sortBy == "trending":       # NEW: Combined trending score
            # Use multiple engagement metrics for trending
            query = query.order_by(
                (Entity.reaction_count + Entity.comment_count + Entity.view_count).desc(),
                Entity.average_rating.desc()
            )
            sort_column = None
        else:  # default to created_at
            sort_column = Entity.created_at
        
        if sort_column:
            if sortOrder == "asc":
                query = query.order_by(sort_column.asc())
            else:
                query = query.order_by(sort_column.desc())
        
        # PERFORMANCE FIX: Use limit+1 approach instead of expensive count()
        offset = (page - 1) * limit
        entities_with_extra = query.offset(offset).limit(limit + 1).all()
        
        # Check if there are more records and calculate efficient total
        has_more = len(entities_with_extra) > limit
        entities = entities_with_extra[:limit]
        
        # Efficient total calculation
        if page == 1 and not has_more:
            total = len(entities)
        else:
            total = offset + len(entities) + (1 if has_more else 0)
        
        # PERFORMANCE OPTIMIZED: Use cached engagement metrics (no N+1 queries)
        entities_list = []
        for entity in entities:
            entity_dict = entity.to_dict()
            
            # All engagement stats are already cached in the entity table!
            # No need for separate database queries - massive performance improvement
            logger.debug(f"Entity {entity.name}: "
                        f"reviews={entity.review_count}, "
                        f"reactions={entity.reaction_count}, "
                        f"comments={entity.comment_count}, "
                        f"views={entity.view_count}")
            
            entities_list.append(entity_dict)
        
        # Create optimized paginated response (same format as other optimized endpoints)
        result = {
            "entities": entities_list,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total // limit) + (1 if total % limit else 0) if total > 0 else 1,
            "has_more": has_more,  # Efficient pagination flag
            "engagement_summary": {
                "total_entities": len(entities_list),
                "entities_with_reviews": len([e for e in entities_list if e.get('reviewCount', 0) > 0]),
                "entities_with_reactions": len([e for e in entities_list if e.get('reactionCount', 0) > 0]),
                "entities_with_comments": len([e for e in entities_list if e.get('commentCount', 0) > 0]),
                "avg_rating": sum(e.get('averageRating', 0) for e in entities_list) / len(entities_list) if entities_list else 0
            }
        }
        
        return api_response(
            data=result,
            message=f"Successfully retrieved {len(entities_list)} entities with cached engagement metrics"
        )
        
    except Exception as e:
        logger.error(f"Error in get_entities: {str(e)}")
        logger.error(traceback.format_exc())
        return error_response(
            message=f"Failed to retrieve entities: {str(e)}",
            status_code=500,
            error_code="ENTITY_RETRIEVAL_ERROR"
        )

@router.post("/search", response_model=None)
async def search_entities(
    search_params: dict,
    db: Session = Depends(get_db)
):
    """Search entities by query string"""
    try:
        # Extract parameters from POST body
        q = search_params.get('query', '')
        limit = search_params.get('limit', 20)
        category = search_params.get('category')
        
        logger.debug(f"Searching entities with query: {q}, limit: {limit}, category: {category}")
        
        # Use direct JSONB query for enterprise performance
        query = db.query(Entity).filter(Entity.is_active == True)
        
        # Apply filters using JSONB category system for enterprise scale
        if category:
            # Search by category name in JSONB fields
            query = query.filter(
                or_(
                    Entity.final_category['name'].astext.ilike(f"%{category}%"),
                    Entity.root_category['name'].astext.ilike(f"%{category}%")
                )
            )
        if q:
            search_filter = or_(
                Entity.name.ilike(f"%{q}%"),
                Entity.description.ilike(f"%{q}%")
            )
            query = query.filter(search_filter)
        
        # Apply sorting (by relevance for search)
        query = query.order_by(Entity.average_rating.desc(), Entity.review_count.desc())
        
        # Apply pagination
        entities = query.limit(limit).all()
        
        # Convert entities to response format
        entities_list = []
        for entity in entities:
            entity_dict = entity.to_dict()
            entities_list.append(entity_dict)
        
        # Format response to match frontend expectations
        result = {
            "entities": entities_list,
            "total": len(entities_list),
            "hasMore": False  # For simple search, no pagination
        }
        
        return api_response(
            data=result,
            message=f"Found {len(entities_list)} entities matching '{q}'"
        )
        
    except Exception as e:
        logger.error(f"Error in search_entities: {str(e)}")
        logger.error(traceback.format_exc())
        return error_response(
            message=f"Search failed: {str(e)}",
            status_code=500,
            error_code="ENTITY_SEARCH_ERROR"
        )

@router.post("/", response_model=None)
async def create_entity(
    entity_data: EntityCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = CurrentUser
):
    """Create a new entity"""
    try:
        logger.debug(f"Creating entity with data: {entity_data}")
        logger.debug(f"Avatar field value: {entity_data.avatar}")
        
        # Create new entity instance for enterprise-scale core_entities table
        new_entity = Entity(
            name=entity_data.name,
            description=entity_data.description,
            avatar=entity_data.avatar,
            website=entity_data.website,
            images=entity_data.images or [],
            root_category=entity_data.root_category,
            final_category=entity_data.final_category,
            entity_metadata=entity_data.metadata or {},
            roles=entity_data.roles or [],
            related_entities_json=entity_data.related_entities or [],
            business_info=entity_data.business_info or {},
            claim_data=entity_data.claim_data or {},
            view_analytics=entity_data.view_analytics or {},
            average_rating=0.0,
            review_count=0,
            reaction_count=0,
            comment_count=0,
            view_count=0,
            is_verified=False,
            is_active=True,
            is_claimed=False,
            claimed_by=current_user.user_id if current_user else None,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Validate category data for enterprise consistency
        if entity_data.final_category and not entity_data.root_category:
            # Auto-populate root category if missing but final category is provided
            # This maintains data integrity for enterprise applications
            logger.warning(f"Root category missing for entity {entity_data.name}, using final category as fallback")
            new_entity.root_category = entity_data.final_category
        
        logger.debug(f"Created entity with avatar: {new_entity.avatar}")
        
        # Add to database
        db.add(new_entity)
        db.commit()
        db.refresh(new_entity)
        
        logger.info(f"Entity created successfully with ID: {new_entity.entity_id}")
        
        # Return created entity
        entity_dict = new_entity.to_dict()
        
        return api_response(
            data=entity_dict,
            message="Entity created successfully",
            status_code=201
        )
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating entity: {str(e)}")
        logger.error(traceback.format_exc())
        return error_response(
            message=f"Failed to create entity: {str(e)}",
            status_code=500,
            error_code="ENTITY_CREATE_ERROR"
        )

@router.get("/{entity_id}", response_model=None)
async def get_entity(
    entity_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = CurrentUser
):
    """Get entity by ID"""
    try:
        # Get entity directly from database with enterprise-optimized JSONB query
        entity = db.query(Entity).filter(
            Entity.entity_id == entity_id,
            Entity.is_active == True
        ).first()
        
        if not entity:
            return error_response(
                message=f"Entity with id {entity_id} not found",
                status_code=404,
                error_code="ENTITY_NOT_FOUND"
            )
        
        # Record view if user is logged in and entity exists
        if current_user:
            try:
                # Record view directly without service
                existing_view = db.query(UserEntityView).filter(
                    UserEntityView.user_id == current_user.user_id,
                    UserEntityView.entity_id == entity_id
                ).first()
                
                if existing_view:
                    existing_view.viewed_at = datetime.utcnow()
                else:
                    new_view = UserEntityView(
                        user_id=current_user.user_id,
                        entity_id=entity_id,
                        viewed_at=datetime.utcnow()
                    )
                    db.add(new_view)
                
                # Update view count
                entity.view_count = (entity.view_count or 0) + 1
                db.commit()
            except Exception as view_error:
                logger.warning(f"Failed to record view for entity {entity_id}: {str(view_error)}")
                db.rollback()
                
        return api_response(
            data=entity.to_dict(),
            message="Entity retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error in get_entity: {str(e)}")
        logger.error(traceback.format_exc())
        return error_response(
            message=f"Failed to retrieve entity: {str(e)}",
            status_code=500,
            error_code="ENTITY_RETRIEVAL_ERROR"
        )

# Keep the rest of the file as is, but ensure all endpoints use the api_response and error_response functions
