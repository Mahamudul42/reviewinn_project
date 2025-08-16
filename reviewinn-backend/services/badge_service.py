"""
Badge Service - Automatic Badge Awarding System
Handles badge criteria evaluation and automatic awarding
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from models.user import User
from models.review import Review
from models.badge_definition import BadgeDefinition
from models.badge_award import BadgeAward
import json
from datetime import datetime, timedelta

class BadgeService:
    """Service for managing badge awards and evaluation"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def evaluate_user_badges(self, user_id: int) -> List[BadgeAward]:
        """Evaluate all potential badges for a user and award new ones"""
        user = self.db.query(User).filter(User.user_id == user_id).first()
        if not user:
            return []
        
        # Get all badge definitions
        badge_definitions = self.db.query(BadgeDefinition).all()
        
        newly_awarded = []
        
        for badge_def in badge_definitions:
            # Check if user already has this badge
            existing_award = self.db.query(BadgeAward).filter(
                and_(
                    BadgeAward.user_id == user_id,
                    BadgeAward.badge_definition_id == badge_def.badge_definition_id
                )
            ).first()
            if existing_award:
                continue
            
            # Evaluate criteria
            if await self._evaluate_criteria(user, badge_def.criteria):
                # Award the badge
                award = self._award_badge(user_id, badge_def.badge_definition_id)
                if award:
                    newly_awarded.append(award)
        
        return newly_awarded
    
    async def _evaluate_criteria(self, user: User, criteria: Dict[str, Any]) -> bool:
        """Evaluate if user meets badge criteria"""
        try:
            criteria_type = criteria.get('type', 'simple')
            
            if criteria_type == 'simple':
                return self._evaluate_simple_criteria(user, criteria)
            elif criteria_type == 'complex':
                return await self._evaluate_complex_criteria(user, criteria)
            elif criteria_type == 'composite':
                return await self._evaluate_composite_criteria(user, criteria)
            
            return False
        except Exception as e:
            print(f"Error evaluating criteria: {e}")
            return False
    
    def _evaluate_simple_criteria(self, user: User, criteria: Dict[str, Any]) -> bool:
        """Evaluate simple numeric criteria"""
        for key, required_value in criteria.items():
            if key == 'type':
                continue
                
            if key == 'reviews_count':
                actual_count = self.db.query(Review).filter(Review.user_id == user.user_id).count()
                if actual_count < required_value:
                    return False
            
            elif key == 'verified':
                if user.is_verified != required_value:
                    return False
            
            elif key == 'points':
                if user.points < required_value:
                    return False
            
            elif key == 'level':
                if user.level < required_value:
                    return False
            
            # Add more criteria as needed
        
        return True
    
    async def _evaluate_complex_criteria(self, user: User, criteria: Dict[str, Any]) -> bool:
        """Evaluate complex criteria with time periods, aggregations, etc."""
        conditions = criteria.get('conditions', [])
        operator = criteria.get('operator', 'AND')  # AND/OR
        
        results = []
        
        for condition in conditions:
            condition_type = condition.get('type')
            
            if condition_type == 'review_streak':
                # Check daily review streak
                streak_days = condition.get('days', 7)
                result = self._check_review_streak(user.user_id, streak_days)
                results.append(result)
            
            elif condition_type == 'review_quality':
                # Check average rating received
                min_avg_rating = condition.get('min_rating', 4.0)
                result = self._check_review_quality(user.user_id, min_avg_rating)
                results.append(result)
            
            elif condition_type == 'time_period':
                # Check activity within time period
                days = condition.get('days', 30)
                min_reviews = condition.get('min_reviews', 1)
                result = self._check_time_period_activity(user.user_id, days, min_reviews)
                results.append(result)
        
        # Apply operator
        if operator == 'OR':
            return any(results)
        else:  # Default to AND
            return all(results)
    
    async def _evaluate_composite_criteria(self, user: User, criteria: Dict[str, Any]) -> bool:
        """Evaluate composite criteria (combination of multiple badge requirements)"""
        required_badges = criteria.get('required_badges', [])
        
        # Check if user has all required badges
        for badge_name in required_badges:
            badge_def = self.db.query(BadgeDefinition).filter(
                BadgeDefinition.name == badge_name
            ).first()
            
            if not badge_def:
                continue
            
            award = self.db.query(BadgeAward).filter(
                and_(
                    BadgeAward.user_id == user.user_id,
                    BadgeAward.badge_definition_id == badge_def.badge_definition_id
                )
            ).first()
            
            if not award:
                return False
        
        return True
    
    def _check_review_streak(self, user_id: int, required_days: int) -> bool:
        """Check if user has maintained a review streak"""
        # Implementation for checking consecutive days with reviews
        # This is a simplified version - you'd want more sophisticated logic
        
        today = datetime.now().date()
        consecutive_days = 0
        
        for i in range(required_days):
            check_date = today - timedelta(days=i)
            review_count = self.db.query(Review).filter(
                and_(
                    Review.user_id == user_id,
                    func.date(Review.created_at) == check_date
                )
            ).count()
            
            if review_count > 0:
                consecutive_days += 1
            else:
                break
        
        return consecutive_days >= required_days
    
    def _check_review_quality(self, user_id: int, min_rating: float) -> bool:
        """Check average rating of user's reviews"""
        avg_rating = self.db.query(func.avg(Review.rating)).filter(
            Review.user_id == user_id
        ).scalar()
        
        return avg_rating and avg_rating >= min_rating
    
    def _check_time_period_activity(self, user_id: int, days: int, min_reviews: int) -> bool:
        """Check activity within specified time period"""
        cutoff_date = datetime.now() - timedelta(days=days)
        review_count = self.db.query(Review).filter(
            and_(
                Review.user_id == user_id,
                Review.created_at >= cutoff_date
            )
        ).count()
        
        return review_count >= min_reviews
    
    def _award_badge(self, user_id: int, badge_definition_id: int) -> Optional[BadgeAward]:
        """Award a badge to a user"""
        try:
            # Create new award
            award = BadgeAward(
                user_id=user_id,
                badge_definition_id=badge_definition_id
            )
            
            self.db.add(award)
            self.db.commit()
            return award
            
        except Exception as e:
            self.db.rollback()
            print(f"Error awarding badge: {e}")
            return None
    
    def get_user_badges(self, user_id: int) -> List[Dict[str, Any]]:
        """Get all badges for a user"""
        awards = self.db.query(BadgeAward).filter(
            BadgeAward.user_id == user_id
        ).join(BadgeDefinition).all()
        
        result = []
        for award in awards:
            result.append({
                "award_id": award.award_id,
                "badge": {
                    "badge_definition_id": award.badge_definition.badge_definition_id,
                    "name": award.badge_definition.name,
                    "description": award.badge_definition.description,
                    "image_url": award.badge_definition.image_url,
                    "criteria": award.badge_definition.criteria
                },
                "awarded_at": award.awarded_at.isoformat() if award.awarded_at else None
            })
        
        return result
    
    def get_available_badges(self, user_id: int) -> List[Dict[str, Any]]:
        """Get badges that user hasn't earned yet"""
        earned_badge_ids = self.db.query(BadgeAward.badge_definition_id).filter(
            BadgeAward.user_id == user_id
        ).subquery()
        
        available_badges = self.db.query(BadgeDefinition).filter(
            BadgeDefinition.badge_definition_id.notin_(earned_badge_ids)
        ).all()
        
        result = []
        for badge in available_badges:
            result.append({
                "badge_definition_id": badge.badge_definition_id,
                "name": badge.name,
                "description": badge.description,
                "image_url": badge.image_url,
                "criteria": badge.criteria
            })
        
        return result
