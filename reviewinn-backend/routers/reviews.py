from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import desc, asc, func, text
from typing import List, Optional, Any
from datetime import datetime, timezone
from database import get_db
from models.review import Review
from models.review_reaction import ReviewReaction, ReactionType as ReviewReactionType
from models.comment import Comment, CommentReaction, ReactionType as CommentReactionType
from models.user import User
from models.entity import Entity
from auth.production_dependencies import CurrentUser, RequiredUser
from pydantic import BaseModel
from datetime import datetime, timezone
from sqlalchemy.exc import IntegrityError
from models.user_entity_view import UserEntityView
from core.responses import api_response, error_response
from services.cache_service import cache_result, cache_service
from services.review_service import ReviewService
from services.count_validation_service import CountValidationService
from schemas.review import ReviewCreateRequest
import traceback
import logging
import json
from fastapi.responses import JSONResponse
from core.security import input_validator, review_validator

# Set up logger
logger = logging.getLogger(__name__)

router = APIRouter()

# Keep existing Pydantic models here...
class ReviewEntityInfo(BaseModel):
    entity_id: int
    name: str
    average_rating: Optional[float]
    review_count: Optional[int] = 0

    class Config:
        from_attributes = True

class ReviewUserInfo(BaseModel):
    user_id: int
    name: str
    avatar: Optional[str] = None

    class Config:
        from_attributes = True

class ReviewCreate(BaseModel):
    entity_id: int
    title: Optional[str] = None
    content: str
    overall_rating: float
    price_rating: Optional[float] = None
    quality_rating: Optional[float] = None
    service_rating: Optional[float] = None
    is_verified: bool = False

class ReviewUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    overall_rating: Optional[float] = None
    price_rating: Optional[float] = None
    quality_rating: Optional[float] = None
    service_rating: Optional[float] = None

class ReviewResponse(BaseModel):
    review_id: int
    entity_id: int
    user_id: int
    reviewer_name: str
    reviewer_username: Optional[str] = None
    reviewer_avatar: Optional[str] = None
    title: Optional[str] = None
    content: str
    overall_rating: float
    price_rating: Optional[float] = None
    quality_rating: Optional[float] = None
    service_rating: Optional[float] = None
    ratings: Optional[dict] = None
    pros: Optional[List[str]] = None
    cons: Optional[List[str]] = None
    images: Optional[List[str]] = None
    is_anonymous: bool = False
    is_verified: bool = False
    is_flagged: bool = False
    view_count: int = 0
    comment_count: int = 0
    reactions: dict = {}
    user_reaction: Optional[str] = None
    top_reactions: List[str] = []
    total_reactions: int = 0
    created_at: datetime
    updated_at: datetime
    entity: Optional[ReviewEntityInfo] = None
    user: Optional[ReviewUserInfo] = None
    comments: Optional[List[Any]] = []

class ReviewListResponse(BaseModel):
    reviews: List[ReviewResponse]
    total: int
    page: int
    limit: int
    pages: int

class CommentResponse(BaseModel):
    comment_id: int
    review_id: int
    user_id: int
    user_name: str
    user_avatar: Optional[str] = None
    content: str
    created_at: datetime
    likes: int = 0
    reactions: dict = {}
    user_reaction: Optional[str] = None

    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

class CommentListResponse(BaseModel):
    comments: List[CommentResponse]
    total: int
    page: int
    limit: int
    pages: int

class ReactionRequest(BaseModel):
    reaction_type: str

class CommentRequest(BaseModel):
    content: str

# Helper functions from the original file

def get_comment_reaction_summary_response(comment_id: int, db: Session, current_user_id: Optional[int] = None):
    # Get all reactions for this comment
    reactions_query = db.query(CommentReaction).filter(CommentReaction.comment_id == comment_id)
    reactions = reactions_query.all()
    
    # Count reactions by type
    reaction_counts = {}
    for reaction in reactions:
        reaction_type = reaction.reaction_type.value if hasattr(reaction.reaction_type, 'value') else str(reaction.reaction_type)
        if reaction_type in reaction_counts:
            reaction_counts[reaction_type] += 1
        else:
            reaction_counts[reaction_type] = 1
    
    # Get current user's reaction if any
    user_reaction = None
    if current_user_id:
        user_reaction_obj = reactions_query.filter(CommentReaction.user_id == current_user_id).first()
        if user_reaction_obj:
            user_reaction = user_reaction_obj.reaction_type.value if hasattr(user_reaction_obj.reaction_type, 'value') else str(user_reaction_obj.reaction_type)
    
    return {
        "reactions": reaction_counts,
        "user_reaction": user_reaction
    }

@router.post("/test", response_model=None, status_code=200)
async def test_review_endpoint(
    request: Request,
    current_user: RequiredUser,
    db: Session = Depends(get_db)
):
    """Test endpoint to verify authentication and database connection."""
    try:
        logger.info(f"=== TEST ENDPOINT CALLED ===")
        logger.info(f"Request headers: {dict(request.headers)}")
        logger.info(f"Authorization header: {request.headers.get('authorization', 'NOT_FOUND')}")
        logger.info(f"Current user: {current_user.username} (ID: {current_user.user_id})")
        
        # Test database connection
        review_count = db.query(Review).count()
        logger.info(f"Total reviews in database: {review_count}")
        
        return api_response(
            data={"user_id": current_user.user_id, "username": current_user.username, "review_count": review_count},
            message="Test successful"
        )
    except Exception as e:
        logger.error(f"Test endpoint error: {str(e)}")
        return error_response(
            message=f"Test failed: {str(e)}",
            status_code=500,
            error_code="TEST_ERROR"
        )

@router.post("/create", response_model=None, status_code=201)
async def create_review(
    review_data: ReviewCreateRequest,
    current_user: RequiredUser,
    db: Session = Depends(get_db)
):
    """Create a new review for an entity."""
    try:
        logger.info(f"=== REVIEW CREATION STARTED ===")
        logger.info(f"Creating review for entity {review_data.entity_id} by user {current_user.user_id}")
        
        # Validate review content for security
        if review_data.content:
            content_validation = review_validator.validate_review_text(review_data.content)
            if not content_validation['valid']:
                return error_response(
                    message="Invalid review content",
                    status_code=400,
                    error_code="INVALID_CONTENT",
                    details=content_validation['errors']
                )
            # Use sanitized content
            review_data.content = content_validation['sanitized_content']
        
        # Validate title
        if review_data.title:
            sanitized_title = input_validator.sanitize_text(review_data.title, max_length=200)
            if input_validator.check_xss_patterns(review_data.title) or input_validator.check_sql_injection(review_data.title):
                return error_response(
                    message="Invalid review title",
                    status_code=400,
                    error_code="INVALID_TITLE"
                )
            review_data.title = sanitized_title
        
        # Validate rating
        rating_validation = review_validator.validate_rating(review_data.overall_rating)
        if not rating_validation['valid']:
            return error_response(
                message="Invalid rating",
                status_code=400,
                error_code="INVALID_RATING",
                details=rating_validation['errors']
            )
        
        logger.info(f"Review validation passed - content length: {len(review_data.content or '')}")
        
        # Initialize review service
        review_service = ReviewService(db)
        
        # Check if entity exists
        entity = db.query(Entity).filter(Entity.entity_id == review_data.entity_id).first()
        if not entity:
            return error_response(
                message="Entity not found",
                status_code=404,
                error_code="ENTITY_NOT_FOUND"
            )
        
        # Check if user already reviewed this entity (TEMPORARILY DISABLED FOR TESTING)
        # existing_review = db.query(Review).filter(
        #     Review.entity_id == review_data.entity_id,
        #     Review.user_id == current_user.user_id
        # ).first()
        # 
        # if existing_review:
        #     return error_response(
        #         message="You have already reviewed this entity",
        #         status_code=409,
        #         error_code="REVIEW_ALREADY_EXISTS"
        #     )
        
        # Prepare review data for the service
        review_dict = {
            "title": review_data.title,
            "content": review_data.content,
            "overall_rating": float(review_data.overall_rating),
            "pros": review_data.pros or [],
            "cons": review_data.cons or [],
            "images": review_data.images or [],
            "is_anonymous": review_data.is_anonymous,
            # Store dynamic criteria ratings
            "ratings": {},
        }
        
        # Add dynamic criteria ratings
        logger.info(f"🎯 Backend received ratings data:")
        logger.info(f"   - review_data.ratings: {review_data.ratings}")
        logger.info(f"   - review_data.ratings type: {type(review_data.ratings)}")
        logger.info(f"   - review_dict['ratings'] before: {review_dict['ratings']}")
        
        if review_data.ratings:
            review_dict["ratings"].update(review_data.ratings)
            logger.info(f"   - review_dict['ratings'] after update: {review_dict['ratings']}")
        else:
            logger.warning("   - No ratings data received from frontend!")
        
        # Add legacy ratings for backward compatibility
        if review_data.service_rating:
            review_dict["ratings"]["service_rating"] = float(review_data.service_rating)
        if review_data.quality_rating:
            review_dict["ratings"]["quality_rating"] = float(review_data.quality_rating)
        if review_data.value_rating:
            review_dict["ratings"]["value_rating"] = float(review_data.value_rating)
        
        # Store additional dynamic fields in criteria JSON field
        if review_data.additional_fields:
            review_dict["criteria"] = review_data.additional_fields
        
        # Create the review directly in database (bypassing service for debugging)
        logger.info("Creating review directly with SQLAlchemy...")
        try:
            logger.info(f"🎯 Final review_dict before creating Review object:")
            logger.info(f"   - ratings: {review_dict['ratings']}")
            logger.info(f"   - criteria: {review_dict.get('criteria', {})}")
            
            new_review = Review(
                entity_id=review_data.entity_id,
                user_id=current_user.user_id,
                title=review_dict["title"],
                content=review_dict["content"],
                overall_rating=review_dict["overall_rating"],
                pros=review_dict["pros"],
                cons=review_dict["cons"],
                images=review_dict["images"],
                is_anonymous=review_dict["is_anonymous"],
                ratings=review_dict["ratings"],
                created_at=datetime.now(timezone.utc)
            )
            
            logger.info(f"🎯 Created Review object:")
            logger.info(f"   - new_review.ratings: {new_review.ratings}")
            
            logger.info(f"Review object created: {new_review}")
            db.add(new_review)
            logger.info("Review added to database session")
            db.commit()
            logger.info("Review committed to database")
            db.refresh(new_review)
            logger.info(f"Review refreshed with ID: {new_review.review_id}")
            
        except Exception as db_error:
            logger.error(f"Direct database creation failed: {str(db_error)}")
            logger.error(f"Error type: {type(db_error)}")
            logger.error(f"Review data: {review_dict}")
            db.rollback()
            raise db_error
        
        # Verify the review was saved by querying it back
        saved_review = db.query(Review).filter(Review.review_id == new_review.review_id).first()
        if saved_review:
            logger.info(f"Review successfully saved with ID: {saved_review.review_id}")
        else:
            logger.error(f"Review with ID {new_review.review_id} not found after creation!")
        
        # Update entity's average rating and review count
        entity_reviews = db.query(Review).filter(Review.entity_id == review_data.entity_id).all()
        if entity_reviews:
            total_rating = sum(review.overall_rating for review in entity_reviews)
            entity.average_rating = total_rating / len(entity_reviews)
            entity.review_count = len(entity_reviews)
            db.commit()
        
        # Prepare response data
        review_response = {
            "review_id": new_review.review_id,
            "entity_id": new_review.entity_id,
            "user_id": new_review.user_id,
            "title": new_review.title,
            "content": new_review.content,
            "overall_rating": new_review.overall_rating,
            "ratings": new_review.ratings or {},
            "pros": new_review.pros,
            "cons": new_review.cons,
            "images": new_review.images or [],
            "is_anonymous": new_review.is_anonymous,
            "created_at": new_review.created_at.isoformat() if new_review.created_at else None,
            "entity": {
                "name": entity.name,
                "avatar": entity.avatar
            }
        }
        
        logger.info(f"🎯 Review response being sent to frontend:")
        logger.info(f"   - ratings in response: {review_response['ratings']}")
        
        # Final verification - query all reviews to see if our review exists
        all_reviews = db.query(Review).all()
        logger.info(f"Total reviews in database after creation: {len(all_reviews)}")
        
        return api_response(
            data=review_response,
            message="Review created successfully"
        )
        
    except Exception as e:
        logger.error(f"Error creating review: {str(e)}")
        logger.error(traceback.format_exc())
        return error_response(
            message=f"Failed to create review: {str(e)}",
            status_code=500,
            error_code="REVIEW_CREATION_ERROR"
        )

@router.get("/recent", response_model=None)
def get_recent_reviews(
    limit: int = Query(5, ge=1, le=100, description="Number of recent reviews to fetch"),
    db: Session = Depends(get_db),
    current_user: CurrentUser = None
):
    """Get the most recent reviews."""
    try:
        query = db.query(Review).options(
            joinedload(Review.entity),
            joinedload(Review.user),
            selectinload(Review.comments).joinedload(Comment.user)
        ).order_by(desc(Review.created_at))
        
        reviews = query.limit(limit).all()
        
        # Build response
        review_responses = []
        for r in reviews:
            # Get entity info
            entity_info = None
            if r.entity:
                entity_info = ReviewEntityInfo(
                    entity_id=r.entity.entity_id,
                    name=r.entity.name,
                    average_rating=r.entity.average_rating,
                    review_count=getattr(r.entity, 'review_count', 0)
                )
            
            # Get user info
            user_info = None
            if r.user:
                user_info = ReviewUserInfo(
                    user_id=r.user.user_id,
                    name=r.user.name,
                    avatar=r.user.avatar
                )
            
            # Get reaction summary
            current_user_id = getattr(current_user, 'user_id', None)
            reaction_summary = get_reaction_summary_response(r.review_id, db, current_user_id)
            
            # Get latest comments (limit to 3 for recent reviews)
            comment_objs = sorted(r.comments, key=lambda c: c.created_at, reverse=True)[:3]
            comment_responses = []
            for comment in comment_objs:
                comment_reaction_summary = get_comment_reaction_summary_response(comment.comment_id, db, getattr(current_user, 'user_id', None))
                comment_response = CommentResponse(
                    comment_id=comment.comment_id,
                    review_id=comment.review_id,
                    user_id=comment.user_id,
                    user_name=comment.user.name if comment.user else "Anonymous",
                    user_avatar=comment.user.avatar if comment.user else None,
                    content=comment.content,
                    created_at=comment.created_at,
                    likes=comment.reaction_count or 0,  # Use reaction_count instead of likes
                    reactions=comment_reaction_summary["reactions"],
                    user_reaction=comment_reaction_summary["user_reaction"]
                )
                comment_responses.append(comment_response)
            
            # Debug: Log what's in the database for this review (recent reviews)
            logger.info(f"🎯 Recent Review {r.review_id} from database:")
            logger.info(f"   - r.ratings: {r.ratings}")
            
            # Create review response
            review_response = ReviewResponse(
                review_id=r.review_id,
                entity_id=r.entity_id,
                user_id=r.user_id,
                reviewer_name=r.user.name if r.user else "Anonymous",
                reviewer_username=r.user.username if r.user else None,
                reviewer_avatar=r.user.avatar if r.user else None,
                title=r.title,
                content=r.content,
                overall_rating=r.overall_rating,
                price_rating=getattr(r, 'price_rating', None),
                quality_rating=getattr(r, 'quality_rating', None),
                service_rating=getattr(r, 'service_rating', None),
                ratings=r.ratings or {},
                pros=r.pros or [],
                cons=r.cons or [],
                images=r.images or [],
                is_anonymous=r.is_anonymous,
                is_verified=r.is_verified,
                is_flagged=False,
                view_count=r.view_count or 0,
                reactions=reaction_summary.get('reactions', {}),
                user_reaction=reaction_summary.get('user_reaction'),
                top_reactions=reaction_summary.get('top_reactions', []),
                total_reactions=reaction_summary.get('total', 0),
                created_at=r.created_at,
                updated_at=r.updated_at,
                entity=entity_info,
                user=user_info,
                comments=comment_responses
            )
            review_responses.append(review_response)
        
        return api_response(
            data={
                "reviews": [json.loads(review.model_dump_json()) for review in review_responses],
                "total": len(review_responses)
            },
            message=f"Successfully retrieved {len(review_responses)} recent reviews"
        )
        
    except Exception as e:
        logger.error(f"Error in get_recent_reviews: {str(e)}")
        logger.error(traceback.format_exc())
        return error_response(
            message=f"Failed to retrieve recent reviews: {str(e)}",
            status_code=500,
            error_code="RECENT_REVIEWS_ERROR"
        )

@router.get("/", response_model=None)
def get_reviews(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    entity_id: Optional[int] = Query(None, description="Filter by entity ID"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    rating: Optional[float] = Query(None, description="Filter by minimum rating"),
    sort_by: Optional[str] = Query("created_at", description="Sort field"),
    sort_order: Optional[str] = Query("desc", description="Sort order"),
    verified: Optional[bool] = Query(None, description="Filter by verification status"),
    db: Session = Depends(get_db),
    current_user: CurrentUser = None
):
    """Get a list of reviews with pagination and filtering."""
    try:
        query = db.query(Review)
        
        # Apply filters
        if entity_id:
            query = query.filter(Review.entity_id == entity_id)
        if user_id:
            query = query.filter(Review.user_id == user_id)
        if rating:
            query = query.filter(Review.overall_rating >= rating)
        if verified is not None:
            query = query.filter(Review.is_verified == verified)
        
        # PERFORMANCE FIX: Avoid expensive count() for pagination
        # Instead, use limit+1 to determine if there are more records
        query_with_extra = query.limit(limit + 1)
        
        # Get one extra record to check if there are more
        total = None  # We'll calculate this more efficiently
        
        # Sorting
        sort_col = getattr(Review, sort_by, Review.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_col))
        else:
            query = query.order_by(asc(sort_col))
        
        
        # PERFORMANCE FIX: Efficient pagination without count()
        offset = (page - 1) * limit
        
        # Apply sorting and eager loading to the main query
        query = query.options(
            joinedload(Review.entity),  # Load entity data in single query
            joinedload(Review.user),    # Load user data in single query
            selectinload(Review.comments).joinedload(Comment.user)  # Load comments and their users efficiently
        )
        
        # Get limit+1 records to determine if there are more
        reviews_with_extra = query.offset(offset).limit(limit + 1).all()
        
        # Check if there are more records
        has_more = len(reviews_with_extra) > limit
        reviews = reviews_with_extra[:limit]  # Take only the requested amount
        
        # For total count, use an efficient approach
        if page == 1 and not has_more:
            # If it's the first page and no more records, total is len(reviews)
            total = len(reviews)
        else:
            # For other cases, we'll provide an estimated total or skip it
            # This is much faster than query.count() for large datasets
            total = (page - 1) * limit + len(reviews) + (1 if has_more else 0)
        
        # Join entity and user info for each review
        review_responses = []
        for r in reviews:
            # Get entity info
            entity = r.entity
            entity_info = None
            if entity:
                entity_info = ReviewEntityInfo(
                    entity_id=entity.entity_id,
                    name=entity.name,
                    average_rating=entity.average_rating,
                    review_count=entity.review_count
                )
            
            # Get user info
            user = r.user
            user_info = None
            if user:
                user_info = ReviewUserInfo(
                    user_id=user.user_id,
                    name=user.name,
                    avatar=user.avatar
                )
            
            # Get reaction summary for this review and user
            reaction_summary = get_reaction_summary_response(r.review_id, db, getattr(current_user, 'user_id', None))
            
            # Get latest comments for this review (already loaded via selectinload)
            comment_objs = sorted(r.comments, key=lambda c: c.created_at, reverse=True)[:5]
            comment_responses = []
            for comment in comment_objs:
                comment_reaction_summary = get_comment_reaction_summary_response(comment.comment_id, db, getattr(current_user, 'user_id', None))
                comment_response = CommentResponse(
                    comment_id=comment.comment_id,
                    review_id=comment.review_id,
                    user_id=comment.user_id,
                    user_name=comment.user.name if comment.user else "Anonymous",
                    user_avatar=comment.user.avatar if comment.user else None,
                    content=comment.content,
                    created_at=comment.created_at,
                    likes=comment.reaction_count or 0,  # Use reaction_count instead of likes
                    reactions=comment_reaction_summary["reactions"],
                    user_reaction=comment_reaction_summary["user_reaction"]
                )
                comment_responses.append(comment_response)
            
            # Debug: Log what's in the database for this review
            logger.info(f"🎯 Review {r.review_id} from database:")
            logger.info(f"   - r.ratings: {r.ratings}")
            logger.info(f"   - ratings type: {type(r.ratings)}")
            
            # Create review response
            review_response = ReviewResponse(
                review_id=r.review_id,
                entity_id=r.entity_id,
                user_id=r.user_id,
                reviewer_name=user.name if user else "Anonymous",
                reviewer_username=user.username if user else None,
                reviewer_avatar=user.avatar if user else None,
                title=r.title,
                content=r.content,
                overall_rating=r.overall_rating,
                price_rating=getattr(r, 'price_rating', None),
                quality_rating=getattr(r, 'quality_rating', None),
                service_rating=getattr(r, 'service_rating', None),
                ratings=r.ratings or {},
                pros=r.pros or [],
                cons=r.cons or [],
                images=r.images or [],
                is_anonymous=r.is_anonymous,
                is_verified=r.is_verified,
                is_flagged=False,  # TODO: Implement flag logic
                view_count=r.view_count or 0,
                comment_count=r.comment_count or 0,
                reactions=reaction_summary.get('reactions', {}),
                user_reaction=reaction_summary.get('user_reaction'),
                top_reactions=reaction_summary.get('top_reactions', []),
                total_reactions=reaction_summary.get('total', 0),
                created_at=r.created_at,
                updated_at=r.updated_at,
                entity=entity_info,
                user=user_info,
                comments=comment_responses
            )
            review_responses.append(review_response)
        
        # Create efficient paginated response (no expensive page calculation)
        result = {
            "reviews": [json.loads(review.model_dump_json()) for review in review_responses],
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total // limit) + (1 if total % limit else 0) if total is not None else None,
            "has_more": has_more  # Frontend can use this instead of calculating pages
        }
        
        return api_response(
            data=result,
            message=f"Successfully retrieved {len(review_responses)} reviews"
        )
        
    except Exception as e:
        logger.error(f"Error in get_reviews: {str(e)}")
        logger.error(traceback.format_exc())
        return error_response(
            message=f"Failed to retrieve reviews: {str(e)}",
            status_code=500,
            error_code="REVIEW_RETRIEVAL_ERROR"
        )

@router.get("/{review_id}/comments/count")
def get_review_comment_count(
    review_id: int,
    db: Session = Depends(get_db)
):
    """Get the total number of comments for a review"""
    # Verify review exists
    review = db.query(Review).filter(Review.review_id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    count = db.query(Comment).filter(Comment.review_id == review_id).count()
    return api_response(data={"count": count}, message="Comment count retrieved successfully")

@router.get("/{review_id}/comments")
def get_review_comments(
    review_id: int,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(8, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("most_relevant", description="Sort by: most_relevant, newest, oldest, most_liked"),
    db: Session = Depends(get_db),
    current_user: CurrentUser = None
):
    """Get paginated comments for a review."""
    try:
        # Verify review exists
        review = db.query(Review).filter(Review.review_id == review_id).first()
        if not review:
            return JSONResponse(status_code=404, content={"detail": "Review not found"})

        query = db.query(Comment).options(joinedload(Comment.user)).filter(Comment.review_id == review_id)
        total = query.count()

        # Sorting
        if sort_by == "newest":
            query = query.order_by(desc(Comment.created_at))
        elif sort_by == "oldest":
            query = query.order_by(asc(Comment.created_at))
        elif sort_by == "most_liked":
            query = query.order_by(desc(Comment.reaction_count), desc(Comment.created_at))
        else:  # most_relevant or fallback
            query = query.order_by(desc(Comment.reaction_count), desc(Comment.created_at))

        # Pagination
        offset = (page - 1) * limit
        comments = query.offset(offset).limit(limit).all()

        comment_responses = []
        for comment in comments:
            comment_user = comment.user  # Use preloaded relationship
            comment_reaction_summary = get_comment_reaction_summary_response(comment.comment_id, db, getattr(current_user, 'user_id', None))
            comment_response = CommentResponse(
                comment_id=comment.comment_id,
                review_id=comment.review_id,
                user_id=comment.user_id,
                user_name=comment_user.display_name or comment_user.username if comment_user else "Anonymous",
                user_avatar=comment_user.avatar if comment_user else None,
                content=comment.content,
                created_at=comment.created_at,
                likes=comment.reaction_count or 0,
                reactions=comment_reaction_summary["reactions"],
                user_reaction=comment_reaction_summary["user_reaction"]
            )
            comment_responses.append(comment_response)

        return api_response(
            data={
                "comments": [c.model_dump(mode='json') for c in comment_responses],
                "total": total,
                "page": page,
                "limit": limit,
                "pages": (total // limit) + (1 if total % limit else 0)
            },
            message="Comments retrieved successfully"
        )
    except Exception as e:
        import traceback
        print(f"Error in get_review_comments: {str(e)}")
        print(traceback.format_exc())
        return error_response(
            message=f"Failed to get comments: {str(e)}",
            status_code=500
        )

@router.post("/{review_id}/comments", tags=["Review Comments"])
async def create_comment(
    review_id: int,
    comment_request: CommentRequest,
    current_user: RequiredUser,
    db: Session = Depends(get_db)
):
    """Create a new comment on a review."""
    try:
        # Check if review exists
        review = db.query(Review).filter(Review.review_id == review_id).first()
        if not review:
            return error_response(
                message="Review not found",
                status_code=404
            )
        
        # Create new comment
        comment = Comment(
            review_id=review_id,
            user_id=current_user.user_id,
            content=comment_request.content,
            is_anonymous=False,
            is_verified=False,
            reaction_count=0,
            helpful_votes=0
        )
        
        db.add(comment)
        db.commit()
        db.refresh(comment)
        
        # 🔔 TRIGGER NOTIFICATION: Comment created
        try:
            from services.notification_trigger_service_enterprise import NotificationTriggerService
            trigger_service = NotificationTriggerService(db)
            await trigger_service.trigger_comment_notifications(comment, action='created')
            logger.info(f"✅ Notification triggered for comment {comment.comment_id} on review {review_id}")
        except Exception as notification_error:
            logger.warning(f"⚠️ Failed to trigger notification for comment {comment.comment_id}: {notification_error}")
            # Don't fail the request if notification fails
        
        # Get comment user info for response
        comment_user = db.query(User).filter(User.user_id == comment.user_id).first()
        comment_reaction_summary = get_comment_reaction_summary_response(comment.comment_id, db, current_user.user_id)
        
        # Create response
        comment_response = CommentResponse(
            comment_id=comment.comment_id,
            review_id=comment.review_id,
            user_id=comment.user_id,
            user_name=comment_user.display_name or comment_user.username if comment_user else "Anonymous",
            user_avatar=comment_user.avatar if comment_user else None,
            content=comment.content,
            created_at=comment.created_at,
            likes=comment.reaction_count or 0,
            reactions=comment_reaction_summary["reactions"],
            user_reaction=comment_reaction_summary["user_reaction"]
        )
        
        return api_response(
            data=comment_response.model_dump(mode='json'),
            message="Comment created successfully"
        )
        
    except Exception as e:
        logger.error(f"Error creating comment for review {review_id}: {str(e)}")
        return error_response(
            message=f"Failed to create comment: {str(e)}",
            status_code=500
        )

@router.post("/{review_id}/view")
async def track_view(
    review_id: int, 
    request: Request,
    db: Session = Depends(get_db),
    current_user: CurrentUser = None
):
    """Track a view for a review using enterprise-grade view tracking."""
    try:
        # Get the review to find the entity_id
        review = db.query(Review).filter(Review.review_id == review_id).first()
        if not review:
            return error_response(message="Review not found", status_code=404)
        
        # Extract client information
        client_ip = request.client.host
        user_agent = request.headers.get("user-agent", "")
        
        # Create a new view record - database triggers will handle count updates automatically
        from models.view_tracking import ReviewView
        from datetime import datetime, timedelta
        import uuid
        
        # Generate session ID if not provided
        session_id = request.headers.get("x-session-id", str(uuid.uuid4()))
        
        # Check for duplicate view in the last 30 minutes (anti-spam)
        recent_view = db.query(ReviewView).filter(
            ReviewView.review_id == review_id,
            ReviewView.ip_address == client_ip,
            ReviewView.viewed_at > datetime.utcnow() - timedelta(minutes=30)
        ).first()
        
        if not recent_view:
            # Create new view record
            view = ReviewView(
                review_id=review_id,
                user_id=current_user.user_id if current_user else None,
                ip_address=client_ip,
                user_agent=user_agent,
                session_id=session_id,
                viewed_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(days=30),  # Views expire after 30 days
                is_valid=True,
                is_unique_user=current_user is not None,
                is_unique_session=True
            )
            db.add(view)
        
        # Record entity view if user is authenticated
        if current_user:
            existing_entity_view = db.query(UserEntityView).filter(
                UserEntityView.user_id == current_user.user_id,
                UserEntityView.entity_id == review.entity_id
            ).first()
            
            if not existing_entity_view:
                entity_view = UserEntityView(
                    user_id=current_user.user_id,
                    entity_id=review.entity_id
                )
                db.add(entity_view)
        
        db.commit()
        
        # Get updated view count from database (updated by trigger)
        db.refresh(review)
        
        return api_response(data={
            "status": "view_tracked", 
            "view_count": review.view_count, 
            "incremented": not bool(recent_view),
            "is_duplicate": bool(recent_view)
        })
    
    except Exception as e:
        logger.error(f"Error tracking view for review {review_id}: {str(e)}")
        return error_response(
            message="Failed to track view",
            status_code=500
        )

@router.get("/search", response_model=None, tags=["Review Search"])
def search_reviews(
    q: str = Query(..., description="Search query"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    entity_id: Optional[int] = Query(None, description="Filter by entity ID"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    rating: Optional[float] = Query(None, description="Filter by minimum rating"),
    start_date: Optional[str] = Query(None, description="Start date for filtering"),
    end_date: Optional[str] = Query(None, description="End date for filtering"),
    db: Session = Depends(get_db),
    current_user: CurrentUser = None
):
    """Search reviews with text query and filters."""
    try:
        # Base query with search
        query = db.query(Review).filter(
            Review.content.ilike(f'%{q}%') | 
            Review.title.ilike(f'%{q}%')
        )
        
        # Apply filters
        if entity_id:
            query = query.filter(Review.entity_id == entity_id)
        if user_id:
            query = query.filter(Review.user_id == user_id)
        if category:
            query = query.filter(Review.category == category)
        if rating:
            query = query.filter(Review.overall_rating >= rating)
        if start_date:
            query = query.filter(Review.created_at >= start_date)
        if end_date:
            query = query.filter(Review.created_at <= end_date)
        
        # PERFORMANCE FIX: Avoid expensive count() in search
        offset = (page - 1) * limit
        
        # Get limit+1 to determine if there are more results
        reviews_with_extra = query.order_by(desc(Review.created_at)).offset(offset).limit(limit + 1).all()
        
        # Check if there are more records and calculate efficient total
        has_more = len(reviews_with_extra) > limit
        reviews = reviews_with_extra[:limit]
        
        # Efficient total calculation for search
        if page == 1 and not has_more:
            total = len(reviews)
        else:
            total = (page - 1) * limit + len(reviews) + (1 if has_more else 0)
        
        # Build response
        review_responses = []
        for r in reviews:
            # Get reaction summary
            reaction_summary = get_reaction_summary_response(r.review_id, db, getattr(current_user, 'user_id', None))
            
            review_response = ReviewResponse(
                review_id=r.review_id,
                entity_id=r.entity_id,
                user_id=r.user_id,
                reviewer_name=r.user.name if r.user else "Anonymous",
                reviewer_username=r.user.username if r.user else None,
                reviewer_avatar=r.user.avatar if r.user else None,
                title=r.title,
                content=r.content,
                overall_rating=r.overall_rating,
                ratings=r.ratings or {},
                pros=r.pros or [],
                cons=r.cons or [],
                images=r.images or [],
                is_anonymous=r.is_anonymous,
                is_verified=r.is_verified,
                view_count=r.view_count or 0,
                reactions=reaction_summary.get('reactions', {}),
                user_reaction=reaction_summary.get('user_reaction'),
                top_reactions=reaction_summary.get('top_reactions', []),
                total_reactions=reaction_summary.get('total', 0),
                created_at=r.created_at,
                updated_at=r.updated_at,
                entity=ReviewEntityInfo(
                    entity_id=r.entity.entity_id,
                    name=r.entity.name,
                    average_rating=r.entity.average_rating
                ) if r.entity else None,
                user=ReviewUserInfo(
                    user_id=r.user.user_id,
                    name=r.user.name,
                    avatar=r.user.avatar
                ) if r.user else None,
                comments=[]
            )
            review_responses.append(review_response)
        
        result = {
            "reviews": [json.loads(review.model_dump_json()) for review in review_responses],
            "total": total,
            "hasMore": has_more  # Use the efficient has_more flag instead of calculation
        }
        
        return api_response(
            data=result,
            message=f"Found {total} reviews matching '{q}'"
        )
        
    except Exception as e:
        logger.error(f"Error searching reviews: {str(e)}")
        logger.error(traceback.format_exc())
        return error_response(
            message=f"Search failed: {str(e)}",
            status_code=500,
            error_code="REVIEW_SEARCH_ERROR"
        )

# Comment Reaction Endpoints
@router.post("/comments/{comment_id}/react", tags=["Comment Reactions"])
async def add_comment_reaction(
    comment_id: int,
    reaction_request: ReactionRequest,
    current_user: RequiredUser,
    db: Session = Depends(get_db)
):
    """Add or update a reaction to a comment."""
    try:
        # Check if comment exists
        comment = db.query(Comment).filter(Comment.comment_id == comment_id).first()
        if not comment:
            return error_response(message="Comment not found", status_code=404)
        
        # Check if user already has a reaction for this comment
        existing_reaction = db.query(CommentReaction).filter(
            CommentReaction.comment_id == comment_id,
            CommentReaction.user_id == current_user.user_id
        ).first()
        
        if existing_reaction:
            # Update existing reaction
            existing_reaction.reaction_type = CommentReactionType(reaction_request.reaction_type)
            existing_reaction.updated_at = func.now()
        else:
            # Create new reaction
            reaction = CommentReaction(
                comment_id=comment_id,
                user_id=current_user.user_id,
                reaction_type=CommentReactionType(reaction_request.reaction_type)
            )
            db.add(reaction)
        
        db.commit()
        
        # 🔔 TRIGGER NOTIFICATION: Comment reaction added
        try:
            from services.notification_trigger_service_enterprise import NotificationTriggerService
            trigger_service = NotificationTriggerService(db)
            await trigger_service.trigger_reaction_notifications(
                target_type='comment',
                target_id=comment_id,
                reactor_user_id=current_user.user_id,
                reaction_type=reaction_request.reaction_type,
                action='added'
            )
            logger.info(f"✅ Notification triggered for comment {comment_id} reaction: {reaction_request.reaction_type}")
        except Exception as notification_error:
            logger.warning(f"⚠️ Failed to trigger notification for comment reaction: {notification_error}")
            # Don't fail the request if notification fails
        
        # Get updated reaction summary
        reaction_summary = get_comment_reaction_summary_response(comment_id, db, current_user.user_id)
        
        return api_response(
            data=reaction_summary,
            message="Reaction updated successfully"
        )
        
    except Exception as e:
        logger.error(f"Error updating comment reaction {comment_id}: {str(e)}")
        return error_response(
            message=f"Failed to update reaction: {str(e)}",
            status_code=500
        )

@router.delete("/comments/{comment_id}/react", tags=["Comment Reactions"])
async def remove_comment_reaction(
    comment_id: int,
    current_user: RequiredUser,
    db: Session = Depends(get_db)
):
    """Remove a reaction from a comment."""
    try:
        # Check if comment exists
        comment = db.query(Comment).filter(Comment.comment_id == comment_id).first()
        if not comment:
            return error_response(message="Comment not found", status_code=404)
        
        # Find existing reaction
        existing_reaction = db.query(CommentReaction).filter(
            CommentReaction.comment_id == comment_id,
            CommentReaction.user_id == current_user.user_id
        ).first()
        
        if existing_reaction:
            db.delete(existing_reaction)
            db.commit()
        
        # Get updated reaction summary
        reaction_summary = get_comment_reaction_summary_response(comment_id, db, current_user.user_id)
        
        return api_response(
            data=reaction_summary,
            message="Reaction removed successfully"
        )
        
    except Exception as e:
        logger.error(f"Error removing comment reaction {comment_id}: {str(e)}")
        return error_response(
            message=f"Failed to remove reaction: {str(e)}",
            status_code=500
        )

@router.get("/comments/{comment_id}/react", tags=["Comment Reactions"])
async def get_comment_reactions(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = None
):
    """Get reaction summary for a comment."""
    try:
        # Check if comment exists
        comment = db.query(Comment).filter(Comment.comment_id == comment_id).first()
        if not comment:
            return error_response(message="Comment not found", status_code=404)
        
        # Get reaction summary
        reaction_summary = get_comment_reaction_summary_response(
            comment_id, 
            db, 
            getattr(current_user, 'user_id', None)
        )
        
        return api_response(data=reaction_summary)
        
    except Exception as e:
        logger.error(f"Error getting comment reactions {comment_id}: {str(e)}")
        return error_response(
            message=f"Failed to get reactions: {str(e)}",
            status_code=500
        )

@router.post("/{review_id}/react", tags=["Review Reactions"])
async def add_or_update_reaction(
    review_id: int,
    reaction_request: ReactionRequest,
    current_user: RequiredUser,
    db: Session = Depends(get_db)
):
    """Add or update a reaction for a review by the current user."""
    logger.info(f"🎯 REACTION ENDPOINT CALLED: review_id={review_id}")
    logger.info(f"🎯 Request data: {reaction_request}")
    logger.info(f"🎯 Current user type: {type(current_user)}")
    
    # Add a simple test log to see if we reach here
    print(f"🔍 DEBUG: Reaction endpoint called for review {review_id}")
    
    try:
        logger.info(f"🚀 Adding reaction for review {review_id} by user {current_user.user_id}")
        logger.info(f"📝 Reaction type: {reaction_request.reaction_type}")
        logger.info(f"👤 Current user: {current_user.username} (ID: {current_user.user_id})")
        # Validate reaction type
        try:
            reaction_type = ReviewReactionType(reaction_request.reaction_type)
        except ValueError:
            return error_response(
                message=f"Invalid reaction type: {reaction_request.reaction_type}",
                status_code=400
            )
        
        # Check if review exists
        review = db.query(Review).filter(Review.review_id == review_id).first()
        if not review:
            return error_response(
                message="Review not found",
                status_code=404
            )
        
        # Remove existing reaction if any
        existing = db.query(ReviewReaction).filter_by(
            review_id=review_id, 
            user_id=current_user.user_id
        ).first()
        
        if existing:
            existing.reaction_type = reaction_type
        else:
            # Debug logging for user_id issue
            logger.info(f"🔍 Creating reaction: user_id={current_user.user_id} (type: {type(current_user.user_id)}), review_id={review_id}, reaction_type={reaction_type}")
            reaction = ReviewReaction(
                review_id=review_id,
                user_id=current_user.user_id,
                reaction_type=reaction_type
            )
            db.add(reaction)
        
        try:
            db.commit()
            if not existing:
                db.refresh(reaction)
            logger.info(f"✅ Successfully committed reaction for review {review_id}")
        except IntegrityError as e:
            db.rollback()
            logger.error(f"💥 IntegrityError in add_or_update_reaction: {e}")
            logger.error(f"🔍 Error details: review_id={review_id}, user_id={current_user.user_id}, reaction_type={reaction_type}")
            return error_response(
                message=f"Could not add reaction: {str(e)}",
                status_code=500
            )
        except Exception as db_error:
            db.rollback()
            logger.error(f"💥 Database error in add_or_update_reaction: {db_error}")
            logger.error(f"🔍 Error details: review_id={review_id}, user_id={current_user.user_id}, reaction_type={reaction_type}")
            return error_response(
                message=f"Database error: {str(db_error)}",
                status_code=500
            )
        
        # 🔔 TRIGGER NOTIFICATION: Review reaction added
        try:
            from services.notification_trigger_service_enterprise import NotificationTriggerService
            trigger_service = NotificationTriggerService(db)
            reaction_type_str = reaction_type.value if hasattr(reaction_type, 'value') else str(reaction_type)
            await trigger_service.trigger_reaction_notifications(
                target_type='review',
                target_id=review_id,
                reactor_user_id=current_user.user_id,
                reaction_type=reaction_type_str,
                action='added'
            )
            logger.info(f"✅ Notification triggered for review {review_id} reaction: {reaction_type_str}")
        except Exception as notification_error:
            logger.warning(f"⚠️ Failed to trigger notification for reaction: {notification_error}")
            # Don't fail the request if notification fails
        
        # ✅ DATABASE TRIGGERS: Count updates are now handled automatically by database triggers
        # This provides better consistency, performance, and eliminates race conditions
        logger.info(f"✅ Reaction processed for review {review_id} - counts updated by database triggers")
        
        # Return updated reaction summary
        reaction_summary = get_reaction_summary_response(review_id, db, current_user.user_id)
        
        # Cache invalidation handled by standard cache service
        try:
            await cache_service.delete(f"review_reactions_{review_id}")
            if review.user_id:
                await cache_service.delete(f"user_reviews_{review.user_id}")
                logger.info(f"Cache invalidated for user {review.user_id} after reaction update")
        except Exception as cache_error:
            logger.warning(f"Failed to invalidate cache after reaction update: {cache_error}")
            # Don't fail the request if cache invalidation fails
        
        return api_response(data=reaction_summary)
        
    except Exception as e:
        logger.error(f"💥 CRITICAL ERROR adding reaction to review {review_id}: {str(e)}")
        logger.error(f"🔍 Exception type: {type(e)}")
        logger.error(f"🔍 User ID: {getattr(current_user, 'user_id', 'UNKNOWN')}")
        logger.error(f"🔍 Reaction type: {getattr(reaction_request, 'reaction_type', 'UNKNOWN')}")
        traceback.print_exc()
        return error_response(
            message=f"Failed to add reaction: {str(e)}",
            status_code=500
        )

@router.get("/test-reaction-endpoint", tags=["Test"])
async def test_reaction_endpoint():
    """Test endpoint to verify the router is working."""
    return {"message": "Reaction router is working!", "status": "success"}

@router.post("/debug-reaction-test", tags=["Test"])
async def debug_reaction_test():
    """Test endpoint to debug reaction API without auth."""
    logger.info("🧪 DEBUG: Test reaction endpoint called!")
    print("🧪 DEBUG: Test reaction endpoint called!")
    return {"message": "Debug endpoint working!", "status": "success"}

@router.get("/unprotected-test", tags=["Test"])  
async def unprotected_test():
    """Completely unprotected test endpoint."""
    logger.info("🔓 UNPROTECTED: Test endpoint called!")
    print("🔓 UNPROTECTED: Test endpoint called!")
    return {"message": "Unprotected endpoint working!", "status": "success"}

@router.post("/simple-auth-test", tags=["Test"])
async def simple_auth_test(current_user: RequiredUser):
    """Simple test with authentication to isolate the auth issue."""
    logger.info(f"🔑 AUTH TEST: User {current_user.user_id} authenticated successfully")
    print(f"🔑 AUTH TEST: User {current_user.user_id} authenticated successfully")
    return {
        "message": "Authentication working!", 
        "user_id": current_user.user_id,
        "username": current_user.username
    }

@router.post("/minimal-reaction-test/{review_id}", tags=["Test"])
async def minimal_reaction_test(
    review_id: int,
    current_user: RequiredUser
):
    """Minimal reaction test without any complex logic."""
    logger.info(f"🎯 MINIMAL REACTION TEST: User {current_user.user_id} on review {review_id}")
    print(f"🎯 MINIMAL REACTION TEST: User {current_user.user_id} on review {review_id}")
    return {
        "message": "Minimal reaction test successful!", 
        "review_id": review_id,
        "user_id": current_user.user_id
    }

@router.delete("/{review_id}/react", tags=["Review Reactions"])
async def remove_reaction(
    review_id: int,
    current_user: RequiredUser,
    db: Session = Depends(get_db)
):
    """Remove the current user's reaction from a review."""
    try:
        # Check if review exists
        review = db.query(Review).filter(Review.review_id == review_id).first()
        if not review:
            return error_response(
                message="Review not found",
                status_code=404
            )
        
        # Find and remove existing reaction
        reaction = db.query(ReviewReaction).filter_by(
            review_id=review_id, 
            user_id=current_user.user_id
        ).first()
        
        if reaction:
            db.delete(reaction)
            db.commit()
            
            # ✅ DATABASE TRIGGERS: Count updates are now handled automatically by database triggers
            # This provides better consistency, performance, and eliminates race conditions
            logger.info(f"✅ Reaction removed from review {review_id} - counts updated by database triggers")
        
        # Return updated reaction summary
        reaction_summary = get_reaction_summary_response(review_id, db, current_user.user_id)
        
        # Cache invalidation handled by standard cache service
        try:
            await cache_service.delete(f"review_reactions_{review_id}")
            if review.user_id:
                await cache_service.delete(f"user_reviews_{review.user_id}")
                logger.info(f"Cache invalidated for user {review.user_id} after reaction removal")
        except Exception as cache_error:
            logger.warning(f"Failed to invalidate cache after reaction removal: {cache_error}")
        
        return api_response(data=reaction_summary)
        
    except Exception as e:
        logger.error(f"Error removing reaction from review {review_id}: {str(e)}")
        return error_response(
            message=f"Failed to remove reaction: {str(e)}",
            status_code=500
        )

@router.get("/{review_id}/reactions", tags=["Review Reactions"])
async def get_reaction_counts(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = None
):
    """Get counts of each reaction type for a review."""
    try:
        # Check if review exists
        review = db.query(Review).filter(Review.review_id == review_id).first()
        if not review:
            return error_response(
                message="Review not found",
                status_code=404
            )
        
        user_id = getattr(current_user, 'user_id', None) if current_user else None
        reaction_summary = get_reaction_summary_response(review_id, db, user_id)
        return api_response(data=reaction_summary)
        
    except Exception as e:
        logger.error(f"Error getting reactions for review {review_id}: {str(e)}")
        return error_response(
            message=f"Failed to get reactions: {str(e)}",
            status_code=500
        )

# Helper function to get reaction summary
@cache_result("reaction_summary", ttl=60)  # Cache for 1 minute
async def get_cached_reaction_summary(review_id: int, user_id: Optional[int] = None) -> dict:
    """Cached version of reaction summary for performance."""
    # This would be called from the non-cached version
    pass

def get_reaction_summary_response(review_id: int, db: Session, user_id: Optional[int] = None) -> dict:
    """Fast and simple reaction summary with user state - no complex queries."""
    try:
        # Simple approach: Two fast indexed queries
        
        # Query 1: Get reaction counts (fast with existing index)
        counts = (
            db.query(ReviewReaction.reaction_type, func.count(ReviewReaction.reaction_id))
            .filter(ReviewReaction.review_id == review_id)
            .group_by(ReviewReaction.reaction_type)
            .all()
        )
        reaction_counts = {r.value: c for r, c in counts}
        
        # Query 2: Get user's specific reaction (O(1) with unique constraint)
        user_reaction = None
        if user_id:
            user_reaction_obj = db.query(ReviewReaction.reaction_type).filter(
                ReviewReaction.review_id == review_id,
                ReviewReaction.user_id == user_id
            ).first()
            if user_reaction_obj:
                user_reaction = user_reaction_obj[0].value
        
        # Calculate derived data
        top_reactions = sorted(reaction_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        total = sum(reaction_counts.values())
        
        return {
            "reactions": reaction_counts,
            "top_reactions": [r[0] for r in top_reactions],
            "total_reactions": total,
            "total": total,
            "user_reaction": user_reaction
        }
        
    except Exception as e:
        logger.error(f"Error getting reaction summary for review {review_id}: {str(e)}")
        # Return empty state for graceful degradation
        return {
            "reactions": {},
            "top_reactions": [],
            "total_reactions": 0,
            "total": 0,
            "user_reaction": None
        }

# Shareable Review Endpoints
@router.get("/{review_id}", response_model=None, tags=["Shareable Reviews"])
async def get_review_by_id(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = None
):
    """Get a single review by ID with full context for sharing."""
    try:        
        # Query review with eager loading
        review = db.query(Review).options(
            joinedload(Review.entity),
            joinedload(Review.user),
            selectinload(Review.comments).joinedload(Comment.user)
        ).filter(Review.review_id == review_id).first()
        
        if not review:
            return error_response(
                message="Review not found",
                status_code=404,
                error_code="REVIEW_NOT_FOUND"
            )
        
        # Track view for analytics
        review.view_count += 1
        
        # Record view if user is authenticated
        if current_user:
            existing_view = db.query(UserEntityView).filter(
                UserEntityView.user_id == current_user.user_id,
                UserEntityView.entity_id == review.entity_id
            ).first()
            
            if not existing_view:
                view = UserEntityView(
                    user_id=current_user.user_id,
                    entity_id=review.entity_id
                )
                db.add(view)
        
        # Get entity info
        entity_info = None
        if review.entity:
            entity_info = ReviewEntityInfo(
                entity_id=review.entity.entity_id,
                name=review.entity.name,
                average_rating=review.entity.average_rating,
                review_count=getattr(review.entity, 'review_count', 0)
            )
        
        # Get user info
        user_info = None
        if review.user:
            user_info = ReviewUserInfo(
                user_id=review.user.user_id,
                name=review.user.name,
                avatar=review.user.avatar
            )
        
        # Get reaction summary
        reaction_summary = get_reaction_summary_response(
            review.review_id, 
            db, 
            getattr(current_user, 'user_id', None)
        )
        
        # Get comments (limit to latest 10 for sharing)
        comment_objs = sorted(review.comments, key=lambda c: c.created_at, reverse=True)[:10]
        comment_responses = []
        for comment in comment_objs:
            comment_reaction_summary = get_comment_reaction_summary_response(
                comment.comment_id, 
                db, 
                getattr(current_user, 'user_id', None)
            )
            comment_response = CommentResponse(
                comment_id=comment.comment_id,
                review_id=comment.review_id,
                user_id=comment.user_id,
                user_name=comment.user.name if comment.user else "Anonymous",
                user_avatar=comment.user.avatar if comment.user else None,
                content=comment.content,
                created_at=comment.created_at,
                likes=comment.likes or 0,
                reactions=comment_reaction_summary["reactions"],
                user_reaction=comment_reaction_summary["user_reaction"]
            )
            comment_responses.append(comment_response)
        
        # Create review response
        review_response = ReviewResponse(
            review_id=review.review_id,
            entity_id=review.entity_id,
            user_id=review.user_id,
            reviewer_name=review.user.name if review.user else "Anonymous",
            reviewer_username=review.user.username if review.user else None,
            reviewer_avatar=review.user.avatar if review.user else None,
            title=review.title,
            content=review.content,
            overall_rating=review.overall_rating,
            ratings=review.ratings or {},
            pros=review.pros or [],
            cons=review.cons or [],
            is_anonymous=review.is_anonymous,
            is_verified=review.is_verified,
            is_flagged=False,
            view_count=review.view_count or 0,
            reactions=reaction_summary.get('reactions', {}),
            user_reaction=reaction_summary.get('user_reaction'),
            top_reactions=reaction_summary.get('top_reactions', []),
            total_reactions=reaction_summary.get('total', 0),
            created_at=review.created_at,
            updated_at=review.updated_at,
            entity=entity_info,
            user=user_info,
            comments=comment_responses
        )
        
        # Generate sharing metadata
        sharing_data = {
            "share_url": f"http://localhost:5173/review/share/{review_id}",
            "meta_title": f"Review: {review.title or 'See what others are saying'}",
            "meta_description": f"{review.content[:150]}{'...' if len(review.content) > 150 else ''}",
            "meta_image": review.user.avatar if review.user and review.user.avatar else None,
            "entity_name": review.entity.name if review.entity else "Unknown Entity",
            "reviewer_name": review.user.name if review.user and not review.is_anonymous else "Anonymous User",
            "rating": review.overall_rating,
            "view_count": review.view_count
        }
        
        db.commit()
        
        return api_response(
            data={
                "review": json.loads(review_response.model_dump_json()),
                "sharing": sharing_data
            },
            message="Review retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error getting review {review_id}: {str(e)}")
        logger.error(traceback.format_exc())
        return error_response(
            message=f"Failed to retrieve review: {str(e)}",
            status_code=500,
            error_code="REVIEW_RETRIEVAL_ERROR"
        )

@router.get("/{review_id}/share-metadata", response_model=None, tags=["Shareable Reviews"])
async def get_review_share_metadata(
    review_id: int,
    db: Session = Depends(get_db)
):
    """Get metadata optimized for social media sharing (Facebook, Twitter, etc.)."""
    try:
        review = db.query(Review).options(
            joinedload(Review.entity),
            joinedload(Review.user)
        ).filter(Review.review_id == review_id).first()
        
        if not review:
            return error_response(
                message="Review not found",
                status_code=404,
                error_code="REVIEW_NOT_FOUND"
            )
        
        # Generate optimized metadata for social sharing
        entity_name = review.entity.name if review.entity else "Unknown Entity"
        reviewer_name = review.user.name if review.user and not review.is_anonymous else "Anonymous User"
        
        # Create engaging title for social media
        stars = "⭐" * int(review.overall_rating)
        title = f"{stars} {reviewer_name} reviewed {entity_name}"
        
        # Create compelling description
        description = review.content[:200] + "..." if len(review.content) > 200 else review.content
        
        # Generate share URLs for different platforms
        base_url = "http://localhost:5173"  # Development URL
        share_url = f"{base_url}/review/share/{review_id}"
        
        metadata = {
            # Open Graph (Facebook, LinkedIn)
            "og_title": title,
            "og_description": description,
            "og_url": share_url,
            "og_image": review.user.avatar if review.user and review.user.avatar else None,
            "og_type": "article",
            "og_site_name": "ReviewInn",
            
            # Twitter Card
            "twitter_card": "summary_large_image",
            "twitter_title": title,
            "twitter_description": description,
            "twitter_image": review.user.avatar if review.user and review.user.avatar else None,
            
            # General metadata
            "title": title,
            "description": description,
            "canonical_url": share_url,
            "author": reviewer_name,
            "published_time": review.created_at.isoformat(),
            "modified_time": review.updated_at.isoformat() if review.updated_at else review.created_at.isoformat(),
            
            # Review-specific data
            "entity_name": entity_name,
            "rating": review.overall_rating,
            "rating_stars": stars,
            "view_count": review.view_count or 0,
            "is_verified": review.is_verified,
            
            # Social sharing URLs
            "facebook_share": f"https://www.facebook.com/sharer/sharer.php?u={share_url}",
            "twitter_share": f"https://twitter.com/intent/tweet?url={share_url}&text={title}",
            "linkedin_share": f"https://www.linkedin.com/sharing/share-offsite/?url={share_url}",
            "whatsapp_share": f"https://wa.me/?text={title} {share_url}",
            "email_share": f"mailto:?subject={title}&body=Check out this review: {share_url}"
        }
        
        return api_response(
            data=metadata,
            message="Share metadata retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error getting share metadata for review {review_id}: {str(e)}")
        return error_response(
            message=f"Failed to retrieve share metadata: {str(e)}",
            status_code=500,
            error_code="METADATA_RETRIEVAL_ERROR"
        )

# =============================================================================
# COUNT VALIDATION AND HEALTH CHECK ENDPOINTS
# =============================================================================

@router.get("/admin/counts/health", tags=["Admin - Count Validation"])
async def get_count_health_check(
    db: Session = Depends(get_db),
    current_user: RequiredUser = None  # Add proper admin authorization later
):
    """Get a quick health check of the counting system"""
    try:
        validation_service = CountValidationService(db)
        sample_validation = validation_service.validate_sample_counts(sample_size=20)
        trigger_status = validation_service.get_trigger_status()
        
        overall_health = "healthy"
        if sample_validation.get("accuracy_percentage", 0) < 95 or trigger_status.get("health_status") != "healthy":
            overall_health = "degraded"
        if sample_validation.get("status") == "error" or trigger_status.get("health_status") == "error":
            overall_health = "error"
        
        return api_response(
            data={
                "overall_health": overall_health,
                "sample_validation": sample_validation,
                "trigger_status": trigger_status,
                "timestamp": datetime.utcnow().isoformat()
            },
            message=f"Count system health: {overall_health}"
        )
    except Exception as e:
        logger.error(f"Error in count health check: {str(e)}")
        return error_response(
            message=f"Failed to get count health: {str(e)}",
            status_code=500
        )

@router.get("/admin/counts/report", tags=["Admin - Count Validation"])
async def get_count_consistency_report(
    db: Session = Depends(get_db),
    current_user: RequiredUser = None  # Add proper admin authorization later
):
    """Get a detailed consistency report for all counts"""
    try:
        validation_service = CountValidationService(db)
        report = validation_service.get_consistency_report()
        
        return api_response(
            data=report,
            message="Count consistency report generated successfully"
        )
    except Exception as e:
        logger.error(f"Error generating consistency report: {str(e)}")
        return error_response(
            message=f"Failed to generate report: {str(e)}",
            status_code=500
        )

@router.post("/admin/counts/fix", tags=["Admin - Count Validation"])
async def fix_count_inconsistencies(
    db: Session = Depends(get_db),
    current_user: RequiredUser = None  # Add proper admin authorization later
):
    """Automatically fix all count inconsistencies"""
    try:
        validation_service = CountValidationService(db)
        result = validation_service.fix_all_inconsistencies()
        
        return api_response(
            data=result,
            message="Count inconsistencies fixed" if result.get("success") else "Failed to fix inconsistencies"
        )
    except Exception as e:
        logger.error(f"Error fixing count inconsistencies: {str(e)}")
        return error_response(
            message=f"Failed to fix inconsistencies: {str(e)}",
            status_code=500
        )

@router.get("/admin/counts/triggers", tags=["Admin - Count Validation"])
async def get_trigger_status(
    db: Session = Depends(get_db),
    current_user: RequiredUser = None  # Add proper admin authorization later
):
    """Get the status of database triggers"""
    try:
        validation_service = CountValidationService(db)
        status = validation_service.get_trigger_status()
        
        return api_response(
            data=status,
            message="Trigger status retrieved successfully"
        )
    except Exception as e:
        logger.error(f"Error getting trigger status: {str(e)}")
        return error_response(
            message=f"Failed to get trigger status: {str(e)}",
            status_code=500
        )

@router.get("/admin/counts/metrics", tags=["Admin - Count Validation"])
async def get_count_performance_metrics(
    db: Session = Depends(get_db),
    current_user: RequiredUser = None  # Add proper admin authorization later
):
    """Get performance metrics for the counting system"""
    try:
        validation_service = CountValidationService(db)
        metrics = validation_service.get_performance_metrics()
        
        return api_response(
            data=metrics,
            message="Performance metrics retrieved successfully"
        )
    except Exception as e:
        logger.error(f"Error getting performance metrics: {str(e)}")
        return error_response(
            message=f"Failed to get metrics: {str(e)}",
            status_code=500
        )
