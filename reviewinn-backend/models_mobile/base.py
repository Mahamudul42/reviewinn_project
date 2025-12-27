"""
Base configuration for mobile-optimized models
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

# Base class for all models
Base = declarative_base()

# Helper function for UUID primary keys
def generate_uuid():
    return str(uuid.uuid4())
