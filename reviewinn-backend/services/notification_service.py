from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from models.notification import Notification, NotificationTypeEnum
from repositories.notification_repository import NotificationRepository
from schemas.notification import NotificationCreate, NotificationUpdate, NotificationRead, NotificationSummary, NotificationListResponse
from typing import List, Optional, Dict, Any
from models.user import User
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = NotificationRepository(db)

    def create_notification(self, data: NotificationCreate) -> Notification:
        """Create a new notification"""
        # Adapt to current database schema
        from datetime import datetime
        notification = Notification(
            user_id=data.user_id,
            actor_id=data.actor_id,
            notification_type=data.notification_type,
            entity_type=data.entity_type,
            entity_id=data.entity_id,
            type=data.notification_type.value,  # Use 'type' field for backward compatibility
            content=f"{data.title}: {data.content}",  # Combine title and content
            read=False,  # Use 'read' field for backward compatibility
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        return self.repo.create(notification)

    def get_user_notifications(self, user_id: int, page: int = 1, per_page: int = 20) -> NotificationListResponse:
        """Get paginated notifications for a user"""
        try:
            notifications = self.db.query(Notification).filter(
                Notification.user_id == user_id
            ).order_by(desc(Notification.created_at)).offset((page - 1) * per_page).limit(per_page).all()
            
            total = self.db.query(func.count(Notification.notification_id)).filter(
                Notification.user_id == user_id
            ).scalar() or 0
            
            notification_reads = []
            for notification in notifications:
                try:
                    # Get actor info manually
                    actor = None
                    if notification.actor_id:
                        actor = self.db.query(User).filter(User.user_id == notification.actor_id).first()
                    
                    notification_read = NotificationRead(
                        notification_id=notification.notification_id,
                        user_id=notification.user_id,
                        actor_id=notification.actor_id,
                        notification_type=notification.notification_type,
                        entity_type=notification.entity_type,
                        entity_id=notification.entity_id,
                        title=notification.content.split(': ')[0] if ': ' in notification.content else 'Notification',
                        content=notification.content,
                        is_read=notification.read,
                        data=None,
                        created_at=notification.created_at or notification.updated_at,
                        updated_at=notification.updated_at or notification.created_at,
                        actor_name=actor.name if actor else None,
                        actor_avatar=actor.avatar if actor else None,
                        actor_username=actor.username if actor else None
                    )
                    notification_reads.append(notification_read)
                except Exception as e:
                    logger.error(f"Error processing notification {notification.notification_id}: {e}")
                    continue
            
            return NotificationListResponse(
                notifications=notification_reads,
                total=total,
                page=page,
                per_page=per_page,
                has_next=page * per_page < total,
                has_prev=page > 1
            )
        except Exception as e:
            logger.error(f"Error getting user notifications for user {user_id}: {e}")
            return NotificationListResponse(
                notifications=[],
                total=0,
                page=page,
                per_page=per_page,
                has_next=False,
                has_prev=False
            )

    def get_notification_summary(self, user_id: int) -> NotificationSummary:
        """Get notification summary for header display"""
        try:
            # Simple unread count
            total_unread = self.db.query(func.count(Notification.notification_id)).filter(
                Notification.user_id == user_id,
                Notification.read == False
            ).scalar() or 0
            
            # Return empty summary for now to avoid complexity
            return NotificationSummary(
                total_unread=total_unread,
                recent_notifications=[]
            )
        except Exception as e:
            logger.error(f"Error getting notification summary for user {user_id}: {e}")
            # Return empty summary on error
            return NotificationSummary(
                total_unread=0,
                recent_notifications=[]
            )

    def mark_as_read(self, notification_id: int, user_id: int) -> Optional[Notification]:
        """Mark a notification as read"""
        notification = self.db.query(Notification).filter(
            Notification.notification_id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if notification:
            notification.read = True
            self.db.commit()
            self.db.refresh(notification)
            return notification
        return None

    def mark_all_as_read(self, user_id: int) -> int:
        """Mark all notifications as read for a user"""
        count = self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.read == False
        ).update({"read": True})
        self.db.commit()
        return count

    def delete_notification(self, notification_id: int, user_id: int) -> bool:
        """Delete a notification"""
        notification = self.db.query(Notification).filter(
            Notification.notification_id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if notification:
            self.db.delete(notification)
            self.db.commit()
            return True
        return False

    # Notification creation helpers for different types
    def create_circle_request_notification(self, user_id: int, actor_id: int, circle_name: str) -> Notification:
        """Create notification for circle request"""
        return self.create_notification(NotificationCreate(
            user_id=user_id,
            actor_id=actor_id,
            notification_type=NotificationTypeEnum.CIRCLE_REQUEST,
            entity_type="circle",
            title="New Circle Request",
            content=f"wants to join your circle '{circle_name}'",
            data={"circle_name": circle_name}
        ))

    def create_circle_accepted_notification(self, user_id: int, actor_id: int, circle_name: str) -> Notification:
        """Create notification for circle acceptance"""
        return self.create_notification(NotificationCreate(
            user_id=user_id,
            actor_id=actor_id,
            notification_type=NotificationTypeEnum.CIRCLE_ACCEPTED,
            entity_type="circle",
            title="Circle Request Accepted",
            content=f"accepted your request to join '{circle_name}'",
            data={"circle_name": circle_name}
        ))

    def create_review_reaction_notification(self, user_id: int, actor_id: int, review_id: int, reaction_type: str) -> Notification:
        """Create notification for review reaction"""
        return self.create_notification(NotificationCreate(
            user_id=user_id,
            actor_id=actor_id,
            notification_type=NotificationTypeEnum.REVIEW_REACTION,
            entity_type="review",
            entity_id=review_id,
            title="Review Reaction",
            content=f"reacted to your review with {reaction_type}",
            data={"reaction_type": reaction_type}
        ))

    def create_review_comment_notification(self, user_id: int, actor_id: int, review_id: int) -> Notification:
        """Create notification for review comment"""
        return self.create_notification(NotificationCreate(
            user_id=user_id,
            actor_id=actor_id,
            notification_type=NotificationTypeEnum.REVIEW_COMMENT,
            entity_type="review",
            entity_id=review_id,
            title="New Comment",
            content="commented on your review",
            data={"review_id": review_id}
        ))

    def create_badge_earned_notification(self, user_id: int, badge_name: str, badge_description: str) -> Notification:
        """Create notification for badge earned"""
        return self.create_notification(NotificationCreate(
            user_id=user_id,
            notification_type=NotificationTypeEnum.BADGE_EARNED,
            entity_type="badge",
            title="Badge Earned!",
            content=f"You earned the '{badge_name}' badge!",
            data={"badge_name": badge_name, "badge_description": badge_description}
        ))

    def create_level_up_notification(self, user_id: int, new_level: int) -> Notification:
        """Create notification for level up"""
        return self.create_notification(NotificationCreate(
            user_id=user_id,
            notification_type=NotificationTypeEnum.LEVEL_UP,
            entity_type="user",
            title="Level Up!",
            content=f"Congratulations! You reached level {new_level}!",
            data={"new_level": new_level}
        ))

    def create_review_same_entity_notification(self, user_id: int, actor_id: int, entity_name: str, entity_id: int) -> Notification:
        """Create notification when someone reviews the same entity"""
        return self.create_notification(NotificationCreate(
            user_id=user_id,
            actor_id=actor_id,
            notification_type=NotificationTypeEnum.REVIEW_SAME_ENTITY,
            entity_type="entity",
            entity_id=entity_id,
            title="Similar Review",
            content=f"also reviewed {entity_name}",
            data={"entity_name": entity_name}
        ))

    def create_system_announcement_notification(self, user_id: int, title: str, content: str, data: Optional[Dict[str, Any]] = None) -> Notification:
        """Create system announcement notification"""
        return self.create_notification(NotificationCreate(
            user_id=user_id,
            notification_type=NotificationTypeEnum.SYSTEM_ANNOUNCEMENT,
            entity_type="system",
            title=title,
            content=content,
            data=data
        )) 