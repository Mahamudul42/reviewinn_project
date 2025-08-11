"""
Notification trigger service for automatically creating notifications based on events.
"""
from sqlalchemy.orm import Session
from services.notification_service import NotificationService
from models.notification import NotificationTypeEnum
from schemas.notification import NotificationCreate
from models.user import User
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)

class NotificationTriggerService:
    """Service for triggering notifications based on various events"""
    
    def __init__(self, db: Session):
        self.db = db
        self.notification_service = NotificationService(db)
    
    # Circle-related triggers
    def trigger_circle_request(self, circle_owner_id: int, requester_id: int, circle_name: str, circle_id: int):
        """Trigger notification when someone requests to join a circle"""
        try:
            self.notification_service.create_notification(NotificationCreate(
                user_id=circle_owner_id,
                actor_id=requester_id,
                notification_type=NotificationTypeEnum.CIRCLE_REQUEST,
                entity_type="circle",
                entity_id=circle_id,
                title="New Circle Request",
                content=f"wants to join your circle '{circle_name}'",
                data={"circle_name": circle_name, "circle_id": circle_id}
            ))
        except Exception as e:
            logger.error(f"Failed to create circle request notification: {e}")
    
    def trigger_circle_accepted(self, requester_id: int, accepter_id: int, circle_name: str, circle_id: int):
        """Trigger notification when circle request is accepted"""
        try:
            self.notification_service.create_notification(NotificationCreate(
                user_id=requester_id,
                actor_id=accepter_id,
                notification_type=NotificationTypeEnum.CIRCLE_ACCEPTED,
                entity_type="circle",
                entity_id=circle_id,
                title="Circle Request Accepted",
                content=f"accepted your request to join '{circle_name}'",
                data={"circle_name": circle_name, "circle_id": circle_id}
            ))
        except Exception as e:
            logger.error(f"Failed to create circle accepted notification: {e}")
    
    def trigger_circle_declined(self, requester_id: int, decliner_id: int, circle_name: str, circle_id: int):
        """Trigger notification when circle request is declined"""
        try:
            self.notification_service.create_notification(NotificationCreate(
                user_id=requester_id,
                actor_id=decliner_id,
                notification_type=NotificationTypeEnum.CIRCLE_DECLINED,
                entity_type="circle",
                entity_id=circle_id,
                title="Circle Request Declined",
                content=f"declined your request to join '{circle_name}'",
                data={"circle_name": circle_name, "circle_id": circle_id}
            ))
        except Exception as e:
            logger.error(f"Failed to create circle declined notification: {e}")
    
    def trigger_circle_invite(self, receiver_id: int, inviter_id: int, circle_name: str, circle_id: int):
        """Trigger notification when someone sends a circle invite"""
        try:
            self.notification_service.create_notification(NotificationCreate(
                user_id=receiver_id,
                actor_id=inviter_id,
                notification_type=NotificationTypeEnum.CIRCLE_INVITE,
                entity_type="circle",
                entity_id=circle_id,
                title="Circle Invitation",
                content=f"invited you to join '{circle_name}'",
                data={"circle_name": circle_name, "circle_id": circle_id}
            ))
        except Exception as e:
            logger.error(f"Failed to create circle invite notification: {e}")
    
    # Review-related triggers
    def trigger_review_reaction(self, review_author_id: int, reactor_id: int, review_id: int, reaction_type: str, entity_name: str):
        """Trigger notification when someone reacts to a review"""
        if review_author_id == reactor_id:
            return  # Don't notify users about their own reactions
        
        try:
            reaction_emoji = {
                'thumbs_up': '👍',
                'thumbs_down': '👎',
                'love': '❤️',
                'haha': '😂',
                'celebration': '🎉',
                'sad': '😢',
                'bomb': '💣',
                'eyes': '👀'
            }.get(reaction_type, reaction_type)
            
            self.notification_service.create_notification(NotificationCreate(
                user_id=review_author_id,
                actor_id=reactor_id,
                notification_type=NotificationTypeEnum.REVIEW_REACTION,
                entity_type="review",
                entity_id=review_id,
                title="Review Reaction",
                content=f"reacted {reaction_emoji} to your review of {entity_name}",
                data={"reaction_type": reaction_type, "entity_name": entity_name}
            ))
        except Exception as e:
            logger.error(f"Failed to create review reaction notification: {e}")
    
    def trigger_review_comment(self, review_author_id: int, commenter_id: int, review_id: int, entity_name: str):
        """Trigger notification when someone comments on a review"""
        if review_author_id == commenter_id:
            return  # Don't notify users about their own comments
        
        try:
            self.notification_service.create_notification(NotificationCreate(
                user_id=review_author_id,
                actor_id=commenter_id,
                notification_type=NotificationTypeEnum.REVIEW_COMMENT,
                entity_type="review",
                entity_id=review_id,
                title="New Comment",
                content=f"commented on your review of {entity_name}",
                data={"entity_name": entity_name}
            ))
        except Exception as e:
            logger.error(f"Failed to create review comment notification: {e}")
    
    def trigger_review_same_entity(self, original_reviewer_ids: List[int], new_reviewer_id: int, entity_name: str, entity_id: int):
        """Trigger notification when someone reviews the same entity"""
        try:
            for reviewer_id in original_reviewer_ids:
                if reviewer_id == new_reviewer_id:
                    continue  # Don't notify the same user
                
                self.notification_service.create_notification(NotificationCreate(
                    user_id=reviewer_id,
                    actor_id=new_reviewer_id,
                    notification_type=NotificationTypeEnum.REVIEW_SAME_ENTITY,
                    entity_type="entity",
                    entity_id=entity_id,
                    title="Similar Review",
                    content=f"also reviewed {entity_name}",
                    data={"entity_name": entity_name}
                ))
        except Exception as e:
            logger.error(f"Failed to create review same entity notification: {e}")
    
    # Gamification triggers
    def trigger_badge_earned(self, user_id: int, badge_name: str, badge_description: str, badge_id: int):
        """Trigger notification when user earns a badge"""
        try:
            self.notification_service.create_notification(NotificationCreate(
                user_id=user_id,
                notification_type=NotificationTypeEnum.BADGE_EARNED,
                entity_type="badge",
                entity_id=badge_id,
                title="Badge Earned! 🏆",
                content=f"You earned the '{badge_name}' badge!",
                data={"badge_name": badge_name, "badge_description": badge_description}
            ))
        except Exception as e:
            logger.error(f"Failed to create badge earned notification: {e}")
    
    def trigger_level_up(self, user_id: int, new_level: int, old_level: int):
        """Trigger notification when user levels up"""
        try:
            self.notification_service.create_notification(NotificationCreate(
                user_id=user_id,
                notification_type=NotificationTypeEnum.LEVEL_UP,
                entity_type="user",
                title="Level Up! 🎉",
                content=f"Congratulations! You reached level {new_level}!",
                data={"new_level": new_level, "old_level": old_level}
            ))
        except Exception as e:
            logger.error(f"Failed to create level up notification: {e}")
    
    def trigger_milestone_reached(self, user_id: int, milestone_name: str, milestone_description: str):
        """Trigger notification when user reaches a milestone"""
        try:
            self.notification_service.create_notification(NotificationCreate(
                user_id=user_id,
                notification_type=NotificationTypeEnum.MILESTONE_REACHED,
                entity_type="user",
                title="Milestone Reached! 🎯",
                content=f"You reached the '{milestone_name}' milestone!",
                data={"milestone_name": milestone_name, "milestone_description": milestone_description}
            ))
        except Exception as e:
            logger.error(f"Failed to create milestone reached notification: {e}")
    
    def trigger_daily_task_complete(self, user_id: int, task_name: str, points_earned: int):
        """Trigger notification when user completes a daily task"""
        try:
            self.notification_service.create_notification(NotificationCreate(
                user_id=user_id,
                notification_type=NotificationTypeEnum.DAILY_TASK_COMPLETE,
                entity_type="task",
                title="Daily Task Complete! ✅",
                content=f"You completed '{task_name}' and earned {points_earned} points!",
                data={"task_name": task_name, "points_earned": points_earned}
            ))
        except Exception as e:
            logger.error(f"Failed to create daily task complete notification: {e}")
    
    # Social triggers
    def trigger_friend_request(self, target_user_id: int, requester_id: int):
        """Trigger notification when someone sends a friend request"""
        try:
            self.notification_service.create_notification(NotificationCreate(
                user_id=target_user_id,
                actor_id=requester_id,
                notification_type=NotificationTypeEnum.FRIEND_REQUEST,
                entity_type="user",
                title="Friend Request",
                content="sent you a friend request",
                data={}
            ))
        except Exception as e:
            logger.error(f"Failed to create friend request notification: {e}")
    
    def trigger_friend_accepted(self, requester_id: int, accepter_id: int):
        """Trigger notification when friend request is accepted"""
        try:
            self.notification_service.create_notification(NotificationCreate(
                user_id=requester_id,
                actor_id=accepter_id,
                notification_type=NotificationTypeEnum.FRIEND_ACCEPTED,
                entity_type="user",
                title="Friend Request Accepted",
                content="accepted your friend request",
                data={}
            ))
        except Exception as e:
            logger.error(f"Failed to create friend accepted notification: {e}")
    
    def trigger_user_followed(self, followed_user_id: int, follower_id: int):
        """Trigger notification when someone follows a user"""
        try:
            self.notification_service.create_notification(NotificationCreate(
                user_id=followed_user_id,
                actor_id=follower_id,
                notification_type=NotificationTypeEnum.USER_FOLLOWED,
                entity_type="user",
                title="New Follower",
                content="started following you",
                data={}
            ))
        except Exception as e:
            logger.error(f"Failed to create user followed notification: {e}")
    
    def trigger_user_mentioned(self, mentioned_user_id: int, mentioner_id: int, content_type: str, content_id: int):
        """Trigger notification when user is mentioned"""
        try:
            self.notification_service.create_notification(NotificationCreate(
                user_id=mentioned_user_id,
                actor_id=mentioner_id,
                notification_type=NotificationTypeEnum.USER_MENTIONED,
                entity_type=content_type,
                entity_id=content_id,
                title="You were mentioned",
                content=f"mentioned you in a {content_type}",
                data={"content_type": content_type}
            ))
        except Exception as e:
            logger.error(f"Failed to create user mentioned notification: {e}")
    
    # System triggers
    def trigger_system_announcement(self, user_ids: List[int], title: str, content: str, data: Optional[dict] = None):
        """Trigger system announcement notification to multiple users"""
        try:
            for user_id in user_ids:
                self.notification_service.create_notification(NotificationCreate(
                    user_id=user_id,
                    notification_type=NotificationTypeEnum.SYSTEM_ANNOUNCEMENT,
                    entity_type="system",
                    title=title,
                    content=content,
                    data=data or {}
                ))
        except Exception as e:
            logger.error(f"Failed to create system announcement notification: {e}")
    
    def trigger_account_verification(self, user_id: int, verification_type: str):
        """Trigger notification when account is verified"""
        try:
            self.notification_service.create_notification(NotificationCreate(
                user_id=user_id,
                notification_type=NotificationTypeEnum.ACCOUNT_VERIFICATION,
                entity_type="user",
                title="Account Verified! ✅",
                content=f"Your {verification_type} has been verified",
                data={"verification_type": verification_type}
            ))
        except Exception as e:
            logger.error(f"Failed to create account verification notification: {e}")
    
    def trigger_security_alert(self, user_id: int, alert_type: str, details: str):
        """Trigger security alert notification"""
        try:
            self.notification_service.create_notification(NotificationCreate(
                user_id=user_id,
                notification_type=NotificationTypeEnum.SECURITY_ALERT,
                entity_type="security",
                title="Security Alert 🔒",
                content=f"Security alert: {alert_type}",
                data={"alert_type": alert_type, "details": details}
            ))
        except Exception as e:
            logger.error(f"Failed to create security alert notification: {e}")
    
    # Utility method for WebSocket notification broadcasting
    def broadcast_notification(self, notification_data: dict):
        """Broadcast notification via WebSocket (to be implemented with WebSocket manager)"""
        # This will be implemented when integrating with WebSocket system
        pass