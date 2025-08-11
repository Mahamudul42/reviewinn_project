from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import date, datetime, timedelta
from typing import List, Dict, Any
from database import get_db
from core.auth_dependencies import AuthDependencies
from models.user import User
from models.user_progress import UserProgress
from models.badge_award import BadgeAward
from models.badge_definition import BadgeDefinition
from models.daily_task import DailyTask
from models.weekly_engagement import WeeklyEngagement
from core.responses import api_response, error_response

router = APIRouter()

@router.get("/dashboard")
async def get_gamification_dashboard(
    db: Session = Depends(get_db),
    current_user = Depends(AuthDependencies.get_current_user_optional)
):
    """Get gamification dashboard data for the right panel (public or personalized)"""
    try:
        if not current_user:
            # OPTIMIZED: Public stats using efficient queries and cached metrics
            from models.entity import Entity
            from models.review import Review
            
            # Use efficient count estimates for large tables
            total_users = db.query(User).count()
            # Use cached review counts from entities for better performance
            total_reviews = db.query(func.sum(Entity.review_count)).scalar() or 0
            total_badges = db.query(BadgeAward).count()
            
            # Add trending category from cached data
            most_active_category = db.query(Entity.final_category_id, func.sum(Entity.review_count).label('total'))\
                .filter(Entity.final_category_id.isnot(None))\
                .group_by(Entity.final_category_id)\
                .order_by(desc('total')).first()
            
            category_name = 'General'
            if most_active_category:
                from models.unified_category import UnifiedCategory
                category = db.query(UnifiedCategory).filter(
                    UnifiedCategory.id == most_active_category[0]
                ).first()
                category_name = category.name if category else 'General'
            
            return api_response(
                data={
                    "public_stats": {
                        "total_users": total_users,
                        "total_reviews": total_reviews,
                        "total_badges": total_badges,
                        "most_active_category": category_name,
                        "total_reactions": db.query(func.sum(Entity.reaction_count)).scalar() or 0,
                        "total_comments": db.query(func.sum(Entity.comment_count)).scalar() or 0,
                        "total_views": db.query(func.sum(Entity.view_count)).scalar() or 0
                    }
                },
                message="Sign up or log in to see your personalized gamification dashboard!"
            )
        # Get user progress
        user_progress = db.query(UserProgress).filter(
            UserProgress.user_id == current_user.user_id
        ).first()
        
        if not user_progress:
            # Auto-create user_progress if missing
            user_progress = UserProgress(
                user_id=current_user.user_id,
                points=0,
                level=1,
                progress_to_next_level=0,
                daily_streak=0,
                published_reviews=0,
                review_target=10,
                total_helpful_votes=0,
                average_rating_given=0.00,
                entities_reviewed=0
            )
            db.add(user_progress)
            db.commit()
            db.refresh(user_progress)

        # Get user badges
        badges = db.query(BadgeDefinition).join(BadgeAward).filter(
            BadgeAward.user_id == current_user.user_id
        ).all()

        # Get daily tasks for today
        today = date.today()
        daily_tasks = db.query(DailyTask).filter(
            DailyTask.user_id == current_user.user_id,
            DailyTask.task_date == today
        ).all()

        # Return empty list if no tasks exist for today
        if not daily_tasks:
            daily_tasks = []

        # Get weekly engagement data (last 7 days)
        week_ago = date.today() - timedelta(days=6)
        weekly_data = db.query(WeeklyEngagement).filter(
            WeeklyEngagement.user_id == current_user.user_id,
            WeeklyEngagement.engagement_date >= week_ago
        ).order_by(WeeklyEngagement.engagement_date).all()

        # Fill in missing days with zeros
        weekly_chart_data = []
        for i in range(7):
            current_date = week_ago + timedelta(days=i)
            day_data = next((w for w in weekly_data if w.engagement_date == current_date), None)
            weekly_chart_data.append({
                "date": current_date.isoformat(),
                "day": current_date.strftime("%a"),
                "reviews": getattr(day_data, 'reviews', 0) if day_data else 0,
                "reactions": getattr(day_data, 'reactions', 0) if day_data else 0,
                "comments": getattr(day_data, 'comments', 0) if day_data else 0,
                "points": getattr(day_data, 'points', 0) if day_data else 0
            })

        return api_response(
            data={
                "user_progress": {
                    "points": getattr(user_progress, 'points', 0),
                    "level": getattr(user_progress, 'level', 1),
                    "progress_to_next_level": getattr(user_progress, 'progress_to_next_level', 0),
                    "daily_streak": getattr(user_progress, 'daily_streak', 0),
                    "published_reviews": getattr(user_progress, 'published_reviews', 0),
                    "review_target": getattr(user_progress, 'review_target', 10),
                    "total_helpful_votes": getattr(user_progress, 'total_helpful_votes', 0),
                    "average_rating_given": float(getattr(user_progress, 'average_rating_given', 0.0)) if isinstance(getattr(user_progress, 'average_rating_given', None), (int, float)) else 0.0,
                    "entities_reviewed": getattr(user_progress, 'entities_reviewed', 0),
                    "last_reviewed": getattr(user_progress, 'last_reviewed', None).isoformat() if getattr(user_progress, 'last_reviewed', None) is not None and hasattr(getattr(user_progress, 'last_reviewed', None), 'isoformat') else None
                },
                "badges": [badge.name for badge in badges],
                "daily_tasks": [
                    {
                        "label": getattr(task, 'label', ''),
                        "complete": bool(getattr(task, 'complete', False))
                    }
                    for task in daily_tasks
                ],
                "weekly_chart": weekly_chart_data,
                "session_duration": "Active now"  # This would need to be calculated from session data
            },
            message="Gamification dashboard loaded successfully"
        )

    except Exception as e:
        return error_response(
            message=f"Error fetching gamification data: {str(e)}",
            status_code=500
        )

@router.get("/user-progress")
async def get_user_progress(
    current_user: User = Depends(AuthDependencies.get_current_user),
    db: Session = Depends(get_db)
):
    """Get user progress data"""
    user_progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.user_id
    ).first()
    
    if not user_progress:
        raise HTTPException(
            status_code=404, 
            detail="User progress not found. Please complete some activities to initialize your progress."
        )
    
    return {
        "points": user_progress.points,
        "level": user_progress.level,
        "progress_to_next_level": user_progress.progress_to_next_level,
        "daily_streak": user_progress.daily_streak,
        "published_reviews": user_progress.published_reviews,
        "review_target": user_progress.review_target,
        "total_helpful_votes": user_progress.total_helpful_votes,
        "average_rating_given": float(user_progress.average_rating_given) if user_progress.average_rating_given is not None else 0.0,
        "entities_reviewed": user_progress.entities_reviewed,
        "last_reviewed": user_progress.last_reviewed.isoformat() if user_progress.last_reviewed else None
    }

@router.get("/badges")
async def get_user_badges(
    current_user: User = Depends(AuthDependencies.get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's earned badges"""
    badges = db.query(BadgeDefinition).join(BadgeAward).filter(
        BadgeAward.user_id == current_user.user_id
    ).all()
    
    # Return empty list if no badges found (this is normal for new users)
    return [badge.name for badge in badges]

@router.get("/daily-tasks")
async def get_daily_tasks(
    current_user: User = Depends(AuthDependencies.get_current_user),
    db: Session = Depends(get_db)
):
    """Get daily tasks for the current user"""
    today = date.today()
    tasks = db.query(DailyTask).filter(
        DailyTask.user_id == current_user.user_id,
        DailyTask.task_date == today
    ).all()
    
    # Return empty list if no tasks found (this is normal for new users)
    return [
        {
            "task_id": task.task_id,
            "label": task.label,
            "complete": task.complete
        }
        for task in tasks
    ]

@router.patch("/daily-tasks/{task_id}")
async def update_daily_task(
    task_id: int,
    complete: bool,
    current_user: User = Depends(AuthDependencies.get_current_user),
    db: Session = Depends(get_db)
):
    """Update a daily task completion status"""
    task = db.query(DailyTask).filter(
        DailyTask.task_id == task_id,
        DailyTask.user_id == current_user.user_id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.complete = complete
    task.updated_at = func.now()
    db.commit()
    
    return {"message": "Task updated successfully", "complete": complete}

@router.get("/weekly-engagement")
async def get_weekly_engagement(
    current_user: User = Depends(AuthDependencies.get_current_user),
    db: Session = Depends(get_db)
):
    """Get weekly engagement data for charts"""
    week_ago = date.today() - timedelta(days=6)
    weekly_data = db.query(WeeklyEngagement).filter(
        WeeklyEngagement.user_id == current_user.user_id,
        WeeklyEngagement.engagement_date >= week_ago
    ).order_by(WeeklyEngagement.engagement_date).all()
    
    # Fill in missing days with zeros
    chart_data = []
    for i in range(7):
        current_date = week_ago + timedelta(days=i)
        day_data = next((w for w in weekly_data if w.engagement_date == current_date), None)
        chart_data.append({
            "date": current_date.isoformat(),
            "day": current_date.strftime("%a"),
            "reviews": getattr(day_data, 'reviews', 0) if day_data else 0,
            "reactions": getattr(day_data, 'reactions', 0) if day_data else 0,
            "comments": getattr(day_data, 'comments', 0) if day_data else 0,
            "points": getattr(day_data, 'points', 0) if day_data else 0
        })
    
    return chart_data 