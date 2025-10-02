#!/usr/bin/env python3
"""
Script to clean up unnecessary tables created during group redesign.
These tables are not needed since we're using the existing review system.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from database import get_db

def cleanup_unused_tables():
    """Drop unnecessary tables and related objects."""
    db = next(get_db())
    
    cleanup_queries = [
        # Drop tables in correct order (respecting foreign keys)
        "DROP TABLE IF EXISTS group_notifications CASCADE",
        "DROP TABLE IF EXISTS group_activities CASCADE", 
        "DROP TABLE IF EXISTS group_post_reactions CASCADE",
        "DROP TABLE IF EXISTS group_post_comments CASCADE",
        "DROP TABLE IF EXISTS group_post_media CASCADE",
        "DROP TABLE IF EXISTS group_posts CASCADE",
        
        # Drop views
        "DROP VIEW IF EXISTS v_active_group_posts CASCADE",
        "DROP VIEW IF EXISTS v_group_activity_feed CASCADE",
        
        # Drop functions
        "DROP FUNCTION IF EXISTS update_group_posts_count() CASCADE",
        "DROP FUNCTION IF EXISTS update_post_comments_count() CASCADE",
        "DROP FUNCTION IF EXISTS update_reaction_counts() CASCADE",
    ]
    
    print("Starting cleanup of unused tables...")
    
    for query in cleanup_queries:
        try:
            print(f"Executing: {query}")
            db.execute(text(query))
            db.commit()
            print("✓ Success")
        except Exception as e:
            print(f"✗ Error: {e}")
            db.rollback()
    
    # Remove unnecessary columns from existing tables
    print("\nRemoving unnecessary columns...")
    column_drops = [
        ("review_groups", "posts_count"),
        ("group_memberships", "posts_count"),
        ("group_memberships", "comments_count"),
    ]
    
    for table_name, column_name in column_drops:
        try:
            check_query = text(f"""
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = '{table_name}' AND column_name = '{column_name}'
            """)
            result = db.execute(check_query).fetchone()
            
            if result:
                drop_query = text(f"ALTER TABLE {table_name} DROP COLUMN IF EXISTS {column_name}")
                print(f"Executing: ALTER TABLE {table_name} DROP COLUMN IF EXISTS {column_name}")
                db.execute(drop_query)
                db.commit()
                print(f"✓ Dropped {table_name}.{column_name}")
            else:
                print(f"- Column {table_name}.{column_name} doesn't exist (already clean)")
        except Exception as e:
            print(f"✗ Error dropping {table_name}.{column_name}: {e}")
            db.rollback()
    
    print("\n✅ Cleanup completed!")
    
    # Verify cleanup
    print("\nVerifying cleanup...")
    verify_query = text("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'group_%'
        ORDER BY table_name
    """)
    remaining_tables = db.execute(verify_query).fetchall()
    
    print("\nRemaining group-related tables:")
    for table in remaining_tables:
        print(f"  - {table[0]}")
    
    db.close()

if __name__ == "__main__":
    cleanup_unused_tables()
