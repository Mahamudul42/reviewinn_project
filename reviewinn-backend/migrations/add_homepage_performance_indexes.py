"""
Migration: Add performance indexes for homepage queries
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from datetime import datetime

def run_migration():
    """Add performance indexes for homepage queries"""
    
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("ERROR: DATABASE_URL not found in environment variables")
        return False
    
    try:
        # Create engine
        engine = create_engine(database_url)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        print("Adding performance indexes for homepage queries...")
        
        # Indexes for reviews table
        session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_reviews_created_at 
            ON reviews(created_at DESC);
        """))
        
        session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_reviews_user_id 
            ON reviews(user_id);
        """))
        
        session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_reviews_entity_id 
            ON reviews(entity_id);
        """))
        
        # Indexes for comments table
        session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_comments_review_id 
            ON comments(review_id);
        """))
        
        # Indexes for review_reactions table
        session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_review_reactions_review_id 
            ON review_reactions(review_id);
        """))
        
        # Indexes for entities table
        session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_entities_review_count 
            ON entities(review_count DESC, average_rating DESC);
        """))
        
        session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_entities_category 
            ON entities(category);
        """))
        
        # Indexes for users table
        session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_users_user_id 
            ON users(user_id);
        """))
        
        # Composite indexes for common query patterns
        session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_reviews_entity_created 
            ON reviews(entity_id, created_at DESC);
        """))
        
        session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_reviews_user_created 
            ON reviews(user_id, created_at DESC);
        """))
        
        session.commit()
        print("✅ Performance indexes added successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        session.rollback()
        return False
    finally:
        session.close()

if __name__ == "__main__":
    run_migration() 