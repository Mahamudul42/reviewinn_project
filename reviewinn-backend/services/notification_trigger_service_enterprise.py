"""
Enterprise Notification Trigger Service
Handles automatic notification creation for key events at 10M+ user scale
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from services.enterprise_notification_service import EnterpriseNotificationService
from schemas.notification import NotificationCreate
from models.user import User
from models.entity import Entity  
from models.review import Review
from models.comment import Comment
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class NotificationTriggerService:
    """Enterprise service for triggering notifications on key events."""
    
    def __init__(self, db: Session):
        self.db = db
        self.notification_service = EnterpriseNotificationService(db)
    
    async def trigger_review_notifications(
        self, 
        review: Review, 
        action: str = 'created'
    ) -> List[int]:
        """
        Trigger notifications for review-related events.
        Returns list of created notification IDs.
        """
        notifications_created = []
        
        try:
            # Get entity details
            entity = self.db.query(Entity).filter(Entity.entity_id == review.entity_id).first()
            if not entity:
                return notifications_created
            
            # Get review author
            author = self.db.query(User).filter(User.user_id == review.user_id).first()
            if not author:
                return notifications_created
            
            if action == 'created':
                # Notify entity owner if claimed
                if entity.is_claimed and entity.claimed_by and entity.claimed_by != review.user_id:
                    notification = await self.notification_service.create_notification(
                        NotificationCreate(
                            user_id=entity.claimed_by,
                            actor_id=review.user_id,
                            type='review_entity_new',
                            title=f"New review for {entity.name}",
                            content=f"received a new review: \"{review.title[:50]}...\"",
                            entity_type='entity',
                            entity_id=entity.entity_id,
                            priority='normal',
                            notification_data={
                                'entity_name': entity.name,
                                'review_rating': float(review.overall_rating) if review.overall_rating else None,
                                'review_title': review.title,
                                'review_id': review.review_id
                            }
                        )
                    )
                    notifications_created.append(notification.notification_id)
                
                # Notify followers of the entity (future feature)
                # This would be optimized with background jobs for 10M+ users
                
            elif action == 'updated':
                # Notify users who interacted with this review
                pass  # Implementation for review updates
                
        except Exception as e:
            logger.error(f"Failed to trigger review notifications: {str(e)}")
        
        return notifications_created
    
    async def trigger_comment_notifications(
        self, 
        comment: Comment, 
        action: str = 'created'
    ) -> List[int]:
        """
        Trigger notifications for comment-related events.
        """
        notifications_created = []
        
        try:
            # Get review details
            review = self.db.query(Review).filter(Review.review_id == comment.review_id).first()
            if not review:
                return notifications_created
            
            # Get comment author
            comment_author = self.db.query(User).filter(User.user_id == comment.user_id).first()
            if not comment_author:
                return notifications_created
            
            if action == 'created':
                # Notify review author if different from comment author
                if review.user_id != comment.user_id:
                    notification = await self.notification_service.create_notification(
                        NotificationCreate(
                            user_id=review.user_id,
                            actor_id=comment.user_id,
                            type='review_comment',
                            title="New comment on your review",
                            content=f"commented on your review: \"{comment.content[:50]}...\"",
                            entity_type='review',
                            entity_id=review.review_id,
                            priority='normal',
                            notification_data={
                                'review_title': review.title,
                                'comment_content': comment.content,
                                'comment_id': comment.comment_id
                            }
                        )
                    )
                    notifications_created.append(notification.notification_id)
                
                # Notify other commenters on the same review (future feature)
                # This would use efficient queries to avoid N+1 problems
                
        except Exception as e:
            logger.error(f"Failed to trigger comment notifications: {str(e)}")
        
        return notifications_created
    
    async def trigger_reaction_notifications(
        self, 
        target_type: str,
        target_id: int,
        reactor_user_id: int,
        reaction_type: str,
        action: str = 'added'
    ) -> List[int]:
        """
        Trigger notifications for reaction events (review reactions, comment reactions).
        """
        notifications_created = []
        
        try:
            # Get reactor user
            reactor = self.db.query(User).filter(User.user_id == reactor_user_id).first()
            if not reactor:
                return notifications_created
            
            if target_type == 'review':
                review = self.db.query(Review).filter(Review.review_id == target_id).first()
                if review and review.user_id != reactor_user_id and action == 'added':
                    notification = await self.notification_service.create_notification(
                        NotificationCreate(
                            user_id=review.user_id,
                            actor_id=reactor_user_id,
                            type='review_reaction',
                            title=f"New reaction on your review",
                            content=f"reacted {reaction_type} to your review: \"{review.title[:30]}...\"",
                            entity_type='review',
                            entity_id=review.review_id,
                            priority='low',
                            notification_data={
                                'reaction_type': reaction_type,
                                'review_title': review.title,
                                'review_id': review.review_id
                            }
                        )
                    )
                    notifications_created.append(notification.notification_id)
            
            elif target_type == 'comment':
                comment = self.db.query(Comment).filter(Comment.comment_id == target_id).first()
                if comment and comment.user_id != reactor_user_id and action == 'added':
                    notification = await self.notification_service.create_notification(
                        NotificationCreate(
                            user_id=comment.user_id,
                            actor_id=reactor_user_id,
                            type='comment_reaction',
                            title="New reaction on your comment",
                            content=f"reacted {reaction_type} to your comment",
                            entity_type='comment',
                            entity_id=comment.comment_id,
                            priority='low',
                            notification_data={
                                'reaction_type': reaction_type,
                                'comment_content': comment.content[:50],
                                'comment_id': comment.comment_id
                            }
                        )
                    )
                    notifications_created.append(notification.notification_id)
                    
        except Exception as e:
            logger.error(f"Failed to trigger reaction notifications: {str(e)}")
        
        return notifications_created
    
    async def trigger_circle_notifications(
        self,
        target_user_id: int,
        requester_user_id: int,
        action: str,
        additional_data: Optional[Dict[str, Any]] = None
    ) -> List[int]:
        """
        Trigger notifications for circle/social events.
        """
        notifications_created = []
        
        try:
            # Get requester user
            requester = self.db.query(User).filter(User.user_id == requester_user_id).first()
            if not requester:
                return notifications_created
            
            notification_map = {
                'circle_request': {
                    'title': 'New circle request',
                    'content': 'sent you a circle request',
                    'priority': 'normal'
                },
                'circle_accepted': {
                    'title': 'Circle request accepted',
                    'content': 'accepted your circle request',
                    'priority': 'normal'
                },
                'circle_declined': {
                    'title': 'Circle request declined',
                    'content': 'declined your circle request',
                    'priority': 'low'
                },
                'user_followed': {
                    'title': 'New follower',
                    'content': 'started following you',
                    'priority': 'low'
                }
            }
            
            if action in notification_map:
                config = notification_map[action]
                notification = await self.notification_service.create_notification(
                    NotificationCreate(
                        user_id=target_user_id,
                        actor_id=requester_user_id,
                        type=action,
                        title=config['title'],
                        content=config['content'],
                        priority=config['priority'],
                        notification_data=additional_data or {}
                    )
                )
                notifications_created.append(notification.notification_id)
                
        except Exception as e:
            logger.error(f"Failed to trigger circle notifications: {str(e)}")
        
        return notifications_created
    
    async def trigger_gamification_notifications(
        self,
        user_id: int,
        achievement_type: str,
        achievement_data: Dict[str, Any]
    ) -> List[int]:
        """
        Trigger notifications for gamification events (badges, level ups, etc.).
        """
        notifications_created = []
        
        try:
            notification_configs = {
                'badge_earned': {
                    'title': f"🏆 Badge Earned: {achievement_data.get('badge_name', 'New Badge')}",
                    'content': f"You've earned the {achievement_data.get('badge_name', 'badge')}!",
                    'priority': 'normal'
                },
                'level_up': {
                    'title': f"🎉 Level Up! You're now level {achievement_data.get('new_level', 'X')}",
                    'content': f"Congratulations on reaching level {achievement_data.get('new_level', 'X')}!",
                    'priority': 'high'
                },
                'milestone_reached': {
                    'title': f"🎯 Milestone Reached: {achievement_data.get('milestone_name', 'Achievement')}",
                    'content': f"You've reached the {achievement_data.get('milestone_name', 'milestone')}!",
                    'priority': 'normal'
                },
                'daily_task_complete': {
                    'title': "✅ Daily Task Complete",
                    'content': f"You've completed today's task: {achievement_data.get('task_name', 'task')}",
                    'priority': 'low'
                }
            }
            
            if achievement_type in notification_configs:
                config = notification_configs[achievement_type]
                notification = await self.notification_service.create_notification(
                    NotificationCreate(
                        user_id=user_id,
                        type=achievement_type,
                        title=config['title'],
                        content=config['content'],
                        priority=config['priority'],
                        notification_data=achievement_data
                    )
                )
                notifications_created.append(notification.notification_id)
                
        except Exception as e:
            logger.error(f"Failed to trigger gamification notifications: {str(e)}")
        
        return notifications_created
    
    async def trigger_entity_notifications(
        self,
        entity: Entity,
        action: str,
        actor_user_id: Optional[int] = None
    ) -> List[int]:
        """
        Trigger notifications for entity-related events.
        """
        notifications_created = []
        
        try:
            if action == 'claimed' and entity.claimed_by:
                # Notify the user who claimed the entity
                notification = await self.notification_service.create_notification(
                    NotificationCreate(
                        user_id=entity.claimed_by,
                        type='entity_claimed',
                        title=f"Entity Claimed: {entity.name}",
                        content=f"You've successfully claimed {entity.name}",
                        entity_type='entity',
                        entity_id=entity.entity_id,
                        priority='normal',
                        notification_data={
                            'entity_name': entity.name,
                            'entity_id': entity.entity_id
                        }
                    )
                )
                notifications_created.append(notification.notification_id)
            
            elif action == 'verified' and entity.claimed_by:
                # Notify entity owner about verification
                notification = await self.notification_service.create_notification(
                    NotificationCreate(
                        user_id=entity.claimed_by,
                        type='entity_verified',
                        title=f"Entity Verified: {entity.name}",
                        content=f"Your entity {entity.name} has been verified!",
                        entity_type='entity',
                        entity_id=entity.entity_id,
                        priority='high',
                        notification_data={
                            'entity_name': entity.name,
                            'entity_id': entity.entity_id
                        }
                    )
                )
                notifications_created.append(notification.notification_id)
                
        except Exception as e:
            logger.error(f"Failed to trigger entity notifications: {str(e)}")
        
        return notifications_created
    
    async def trigger_system_notifications(
        self,
        notification_type: str,
        title: str,
        content: str,
        target_users: Optional[List[int]] = None,
        priority: str = 'normal'
    ) -> List[int]:
        """
        Trigger system-wide notifications for announcements, maintenance, etc.
        """
        try:
            notifications = await self.notification_service.create_system_notification(
                title=title,
                content=content,
                notification_type=notification_type,
                priority=priority,
                target_users=target_users
            )
            return [n.notification_id for n in notifications]
        except Exception as e:
            logger.error(f"Failed to trigger system notifications: {str(e)}")
            return []