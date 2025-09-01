"""
REVIEWINN SESSION MANAGER
========================
Improved database session management for authentication system
"""

import asyncio
import contextlib
from typing import Optional, AsyncGenerator
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from database import get_db
from models.user import User
import logging

logger = logging.getLogger(__name__)

class DatabaseSessionManager:
    """Improved database session management for auth operations"""
    
    def __init__(self):
        self._session_pool = []
        self._lock = asyncio.Lock()
    
    @contextlib.asynccontextmanager
    async def get_session(self) -> AsyncGenerator[Session, None]:
        """Get database session with proper cleanup"""
        db: Optional[Session] = None
        try:
            db = next(get_db())
            yield db
        except SQLAlchemyError as e:
            if db:
                db.rollback()
            logger.error(f"Database session error: {e}")
            raise
        except Exception as e:
            if db:
                db.rollback()
            logger.error(f"Unexpected session error: {e}")
            raise
        finally:
            if db:
                try:
                    db.close()
                except Exception as e:
                    logger.error(f"Error closing session: {e}")
    
    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID with proper session management"""
        try:
            async with self.get_session() as db:
                user = db.query(User).filter(User.user_id == user_id).first()
                if user:
                    # Detach from session to avoid lazy loading issues
                    db.expunge(user)
                return user
        except Exception as e:
            logger.error(f"Error getting user {user_id}: {e}")
            return None
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email with proper session management"""
        try:
            async with self.get_session() as db:
                user = db.query(User).filter(User.email == email).first()
                if user:
                    # Detach from session to avoid lazy loading issues
                    db.expunge(user)
                return user
        except Exception as e:
            logger.error(f"Error getting user by email {email}: {e}")
            return None
    
    async def update_user_activity(self, user_id: int) -> bool:
        """Update user last activity with proper session management"""
        try:
            async with self.get_session() as db:
                from datetime import datetime, timezone
                
                db.query(User).filter(User.user_id == user_id).update({
                    'last_login_at': datetime.now(timezone.utc)
                })
                db.commit()
                return True
        except Exception as e:
            logger.error(f"Error updating user activity for {user_id}: {e}")
            return False
    
    async def update_user_password(self, user_id: int, hashed_password: str) -> bool:
        """Update user password with proper session management"""
        try:
            async with self.get_session() as db:
                from datetime import datetime, timezone
                
                db.query(User).filter(User.user_id == user_id).update({
                    'hashed_password': hashed_password,
                    'password_changed_at': datetime.now(timezone.utc)
                })
                db.commit()
                return True
        except Exception as e:
            logger.error(f"Error updating password for user {user_id}: {e}")
            return False

# Global session manager instance
_session_manager: Optional[DatabaseSessionManager] = None

def get_session_manager() -> DatabaseSessionManager:
    """Get database session manager singleton"""
    global _session_manager
    if _session_manager is None:
        _session_manager = DatabaseSessionManager()
    return _session_manager