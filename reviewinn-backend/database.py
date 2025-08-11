from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
import os
from dotenv import load_dotenv
from core.config.settings import get_settings

# Load service-specific configuration
load_dotenv(dotenv_path=".env")            # All configuration now in service-specific file

# Get settings
settings = get_settings()

# Database configuration
DATABASE_URL = settings.DATABASE_URL

# Database configuration with support for SQLite and PostgreSQL
if DATABASE_URL.startswith("sqlite"):
    # SQLite configuration
    engine = create_engine(
        DATABASE_URL,
        echo=settings.DEBUG,
        connect_args={"check_same_thread": False}  # Required for SQLite with FastAPI
    )
else:
    # PostgreSQL configuration with enhanced connection pooling
    engine = create_engine(
        DATABASE_URL,
        poolclass=QueuePool,                           # ✅ Proper connection pooling
        pool_size=settings.DATABASE_POOL_SIZE,        # ✅ Configurable pool size
        max_overflow=settings.DATABASE_MAX_OVERFLOW,  # ✅ Handle traffic spikes
        pool_pre_ping=True,                           # ✅ Connection validation
        pool_recycle=settings.DATABASE_POOL_TIMEOUT,  # ✅ Prevent stale connections
        echo=settings.DEBUG,                          # ✅ Environment-based logging
        connect_args={
            "options": "-c timezone=utc"              # ✅ Set timezone
        }
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

# Metadata for database operations
metadata = MetaData()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Database health check
def check_database_connection():
    try:
        with engine.connect() as connection:
            from sqlalchemy import text
            result = connection.execute(text("SELECT 1")).fetchone()
        print("✅ Database connection successful")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False 

# Check if required tables exist
def check_db_tables():
    """
    Check if all required database tables exist.
    Returns a tuple of (success, message)
    """
    try:
        required_tables = [
            'users', 'entities', 'reviews', 'comments', 
            'review_reactions', 'comment_reactions', 'user_entity_views',
            'badges', 'user_badges'
        ]
        
        with engine.connect() as connection:
            from sqlalchemy import text, inspect
            inspector = inspect(engine)
            existing_tables = inspector.get_table_names()
            
            missing_tables = [table for table in required_tables if table not in existing_tables]
            
            if missing_tables:
                return (False, f"Missing required tables: {', '.join(missing_tables)}")
            else:
                return (True, "All required tables exist")
    except Exception as e:
        return (False, f"Failed to check tables: {str(e)}")