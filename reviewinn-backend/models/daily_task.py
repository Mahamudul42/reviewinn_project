from sqlalchemy import Column, BigInteger, String, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class DailyTask(Base):
    __tablename__ = 'daily_tasks'

    task_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey('core_users.user_id', ondelete='CASCADE'))
    label = Column(String(100), nullable=False)
    complete = Column(Boolean, default=False, nullable=False)
    task_date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship('User') 