"""
Enterprise-grade Notification Service for ReviewInn
Supports 10M+ users with core_notifications table
"""

from sqlalchemy.orm import Session, selectinload
from sqlalchemy import desc, func, and_, or_, text
from models.notification import Notification, NotificationTypeEnum, PriorityEnum, DeliveryStatusEnum
from schemas.notification import (
    NotificationCreate, NotificationUpdate, NotificationRead, 
    NotificationSummary, NotificationListResponse, NotificationDropdownResponse,
    NotificationStats, NotificationBulkUpdate
)
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
import logging

logger = logging.getLogger(__name__)

class EnterpriseNotificationService:
    """Enterprise-scale notification service supporting 10M+ users."""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def create_notification(self, data: NotificationCreate) -> Notification:
        """Create a new enterprise notification with advanced features."""
        try:
            # Auto-set expiration if not provided
            expires_at = data.expires_at
            if not expires_at:
                # Default expiration based on priority
                if data.priority in ['critical', 'urgent']:
                    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
                elif data.priority == 'high':
                    expires_at = datetime.now(timezone.utc) + timedelta(days=14)
                else:
                    expires_at = datetime.now(timezone.utc) + timedelta(days=30)
            
            notification = Notification(
                user_id=data.user_id,
                actor_id=data.actor_id,
                type=data.type,
                title=data.title,
                content=data.content,
                entity_type=data.entity_type,
                entity_id=data.entity_id,
                priority=data.priority,
                delivery_status=data.delivery_status,
                notification_data=data.notification_data or {},
                expires_at=expires_at,
                is_read=False,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            
            self.db.add(notification)
            self.db.commit()
            self.db.refresh(notification)
            
            logger.info(f"Created enterprise notification {notification.notification_id} for user {data.user_id}")
            return notification
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to create notification: {str(e)}")
            raise
    
    async def get_user_notifications(
        self, 
        user_id: int, 
        page: int = 1, 
        limit: int = 20,
        unread_only: bool = False,
        priority_filter: Optional[str] = None
    ) -> NotificationListResponse:
        """Get paginated notifications for a user with enterprise filtering."""
        try:
            # Build optimized query with proper indexes
            query = self.db.query(Notification).options(
                selectinload(Notification.actor)
            ).filter(
                Notification.user_id == user_id
            )
            
            # Apply filters
            if unread_only:
                query = query.filter(Notification.is_read == False)
            
            if priority_filter:
                query = query.filter(Notification.priority == priority_filter)
            
            # Exclude expired notifications for better UX
            query = query.filter(
                or_(
                    Notification.expires_at.is_(None),
                    Notification.expires_at > datetime.now(timezone.utc)
                )
            )
            
            # Get total count efficiently
            total = query.count()
            
            # Get paginated results
            notifications = query.order_by(
                desc(Notification.priority == 'critical'),
                desc(Notification.priority == 'urgent'),
                desc(Notification.created_at)
            ).offset((page - 1) * limit).limit(limit).all()
            
            # Convert to response format
            notification_reads = [notification.to_dict() for notification in notifications]
            
            return NotificationListResponse(
                notifications=notification_reads,
                total=total,
                page=page,
                limit=limit,
                pages=(total // limit) + (1 if total % limit else 0),
                has_next=page * limit < total,
                has_prev=page > 1
            )
            
        except Exception as e:
            logger.error(f"Failed to get user notifications: {str(e)}")
            raise
    
    async def get_notification_dropdown(self, user_id: int) -> NotificationDropdownResponse:
        """Get optimized notification data for dropdown modal."""
        try:
            # Get recent notifications with high priority first
            notifications = self.db.query(Notification).options(
                selectinload(Notification.actor)
            ).filter(
                and_(
                    Notification.user_id == user_id,
                    or_(
                        Notification.expires_at.is_(None),
                        Notification.expires_at > datetime.now(timezone.utc)
                    )
                )
            ).order_by(
                desc(Notification.priority == 'critical'),
                desc(Notification.priority == 'urgent'),
                desc(Notification.is_read == False),
                desc(Notification.created_at)
            ).limit(20).all()
            
            # Get counts efficiently
            unread_count = self.db.query(func.count(Notification.notification_id)).filter(
                and_(
                    Notification.user_id == user_id,
                    Notification.is_read == False,
                    or_(
                        Notification.expires_at.is_(None),
                        Notification.expires_at > datetime.now(timezone.utc)
                    )
                )
            ).scalar() or 0
            
            urgent_count = self.db.query(func.count(Notification.notification_id)).filter(
                and_(
                    Notification.user_id == user_id,
                    Notification.priority.in_(['urgent', 'critical']),
                    Notification.is_read == False,
                    or_(
                        Notification.expires_at.is_(None),
                        Notification.expires_at > datetime.now(timezone.utc)
                    )
                )
            ).scalar() or 0
            
            # Check if there are more notifications
            total_count = self.db.query(func.count(Notification.notification_id)).filter(
                and_(
                    Notification.user_id == user_id,
                    or_(
                        Notification.expires_at.is_(None),
                        Notification.expires_at > datetime.now(timezone.utc)
                    )
                )
            ).scalar() or 0
            
            return NotificationDropdownResponse(
                notifications=[notification.to_dict() for notification in notifications],
                unread_count=unread_count,
                urgent_count=urgent_count,
                has_more=total_count > 20,
                last_checked=datetime.now(timezone.utc)
            )
            
        except Exception as e:
            logger.error(f"Failed to get notification dropdown: {str(e)}")
            raise
    
    async def mark_as_read(self, notification_id: int, user_id: int) -> bool:
        """Mark a notification as read with user verification."""
        try:
            notification = self.db.query(Notification).filter(
                and_(
                    Notification.notification_id == notification_id,
                    Notification.user_id == user_id
                )
            ).first()
            
            if not notification:
                return False
            
            notification.is_read = True
            notification.delivery_status = 'read'
            notification.updated_at = datetime.now(timezone.utc)
            
            self.db.commit()
            logger.info(f"Marked notification {notification_id} as read for user {user_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to mark notification as read: {str(e)}")
            return False
    
    async def mark_all_as_read(self, user_id: int) -> int:
        """Mark all unread notifications as read for a user."""
        try:
            result = self.db.query(Notification).filter(
                and_(
                    Notification.user_id == user_id,
                    Notification.is_read == False
                )
            ).update({
                'is_read': True,
                'delivery_status': 'read',
                'updated_at': datetime.now(timezone.utc)
            }, synchronize_session=False)
            
            self.db.commit()
            logger.info(f"Marked {result} notifications as read for user {user_id}")
            return result
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to mark all notifications as read: {str(e)}")
            return 0
    
    async def bulk_update_notifications(self, user_id: int, data: NotificationBulkUpdate) -> int:
        """Enterprise bulk update for performance at scale."""
        try:
            query = self.db.query(Notification).filter(
                and_(
                    Notification.notification_id.in_(data.notification_ids),
                    Notification.user_id == user_id  # Security: only user's notifications
                )
            )
            
            update_data = {'updated_at': datetime.now(timezone.utc)}
            if data.is_read is not None:
                update_data['is_read'] = data.is_read
            if data.delivery_status is not None:
                update_data['delivery_status'] = data.delivery_status
            
            result = query.update(update_data, synchronize_session=False)
            self.db.commit()
            
            logger.info(f"Bulk updated {result} notifications for user {user_id}")
            return result
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to bulk update notifications: {str(e)}")
            return 0
    
    async def delete_notification(self, notification_id: int, user_id: int) -> bool:
        """Delete a notification with user verification."""
        try:
            notification = self.db.query(Notification).filter(
                and_(
                    Notification.notification_id == notification_id,
                    Notification.user_id == user_id
                )
            ).first()
            
            if not notification:
                return False
            
            self.db.delete(notification)
            self.db.commit()
            
            logger.info(f"Deleted notification {notification_id} for user {user_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to delete notification: {str(e)}")
            return False
    
    async def cleanup_expired_notifications(self) -> int:
        """Enterprise cleanup job for expired notifications."""
        try:
            result = self.db.query(Notification).filter(
                and_(
                    Notification.expires_at.isnot(None),
                    Notification.expires_at < datetime.now(timezone.utc)
                )
            ).update({
                'delivery_status': 'expired'
            }, synchronize_session=False)
            
            self.db.commit()
            logger.info(f"Marked {result} notifications as expired")
            return result
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to cleanup expired notifications: {str(e)}")
            return 0
    
    async def get_notification_stats(self, user_id: int) -> NotificationStats:
        """Get comprehensive notification statistics."""
        try:
            # Use efficient aggregation queries
            total_notifications = self.db.query(func.count(Notification.notification_id)).filter(
                Notification.user_id == user_id
            ).scalar() or 0
            
            unread_count = self.db.query(func.count(Notification.notification_id)).filter(
                and_(Notification.user_id == user_id, Notification.is_read == False)
            ).scalar() or 0
            
            read_count = total_notifications - unread_count
            
            urgent_count = self.db.query(func.count(Notification.notification_id)).filter(
                and_(
                    Notification.user_id == user_id,
                    Notification.priority.in_(['urgent', 'critical']),
                    Notification.is_read == False
                )
            ).scalar() or 0
            
            critical_count = self.db.query(func.count(Notification.notification_id)).filter(
                and_(
                    Notification.user_id == user_id,
                    Notification.priority == 'critical',
                    Notification.is_read == False
                )
            ).scalar() or 0
            
            expired_count = self.db.query(func.count(Notification.notification_id)).filter(
                and_(
                    Notification.user_id == user_id,
                    Notification.expires_at < datetime.now(timezone.utc)
                )
            ).scalar() or 0
            
            # Delivery status breakdown
            delivery_stats = {}
            for status in ['pending', 'delivered', 'read', 'failed', 'expired']:
                count = self.db.query(func.count(Notification.notification_id)).filter(
                    and_(Notification.user_id == user_id, Notification.delivery_status == status)
                ).scalar() or 0
                delivery_stats[status] = count
            
            # Type breakdown
            type_stats = self.db.query(
                Notification.type, func.count(Notification.notification_id)
            ).filter(
                Notification.user_id == user_id
            ).group_by(Notification.type).all()
            
            type_breakdown = {type_name: count for type_name, count in type_stats}
            
            return NotificationStats(
                total_notifications=total_notifications,
                unread_count=unread_count,
                read_count=read_count,
                urgent_count=urgent_count,
                critical_count=critical_count,
                expired_count=expired_count,
                delivery_stats=delivery_stats,
                type_breakdown=type_breakdown
            )
            
        except Exception as e:
            logger.error(f"Failed to get notification stats: {str(e)}")
            raise

    async def create_system_notification(
        self, 
        title: str, 
        content: str, 
        notification_type: str,
        priority: str = 'normal',
        target_users: Optional[List[int]] = None
    ) -> List[Notification]:
        """Create system-wide notifications for enterprise announcements."""
        try:
            notifications = []
            
            if target_users:
                # Create for specific users
                for user_id in target_users:
                    notification_data = NotificationCreate(
                        user_id=user_id,
                        type=notification_type,
                        title=title,
                        content=content,
                        priority=priority,
                        notification_data={
                            'system_notification': True,
                            'broadcast': False
                        }
                    )
                    notification = await self.create_notification(notification_data)
                    notifications.append(notification)
            else:
                # Create for all users (enterprise broadcast)
                # This would typically use a background job for 10M+ users
                logger.info(f"Creating system broadcast notification: {title}")
                # For demo, create a template notification
                notification_data = NotificationCreate(
                    user_id=None,  # System notification
                    type=notification_type,
                    title=title,
                    content=content,
                    priority=priority,
                    notification_data={
                        'system_notification': True,
                        'broadcast': True,
                        'target_all_users': True
                    }
                )
                notification = await self.create_notification(notification_data)
                notifications.append(notification)
            
            return notifications
            
        except Exception as e:
            logger.error(f"Failed to create system notification: {str(e)}")
            raise