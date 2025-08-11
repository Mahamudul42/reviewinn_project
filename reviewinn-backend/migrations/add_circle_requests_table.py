#!/usr/bin/env python3
"""
Migration to add circle_requests table for circle requests functionality.
"""

import psycopg2
import os

def get_db_connection():
    """Get database connection from environment variables."""
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        database=os.getenv('POSTGRES_DB', 'review_platform'),
        user=os.getenv('POSTGRES_USER', 'review_user'),
        password=os.getenv('POSTGRES_PASSWORD', 'review_password_123'),
        port=os.getenv('DB_PORT', '5432')
    )

def run_migration():
    """Run the migration to add circle_requests table."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Create circle_requests table
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS circle_requests (
            request_id SERIAL PRIMARY KEY,
            requester_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            receiver_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            message TEXT,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            responded_at TIMESTAMPTZ,
            UNIQUE(requester_id, receiver_id, status) -- Prevent duplicate pending requests
        );
        """
        
        cursor.execute(create_table_sql)
        print("✅ Created circle_requests table")
        
        # Create indexes for better performance
        index_sql = """
        CREATE INDEX IF NOT EXISTS idx_circle_requests_receiver_status 
        ON circle_requests(receiver_id, status);
        
        CREATE INDEX IF NOT EXISTS idx_circle_requests_requester 
        ON circle_requests(requester_id);
        
        CREATE INDEX IF NOT EXISTS idx_circle_requests_created_at 
        ON circle_requests(created_at);
        """
        
        cursor.execute(index_sql)
        print("✅ Created indexes for circle_requests table")
        
        conn.commit()
        print("✅ Migration completed successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    run_migration()