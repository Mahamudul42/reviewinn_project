from sqlalchemy.orm import Session
from models.notification import Notification
from typing import List, Optional

class NotificationRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, notification: Notification) -> Notification:
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def get_by_id(self, notification_id: int) -> Optional[Notification]:
        return self.db.query(Notification).filter(Notification.notification_id == notification_id).first()

    def get_user_notifications(self, user_id: int) -> List[Notification]:
        return self.db.query(Notification).filter(Notification.user_id == user_id).all()

    def mark_as_read(self, notification_id: int) -> Optional[Notification]:
        notification = self.get_by_id(notification_id)
        if notification:
            notification.is_read = True  # Fixed: was 'read', should be 'is_read'
            self.db.commit()
            self.db.refresh(notification)
        return notification 