"""
Database configuration and connection management.
Centralizes database setup with proper connection pooling and health checks.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from typing import Generator
import logging

from .settings import get_settings

logger = logging.getLogger(__name__)

# Create base class for models
Base = declarative_base()

# Global engine and session maker
engine = None
SessionLocal = None


def create_database_engine():
    """Create database engine with proper configuration."""
    global engine
    
    if engine is not None:
        return engine
    
    settings = get_settings()
    
    engine = create_engine(
        settings.database.url,
        poolclass=QueuePool,
        pool_size=20,
        max_overflow=30,
        pool_pre_ping=True,
        pool_recycle=3600,  # 1 hour
        echo=settings.debug and settings.is_development,
        future=True
    )
    
    logger.info(f"Database engine created for {settings.database.host}:{settings.database.port}")
    return engine


def create_session_maker():
    """Create session maker."""
    global SessionLocal
    
    if SessionLocal is not None:
        return SessionLocal
    
    if engine is None:
        create_database_engine()
    
    SessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine
    )
    
    return SessionLocal


def get_db() -> Generator[Session, None, None]:
    """
    Database dependency for FastAPI.
    Provides a database session with automatic cleanup.
    """
    if SessionLocal is None:
        create_session_maker()
    
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def check_database_connection() -> bool:
    """
    Check if database connection is healthy.
    Returns True if connection is successful, False otherwise.
    """
    try:
        if engine is None:
            create_database_engine()
        
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False


def check_database_tables() -> tuple[bool, str]:
    """
    Check if required database tables exist.
    Returns (success, message) tuple.
    """
    try:
        if engine is None:
            create_database_engine()
        
        # List of critical tables that must exist
        required_tables = [
            'users', 'entities', 'reviews', 'unified_categories',
            'category_questions', 'notifications', 'user_sessions'
        ]
        
        with engine.connect() as connection:
            # Check if tables exist
            for table in required_tables:
                result = connection.execute(text(
                    "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = :table_name)"
                ), {"table_name": table})
                
                if not result.scalar():
                    return False, f"Required table '{table}' not found"
        
        return True, "All required tables exist"
    
    except Exception as e:
        logger.error(f"Database table check failed: {e}")
        return False, f"Error checking tables: {str(e)}"


def init_database():
    """
    Initialize database with tables.
    Should be called during application startup.
    """
    try:
        if engine is None:
            create_database_engine()
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        
        # Verify connection
        if check_database_connection():
            logger.info("Database connection verified")
        else:
            logger.error("Database connection verification failed")
    
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise


def close_database():
    """
    Clean up database connections.
    Should be called during application shutdown.
    """
    global engine, SessionLocal
    
    try:
        if SessionLocal:
            SessionLocal.close_all()
        
        if engine:
            engine.dispose()
            logger.info("Database connections closed")
    
    except Exception as e:
        logger.error(f"Error closing database connections: {e}")
    
    finally:
        engine = None
        SessionLocal = None