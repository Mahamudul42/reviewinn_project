"""
User Connection Model - Mobile Optimized (Circle/Follow System)
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from database import Base


class UserConnection(Base):
    __tablename__ = "user_connections"

    # Primary Key
    connection_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    from_user_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False, index=True)
    to_user_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False, index=True)

    connection_type = Column(String(20), nullable=False, index=True)  # 'follow', 'circle', 'block'

    # JSONB for circle metadata
    metadata = Column(JSONB, default={})  # {"trust_level": "trusted_reviewer", "taste_match": 85, "notes": "..."}

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Constraints
    __table_args__ = (
        UniqueConstraint('from_user_id', 'to_user_id', 'connection_type', name='unique_connection'),
        CheckConstraint('from_user_id != to_user_id', name='no_self_connection'),
        CheckConstraint(
            "connection_type IN ('follow', 'circle', 'block')",
            name='connection_type_values'
        ),
    )

    # Relationships
    from_user = relationship("User", foreign_keys=[from_user_id])
    to_user = relationship("User", foreign_keys=[to_user_id])

    def __repr__(self):
        return f"<UserConnection(connection_id={self.connection_id}, type='{self.connection_type}')>"

    def to_dict(self):
        return {
            "connection_id": str(self.connection_id),
            "from_user_id": str(self.from_user_id),
            "to_user_id": str(self.to_user_id),
            "connection_type": self.connection_type,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
