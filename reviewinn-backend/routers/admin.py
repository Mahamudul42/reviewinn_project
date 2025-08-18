"""
Admin router for maintenance tasks
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.entity import Entity
from models.review import Review
from core.responses import api_response
from auth.production_dependencies import AdminUser
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin"])

@router.post("/update-entity-ratings")
async def update_entity_ratings(
    all_entities: bool = False,
    db: Session = Depends(get_db),
    admin_user: AdminUser = None
):
    """Update entity average ratings and review counts."""
    try:
        logger.info("Starting entity ratings update...")
        
        # Get entities that have reviews
        if all_entities:
            entities_with_reviews = (
                db.query(Review.entity_id)
                .distinct()
                .all()
            )
        else:
            entities_with_reviews = (
                db.query(Review.entity_id)
                .distinct()
                .limit(50)  # Process in batches
                .all()
            )
        
        updated_entities = []
        
        for entity_row in entities_with_reviews:
            entity_id = entity_row.entity_id
            
            # Calculate ratings for this entity
            rating_stats = (
                db.query(
                    func.count(Review.review_id).label('review_count'),
                    func.avg(Review.overall_rating).label('avg_rating')
                )
                .filter(Review.entity_id == entity_id)
                .first()
            )
            
            if rating_stats.review_count > 0:
                # Update entity
                entity = db.query(Entity).filter(Entity.entity_id == entity_id).first()
                if entity:
                    old_avg = entity.average_rating
                    old_count = entity.review_count
                    
                    entity.average_rating = float(rating_stats.avg_rating)
                    entity.review_count = rating_stats.review_count
                    
                    # Only include in response if actually changed
                    if old_avg != entity.average_rating or old_count != entity.review_count:
                        updated_entities.append({
                            "entity_id": entity.entity_id,
                            "name": entity.name,
                            "old_rating": old_avg,
                            "new_rating": round(float(rating_stats.avg_rating), 2),
                            "old_count": old_count,
                            "new_count": rating_stats.review_count
                        })
        
        db.commit()
        logger.info(f"Updated {len(updated_entities)} entities")
        
        return api_response(
            data={
                "updated_count": len(updated_entities),
                "entities": updated_entities,
                "processed_all": all_entities
            },
            message=f"Successfully updated {len(updated_entities)} entity ratings"
        )
        
    except Exception as e:
        logger.error(f"Error updating entity ratings: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update entity ratings: {str(e)}"
        )

@router.get("/entity-stats")
async def get_entity_stats(db: Session = Depends(get_db)):
    """Get entity rating statistics."""
    try:
        # Get sample entities with ratings
        entities = (
            db.query(Entity)
            .filter(Entity.review_count > 0)
            .limit(10)
            .all()
        )
        
        entity_stats = []
        for entity in entities:
            entity_stats.append({
                "entity_id": entity.entity_id,
                "name": entity.name,
                "average_rating": entity.average_rating,
                "review_count": entity.review_count
            })
        
        return api_response(
            data={"entities": entity_stats},
            message=f"Retrieved {len(entity_stats)} entities with ratings"
        )
        
    except Exception as e:
        logger.error(f"Error getting entity stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get entity stats: {str(e)}"
        )