"""
Enhanced Badge Definitions with Tiers and Complex Criteria
Comprehensive badge system seeding data
"""

from sqlalchemy.orm import Session
from models.enhanced_badge_system import BadgeDefinition, BadgeTier, BadgeCategory

def seed_enhanced_badges(db: Session):
    """Seed comprehensive badge system with tiers and categories"""
    
    badge_definitions = [
        # === VERIFICATION BADGES ===
        {
            "name": "Verified",
            "description": "Account verified by email",
            "tier": BadgeTier.STANDARD,
            "category": BadgeCategory.VERIFICATION,
            "icon": "check-circle",
            "color": "green",
            "points_value": 10,
            "rarity_score": 1,
            "criteria": {
                "type": "simple",
                "verified": True
            }
        },
        
        # === REVIEW ACTIVITY BADGES ===
        {
            "name": "First Review",
            "description": "Posted your first review",
            "tier": BadgeTier.GENERAL,
            "category": BadgeCategory.MILESTONE,
            "icon": "star",
            "color": "blue",
            "points_value": 5,
            "rarity_score": 1,
            "criteria": {
                "type": "simple",
                "reviews_count": 1
            }
        },
        {
            "name": "Review Enthusiast",
            "description": "Posted 10 reviews",
            "tier": BadgeTier.STANDARD,
            "category": BadgeCategory.REVIEW_ACTIVITY,
            "icon": "edit",
            "color": "blue",
            "points_value": 25,
            "rarity_score": 2,
            "criteria": {
                "type": "simple",
                "reviews_count": 10
            }
        },
        {
            "name": "Review Master",
            "description": "Posted 50+ reviews",
            "tier": BadgeTier.PREMIUM,
            "category": BadgeCategory.REVIEW_ACTIVITY,
            "icon": "crown",
            "color": "gold",
            "points_value": 100,
            "rarity_score": 5,
            "criteria": {
                "type": "simple",
                "reviews_count": 50
            }
        },
        {
            "name": "Review Legend",
            "description": "Posted 100+ reviews",
            "tier": BadgeTier.LEGENDARY,
            "category": BadgeCategory.REVIEW_ACTIVITY,
            "icon": "trophy",
            "color": "purple",
            "points_value": 250,
            "rarity_score": 8,
            "criteria": {
                "type": "simple",
                "reviews_count": 100
            }
        },
        
        # === QUALITY BADGES ===
        {
            "name": "Quality Reviewer",
            "description": "Maintain 4.5+ average review rating",
            "tier": BadgeTier.PREMIUM,
            "category": BadgeCategory.QUALITY,
            "icon": "award",
            "color": "emerald",
            "points_value": 75,
            "rarity_score": 6,
            "criteria": {
                "type": "complex",
                "conditions": [
                    {
                        "type": "review_quality",
                        "min_rating": 4.5
                    }
                ],
                "operator": "AND"
            }
        },
        
        # === ENGAGEMENT BADGES ===
        {
            "name": "Streak Master",
            "description": "7-day review streak",
            "tier": BadgeTier.PREMIUM,
            "category": BadgeCategory.ENGAGEMENT,
            "icon": "fire",
            "color": "orange",
            "points_value": 50,
            "rarity_score": 4,
            "is_repeatable": True,
            "criteria": {
                "type": "complex",
                "conditions": [
                    {
                        "type": "review_streak",
                        "days": 7
                    }
                ]
            }
        },
        {
            "name": "Monthly Active",
            "description": "Posted reviews every month for 3 months",
            "tier": BadgeTier.STANDARD,
            "category": BadgeCategory.ENGAGEMENT,
            "icon": "calendar",
            "color": "blue",
            "points_value": 40,
            "rarity_score": 3,
            "criteria": {
                "type": "complex",
                "conditions": [
                    {
                        "type": "time_period",
                        "days": 90,
                        "min_reviews": 12  # ~1 per week for 3 months
                    }
                ]
            }
        },
        
        # === COMMUNITY BADGES ===
        {
            "name": "Community Helper",
            "description": "Received 25+ helpful votes",
            "tier": BadgeTier.STANDARD,
            "category": BadgeCategory.COMMUNITY,
            "icon": "heart",
            "color": "red",
            "points_value": 30,
            "rarity_score": 3,
            "criteria": {
                "type": "simple",
                "helpful_votes": 25
            }
        },
        {
            "name": "Mentor",
            "description": "Help newcomers with quality reviews",
            "tier": BadgeTier.PREMIUM,
            "category": BadgeCategory.COMMUNITY,
            "icon": "users",
            "color": "indigo",
            "points_value": 60,
            "rarity_score": 5,
            "criteria": {
                "type": "composite",
                "required_badges": ["Review Master", "Community Helper"]
            }
        },
        
        # === SPECIAL TIER BADGES ===
        {
            "name": "Early Adopter",
            "description": "Joined in the platform's first month",
            "tier": BadgeTier.LEGENDARY,
            "category": BadgeCategory.SPECIAL,
            "icon": "rocket",
            "color": "gradient",
            "points_value": 100,
            "rarity_score": 10,
            "is_auto_awarded": False,  # Manually awarded
            "criteria": {
                "type": "simple",
                "manual_award": True
            }
        },
        {
            "name": "Beta Tester",
            "description": "Participated in beta testing",
            "tier": BadgeTier.PREMIUM,
            "category": BadgeCategory.SPECIAL,
            "icon": "test-tube",
            "color": "cyan",
            "points_value": 75,
            "rarity_score": 7,
            "is_auto_awarded": False,
            "criteria": {
                "type": "simple",
                "manual_award": True
            }
        },
        
        # === MILESTONE BADGES ===
        {
            "name": "Level 5",
            "description": "Reached level 5",
            "tier": BadgeTier.STANDARD,
            "category": BadgeCategory.MILESTONE,
            "icon": "trending-up",
            "color": "green",
            "points_value": 25,
            "rarity_score": 2,
            "criteria": {
                "type": "simple",
                "level": 5
            }
        },
        {
            "name": "Level 10",
            "description": "Reached level 10",
            "tier": BadgeTier.PREMIUM,
            "category": BadgeCategory.MILESTONE,
            "icon": "target",
            "color": "gold",
            "points_value": 50,
            "rarity_score": 4,
            "criteria": {
                "type": "simple",
                "level": 10
            }
        },
        {
            "name": "1000 Points",
            "description": "Earned 1000 points",
            "tier": BadgeTier.PREMIUM,
            "category": BadgeCategory.MILESTONE,
            "icon": "gem",
            "color": "purple",
            "points_value": 100,
            "rarity_score": 5,
            "criteria": {
                "type": "simple",
                "points": 1000
            }
        }
    ]
    
    for badge_data in badge_definitions:
        existing_badge = db.query(BadgeDefinition).filter(
            BadgeDefinition.name == badge_data["name"]
        ).first()
        
        if existing_badge:
            print(f"Badge '{badge_data['name']}' already exists, skipping...")
            continue
        
        badge = BadgeDefinition(**badge_data)
        db.add(badge)
    
    db.commit()
    print(f"Seeded {len(badge_definitions)} enhanced badge definitions")

def get_badge_tier_colors():
    """Get color schemes for different badge tiers"""
    return {
        BadgeTier.GENERAL: {
            "bg": "bg-gray-100",
            "text": "text-gray-800",
            "border": "border-gray-200"
        },
        BadgeTier.STANDARD: {
            "bg": "bg-blue-100", 
            "text": "text-blue-800",
            "border": "border-blue-200"
        },
        BadgeTier.PREMIUM: {
            "bg": "bg-purple-100",
            "text": "text-purple-800", 
            "border": "border-purple-200"
        },
        BadgeTier.LEGENDARY: {
            "bg": "bg-gradient-to-r from-purple-100 to-pink-100",
            "text": "text-purple-900",
            "border": "border-purple-300"
        },
        BadgeTier.COMMUNITY: {
            "bg": "bg-green-100",
            "text": "text-green-800",
            "border": "border-green-200"
        }
    }
