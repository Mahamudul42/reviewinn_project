"""
Database Migration: Add view_count column to entities table
Run this migration to add view tracking support for entities
"""
from sqlalchemy import text
from database import engine

def add_entity_view_count_column():
    """
    Add view_count column to entities table if it doesn't exist
    """
    try:
        with engine.connect() as connection:
            # Check if column already exists
            result = connection.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='entities' AND column_name='view_count'
            """))
            
            if not result.fetchone():
                # Add the column if it doesn't exist
                connection.execute(text("""
                    ALTER TABLE entities 
                    ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0
                """))
                
                # Create index for performance
                connection.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_entities_view_count 
                    ON entities(view_count)
                """))
                
                connection.commit()
                print("✅ Successfully added view_count column to entities table")
            else:
                print("ℹ️ view_count column already exists in entities table")
                
    except Exception as e:
        print(f"❌ Error adding view_count column: {str(e)}")
        raise

if __name__ == "__main__":
    add_entity_view_count_column()