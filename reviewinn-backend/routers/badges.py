"""
Badge Management API Endpoints
RESTful API for badge system management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Dict, Any
from database import get_db
from services.badge_service import BadgeService
from auth.production_dependencies import CurrentUser, RequiredUser
from models.user import User
from models.badge_definition import BadgeDefinition
from models.badge_award import BadgeAward
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/badges", tags=["Badges"])

# === Pydantic Models ===
class BadgeResponse(BaseModel):
    id: str
    name: str
    description: str
    tier: str
    category: str
    icon: str
    color: str
    points_value: int
    rarity_score: int
    is_repeatable: bool
    
    class Config:
        orm_mode = True

class UserBadgeResponse(BaseModel):
    award_id: int
    badge: BadgeResponse
    awarded_at: str
    award_count: int

class BadgeProgressResponse(BaseModel):
    badge: BadgeResponse
    progress_percentage: float
    current_progress: Dict[str, Any]
    requirements: Dict[str, Any]

# === API Endpoints ===

@router.get("/")
async def get_all_badges(
    db: Session = Depends(get_db)
):
    """Get all available badges"""
    badges = db.query(BadgeDefinition).order_by(BadgeDefinition.name).all()
    
    result = []
    for badge in badges:
        result.append({
            "badge_definition_id": badge.badge_definition_id,
            "name": badge.name,
            "description": badge.description,
            "image_url": badge.image_url,
            "criteria": badge.criteria
        })
    
    return result

@router.get("/user/{user_id}")
async def get_user_badges(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: RequiredUser
):
    """Get all badges earned by a specific user"""
    badge_service = BadgeService(db)
    badges = badge_service.get_user_badges(user_id)
    return badges

@router.get("/me")
async def get_my_badges(
    current_user: RequiredUser,
    db: Session = Depends(get_db)
):
    """Get badges for the current authenticated user"""
    badge_service = BadgeService(db)
    badges = badge_service.get_user_badges(current_user.user_id)
    return badges

@router.get("/available")
async def get_available_badges(
    current_user: RequiredUser,
    db: Session = Depends(get_db)
):
    """Get badges that the current user hasn't earned yet"""
    badge_service = BadgeService(db)
    badges = badge_service.get_available_badges(current_user.user_id)
    return badges

@router.post("/evaluate")
async def evaluate_badges(
    current_user: RequiredUser,
    db: Session = Depends(get_db)
):
    """Manually trigger badge evaluation for current user"""
    badge_service = BadgeService(db)
    newly_awarded = await badge_service.evaluate_user_badges(current_user.user_id)
    
    return {
        "message": f"Evaluated badges for user {current_user.user_id}",
        "newly_awarded_count": len(newly_awarded),
        "newly_awarded": newly_awarded
    }

@router.get("/tiers")
async def get_badge_tiers():
    """Get all available badge tiers and their properties"""
    return [
        {"name": "bronze", "display_name": "Bronze"},
        {"name": "silver", "display_name": "Silver"},
        {"name": "gold", "display_name": "Gold"}
    ]

@router.get("/stats")
async def get_badge_stats(
    current_user: RequiredUser,
    db: Session = Depends(get_db)
):
    """Get badge statistics for the current user"""
    # Count badges
    user_badges = db.query(BadgeAward).filter(
        BadgeAward.user_id == current_user.user_id
    ).join(BadgeDefinition).all()
    
    # Calculate total possible badges
    total_badges = db.query(BadgeDefinition).count()
    earned_badges = len(user_badges)
    
    return {
        "total_badges_earned": earned_badges,
        "total_possible_badges": total_badges,
        "completion_percentage": round((earned_badges / total_badges) * 100, 1) if total_badges > 0 else 0,
        "badges_by_tier": {"bronze": earned_badges},  # Simplified
        "total_points_from_badges": earned_badges * 10,  # Simplified
        "average_rarity_score": 1.0,
        "rarest_badge": 1
    }

# === Admin Endpoints ===

@router.post("/admin/award")
async def manually_award_badge(
    user_id: int,
    badge_definition_id: int,
    current_user: RequiredUser,
    db: Session = Depends(get_db)
):
    """Manually award a badge (admin only)"""
    # Add admin check here
    if current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    badge_service = BadgeService(db)
    award = badge_service._award_badge(user_id, badge_definition_id)
    
    if award:
        return {"message": "Badge awarded successfully", "award": {
            "award_id": award.award_id,
            "user_id": award.user_id,
            "badge_definition_id": award.badge_definition_id,
            "awarded_at": award.awarded_at.isoformat() if award.awarded_at else None
        }}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to award badge"
        )

@router.post("/admin/evaluate-all")
async def evaluate_all_users(
    current_user: RequiredUser,
    db: Session = Depends(get_db)
):
    """Evaluate badges for all users (admin only)"""
    if current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    badge_service = BadgeService(db)
    users = db.query(User).filter(User.is_active == True).all()
    
    total_awarded = 0
    for user in users:
        newly_awarded = await badge_service.evaluate_user_badges(user.user_id)
        total_awarded += len(newly_awarded)
    
    return {
        "message": "Evaluated badges for all users",
        "users_processed": len(users),
        "total_badges_awarded": total_awarded
    }

# === Frontend-compatible endpoints ===

@router.get("/user/{user_id}/progress")
async def get_user_badge_progress(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: RequiredUser
):
    """Get user's badge progress (frontend compatible)"""
    # For now, return empty array as progress tracking needs to be implemented
    return []

@router.get("/user/{user_id}/stats") 
async def get_user_badge_stats_frontend(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: RequiredUser
):
    """Get user badge statistics (frontend compatible)"""
    badge_service = BadgeService(db)
    
    # Get user badges
    user_badges = badge_service.get_user_badges(user_id)
    total_possible = db.query(BadgeDefinition).filter(BadgeDefinition.is_active == True).count()
    
    unlocked_count = len(user_badges)
    completion_percentage = (unlocked_count / total_possible * 100) if total_possible > 0 else 0
    
    return {
        "totalBadges": total_possible,
        "unlockedBadges": unlocked_count,
        "commonBadges": 0,  # Could be calculated from user badges
        "rareBadges": 0,    # Could be calculated from user badges  
        "legendaryBadges": 0, # Could be calculated from user badges
        "completionPercentage": round(completion_percentage, 2)
    }

@router.post("/user/{user_id}/check")
async def check_user_badges(
    user_id: int,
    request_data: Dict[str, Any] = {},
    db: Session = Depends(get_db),
    current_user: RequiredUser
):
    """Check for new badges for user (frontend compatible)"""
    badge_service = BadgeService(db)
    newly_awarded = await badge_service.evaluate_user_badges(user_id)
    
    return [award.to_dict() for award in newly_awarded]

@router.post("/user/{user_id}/registration")
async def unlock_registration_badge(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: RequiredUser
):
    """Unlock registration badge for new user (frontend compatible)"""
    print(f"[BADGE DEBUG] User {current_user.user_id} requesting registration badge for user {user_id}")
    
    # Check if the requesting user is the same as the target user
    if current_user.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only unlock registration badge for yourself"
        )
    # Check if user already has registration badge
    registration_badge = db.query(BadgeDefinition).filter(
        BadgeDefinition.name.ilike('%welcome%')
    ).first()
    
    print(f"[BADGE DEBUG] Found registration badge: {registration_badge.name if registration_badge else 'None'}")
    
    if not registration_badge:
        # Create a simple registration badge if none exists
        registration_badge = BadgeDefinition(
            name="Welcome Reviewer",
            description="Welcome to ReviewInn! Start your journey as a reviewer.",
            image_url="👋",
            criteria={"type": "registration"}
        )
        db.add(registration_badge)
        db.flush()
    
    # Check if user already has this badge
    existing_award = db.query(BadgeAward).filter(
        and_(
            BadgeAward.user_id == user_id,
            BadgeAward.badge_definition_id == registration_badge.badge_definition_id
        )
    ).first()
    
    if existing_award:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Badge already unlocked"
        )
    
    # Award the badge
    badge_service = BadgeService(db)
    award = badge_service._award_badge(user_id, registration_badge.badge_definition_id)
    
    if award:
        return {
            "award_id": award.award_id,
            "user_id": award.user_id,
            "badge_definition_id": award.badge_definition_id,
            "awarded_at": award.awarded_at.isoformat() if award.awarded_at else None,
            "badge": {
                "badge_definition_id": registration_badge.badge_definition_id,
                "name": registration_badge.name,
                "description": registration_badge.description,
                "image_url": registration_badge.image_url,
                "criteria": registration_badge.criteria
            }
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unlock registration badge"
        )

@router.put("/user/{user_id}/display")
async def update_badge_display_preference(
    user_id: int,
    request_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: RequiredUser
):
    """Update badge display preference (frontend compatible)"""
    # For now, just return success as display preferences need to be implemented
    return {"success": True}
