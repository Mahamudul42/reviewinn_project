"""
USER INTERACTIONS API ROUTER
============================
Server-side storage and synchronization of user interactions (reactions, bookmarks, etc.)
Enables cross-browser/cross-device synchronization of user state
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
import logging

from database import get_db
from auth.production_dependencies import RequiredUser
from models.user import User
from core.responses import api_response, error_response

router = APIRouter(prefix="/user-interactions", tags=["User Interactions"])
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from database import Base

class UserInteraction(Base):
    """User interaction model for cross-browser synchronization"""
    __tablename__ = "user_interactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    review_id = Column(String, nullable=False, index=True)
    
    # Interaction data (stored as separate columns for performance)
    reaction_type = Column(String, nullable=True)  # emoji reaction
    is_bookmarked = Column(Boolean, default=False)
    is_helpful = Column(Boolean, nullable=True)  # True, False, or None (not voted)
    
    # Metadata
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Ensure one interaction record per user-review pair
    __table_args__ = (
        UniqueConstraint('user_id', 'review_id', name='uix_user_review_interaction'),
    )

# ==================== API ENDPOINTS ====================

@router.get("/me")
async def get_my_interactions(
    current_user: User = Depends(RequiredUser),
    db: Session = Depends(get_db)
):
    """Get all user interactions for cross-browser synchronization"""
    try:
        interactions = db.query(UserInteraction).filter(
            UserInteraction.user_id == current_user.user_id
        ).all()
        
        # Convert to frontend format
        interaction_data = {}
        for interaction in interactions:
            interaction_data[interaction.review_id] = {
                "reviewId": interaction.review_id,
                "reaction": interaction.reaction_type,
                "isBookmarked": interaction.is_bookmarked,
                "isHelpful": interaction.is_helpful,
                "lastInteraction": interaction.updated_at.isoformat()
            }
        
        return api_response(
            data=interaction_data,
            message=f"Retrieved {len(interactions)} user interactions"
        )
        
    except Exception as e:
        logger.error(f"Error retrieving user interactions: {e}")
        return error_response(
            message="Failed to retrieve user interactions",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.get("/review/{review_id}")
async def get_review_interaction(
    review_id: str,
    current_user: User = Depends(RequiredUser),
    db: Session = Depends(get_db)
):
    """Get user interaction for a specific review"""
    try:
        interaction = db.query(UserInteraction).filter(
            UserInteraction.user_id == current_user.user_id,
            UserInteraction.review_id == review_id
        ).first()
        
        if not interaction:
            return api_response(
                data={
                    "reviewId": review_id,
                    "reaction": None,
                    "isBookmarked": False,
                    "isHelpful": None,
                    "lastInteraction": None
                },
                message="No interaction found"
            )
        
        return api_response(
            data={
                "reviewId": interaction.review_id,
                "reaction": interaction.reaction_type,
                "isBookmarked": interaction.is_bookmarked,
                "isHelpful": interaction.is_helpful,
                "lastInteraction": interaction.updated_at.isoformat()
            },
            message="User interaction retrieved"
        )
        
    except Exception as e:
        logger.error(f"Error retrieving interaction for review {review_id}: {e}")
        return error_response(
            message="Failed to retrieve interaction",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.post("/reaction")
async def update_reaction(
    request_data: Dict[str, Any],
    current_user: User = Depends(RequiredUser),
    db: Session = Depends(get_db)
):
    """Update user reaction for a review"""
    try:
        review_id = request_data.get("reviewId")
        reaction_type = request_data.get("reaction")  # Can be None to remove reaction
        
        if not review_id:
            return error_response(
                message="Review ID is required",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create interaction record
        interaction = db.query(UserInteraction).filter(
            UserInteraction.user_id == current_user.user_id,
            UserInteraction.review_id == review_id
        ).first()
        
        if not interaction:
            interaction = UserInteraction(
                user_id=current_user.user_id,
                review_id=review_id,
                reaction_type=reaction_type
            )
            db.add(interaction)
        else:
            interaction.reaction_type = reaction_type
            interaction.updated_at = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(interaction)
        
        return api_response(
            data={
                "reviewId": interaction.review_id,
                "reaction": interaction.reaction_type,
                "isBookmarked": interaction.is_bookmarked,
                "isHelpful": interaction.is_helpful,
                "lastInteraction": interaction.updated_at.isoformat()
            },
            message="Reaction updated successfully"
        )
        
    except Exception as e:
        logger.error(f"Error updating reaction: {e}")
        db.rollback()
        return error_response(
            message="Failed to update reaction",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.post("/bookmark")
async def update_bookmark(
    request_data: Dict[str, Any],
    current_user: User = Depends(RequiredUser),
    db: Session = Depends(get_db)
):
    """Update bookmark status for a review"""
    try:
        review_id = request_data.get("reviewId")
        is_bookmarked = request_data.get("isBookmarked", False)
        
        if not review_id:
            return error_response(
                message="Review ID is required",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create interaction record
        interaction = db.query(UserInteraction).filter(
            UserInteraction.user_id == current_user.user_id,
            UserInteraction.review_id == review_id
        ).first()
        
        if not interaction:
            interaction = UserInteraction(
                user_id=current_user.user_id,
                review_id=review_id,
                is_bookmarked=is_bookmarked
            )
            db.add(interaction)
        else:
            interaction.is_bookmarked = is_bookmarked
            interaction.updated_at = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(interaction)
        
        return api_response(
            data={
                "reviewId": interaction.review_id,
                "reaction": interaction.reaction_type,
                "isBookmarked": interaction.is_bookmarked,
                "isHelpful": interaction.is_helpful,
                "lastInteraction": interaction.updated_at.isoformat()
            },
            message="Bookmark updated successfully"
        )
        
    except Exception as e:
        logger.error(f"Error updating bookmark: {e}")
        db.rollback()
        return error_response(
            message="Failed to update bookmark",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.post("/helpful")
async def update_helpful_vote(
    request_data: Dict[str, Any],
    current_user: User = Depends(RequiredUser),
    db: Session = Depends(get_db)
):
    """Update helpful vote for a review"""
    try:
        review_id = request_data.get("reviewId")
        is_helpful = request_data.get("isHelpful")  # True, False, or None
        
        if not review_id:
            return error_response(
                message="Review ID is required",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create interaction record
        interaction = db.query(UserInteraction).filter(
            UserInteraction.user_id == current_user.user_id,
            UserInteraction.review_id == review_id
        ).first()
        
        if not interaction:
            interaction = UserInteraction(
                user_id=current_user.user_id,
                review_id=review_id,
                is_helpful=is_helpful
            )
            db.add(interaction)
        else:
            interaction.is_helpful = is_helpful
            interaction.updated_at = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(interaction)
        
        return api_response(
            data={
                "reviewId": interaction.review_id,
                "reaction": interaction.reaction_type,
                "isBookmarked": interaction.is_bookmarked,
                "isHelpful": interaction.is_helpful,
                "lastInteraction": interaction.updated_at.isoformat()
            },
            message="Helpful vote updated successfully"
        )
        
    except Exception as e:
        logger.error(f"Error updating helpful vote: {e}")
        db.rollback()
        return error_response(
            message="Failed to update helpful vote",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.delete("/review/{review_id}")
async def clear_review_interactions(
    review_id: str,
    current_user: User = Depends(RequiredUser),
    db: Session = Depends(get_db)
):
    """Clear all interactions for a specific review"""
    try:
        interaction = db.query(UserInteraction).filter(
            UserInteraction.user_id == current_user.user_id,
            UserInteraction.review_id == review_id
        ).first()
        
        if interaction:
            db.delete(interaction)
            db.commit()
            
        return api_response(
            data={"reviewId": review_id, "cleared": True},
            message="Review interactions cleared"
        )
        
    except Exception as e:
        logger.error(f"Error clearing interactions for review {review_id}: {e}")
        db.rollback()
        return error_response(
            message="Failed to clear interactions",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.delete("/me")
async def clear_all_interactions(
    current_user: User = Depends(RequiredUser),
    db: Session = Depends(get_db)
):
    """Clear all user interactions (useful for account deletion)"""
    try:
        deleted_count = db.query(UserInteraction).filter(
            UserInteraction.user_id == current_user.user_id
        ).delete()
        
        db.commit()
        
        return api_response(
            data={"deletedCount": deleted_count},
            message=f"Cleared {deleted_count} user interactions"
        )
        
    except Exception as e:
        logger.error(f"Error clearing all interactions: {e}")
        db.rollback()
        return error_response(
            message="Failed to clear all interactions",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ==================== UTILITY ENDPOINTS ====================

@router.get("/stats")
async def get_interaction_stats(
    current_user: User = Depends(RequiredUser),
    db: Session = Depends(get_db)
):
    """Get user interaction statistics"""
    try:
        total_interactions = db.query(UserInteraction).filter(
            UserInteraction.user_id == current_user.user_id
        ).count()
        
        reactions_count = db.query(UserInteraction).filter(
            UserInteraction.user_id == current_user.user_id,
            UserInteraction.reaction_type.isnot(None)
        ).count()
        
        bookmarks_count = db.query(UserInteraction).filter(
            UserInteraction.user_id == current_user.user_id,
            UserInteraction.is_bookmarked == True
        ).count()
        
        helpful_votes = db.query(UserInteraction).filter(
            UserInteraction.user_id == current_user.user_id,
            UserInteraction.is_helpful.isnot(None)
        ).count()
        
        return api_response(
            data={
                "totalInteractions": total_interactions,
                "reactionsGiven": reactions_count,
                "bookmarksCreated": bookmarks_count,
                "helpfulVotesGiven": helpful_votes
            },
            message="Interaction statistics retrieved"
        )
        
    except Exception as e:
        logger.error(f"Error retrieving interaction stats: {e}")
        return error_response(
            message="Failed to retrieve statistics",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )