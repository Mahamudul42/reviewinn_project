"""
Badge Management API Endpoints
RESTful API for badge system management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from database import get_db
from services.badge_service import BadgeService
from core.auth_dependencies import get_current_user
from models.user import User
from models.enhanced_badge_system import BadgeDefinition, BadgeAward, BadgeTier
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

@router.get("/", response_model=List[BadgeResponse])
async def get_all_badges(
    tier: str = None,
    category: str = None,
    db: Session = Depends(get_db)
):
    """Get all available badges with optional filtering"""
    query = db.query(BadgeDefinition).filter(BadgeDefinition.is_active == True)
    
    if tier:
        query = query.filter(BadgeDefinition.tier == tier)
    if category:
        query = query.filter(BadgeDefinition.category == category)
    
    badges = query.order_by(BadgeDefinition.display_order, BadgeDefinition.name).all()
    return [badge.to_dict() for badge in badges]

@router.get("/user/{user_id}", response_model=List[UserBadgeResponse])
async def get_user_badges(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all badges earned by a specific user"""
    badge_service = BadgeService(db)
    badges = badge_service.get_user_badges(user_id)
    return badges

@router.get("/me", response_model=List[UserBadgeResponse])
async def get_my_badges(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get badges for the current authenticated user"""
    badge_service = BadgeService(db)
    badges = badge_service.get_user_badges(current_user.user_id)
    return badges

@router.get("/available", response_model=List[BadgeResponse])
async def get_available_badges(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get badges that the current user hasn't earned yet"""
    badge_service = BadgeService(db)
    badges = badge_service.get_available_badges(current_user.user_id)
    return badges

@router.post("/evaluate")
async def evaluate_badges(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually trigger badge evaluation for current user"""
    badge_service = BadgeService(db)
    newly_awarded = await badge_service.evaluate_user_badges(current_user.user_id)
    
    return {
        "message": f"Evaluated badges for user {current_user.user_id}",
        "newly_awarded_count": len(newly_awarded),
        "newly_awarded": [award.to_dict() for award in newly_awarded]
    }

@router.get("/tiers")
async def get_badge_tiers():
    """Get all available badge tiers and their properties"""
    from seeds.enhanced_badge_seed import get_badge_tier_colors
    
    tiers = []
    tier_colors = get_badge_tier_colors()
    
    for tier in BadgeTier:
        tier_info = {
            "name": tier.value,
            "display_name": tier.value.replace('_', ' ').title(),
            "colors": tier_colors.get(tier, {})
        }
        tiers.append(tier_info)
    
    return tiers

@router.get("/stats")
async def get_badge_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get badge statistics for the current user"""
    # Count badges by tier
    user_badges = db.query(BadgeAward).filter(
        BadgeAward.user_id == current_user.user_id
    ).join(BadgeDefinition).all()
    
    tier_counts = {}
    total_points_from_badges = 0
    rarity_scores = []
    
    for award in user_badges:
        tier = award.badge_definition.tier.value
        tier_counts[tier] = tier_counts.get(tier, 0) + award.award_count
        total_points_from_badges += award.badge_definition.points_value * award.award_count
        rarity_scores.append(award.badge_definition.rarity_score)
    
    # Calculate total possible badges
    total_badges = db.query(BadgeDefinition).filter(BadgeDefinition.is_active == True).count()
    earned_badges = len(set(award.badge_definition_id for award in user_badges))
    
    return {
        "total_badges_earned": earned_badges,
        "total_possible_badges": total_badges,
        "completion_percentage": round((earned_badges / total_badges) * 100, 1) if total_badges > 0 else 0,
        "badges_by_tier": tier_counts,
        "total_points_from_badges": total_points_from_badges,
        "average_rarity_score": round(sum(rarity_scores) / len(rarity_scores), 1) if rarity_scores else 0,
        "rarest_badge": max(rarity_scores) if rarity_scores else 0
    }

# === Admin Endpoints ===

@router.post("/admin/award")
async def manually_award_badge(
    user_id: int,
    badge_definition_id: int,
    current_user: User = Depends(get_current_user),
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
        return {"message": "Badge awarded successfully", "award": award.to_dict()}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to award badge"
        )

@router.post("/admin/evaluate-all")
async def evaluate_all_users(
    current_user: User = Depends(get_current_user),
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
