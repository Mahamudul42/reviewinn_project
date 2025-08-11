#!/usr/bin/env python3
"""
Migration to fix circle duplication issues and consolidate database schema.
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
    """Run the migration to fix duplication issues."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        print("🔧 Starting database migration to fix circle duplications...")
        
        # 1. Add unique constraint to circle_connections if not exists
        print("📝 Adding unique constraint to circle_connections...")
        cursor.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conname = 'unique_user_circle_connection'
            ) THEN
                -- First remove any existing duplicates
                DELETE FROM circle_connections a USING (
                    SELECT MIN(connection_id) as id, user_id, circle_id
                    FROM circle_connections 
                    GROUP BY user_id, circle_id HAVING COUNT(*) > 1
                ) b
                WHERE a.user_id = b.user_id 
                AND a.circle_id = b.circle_id 
                AND a.connection_id != b.id;
                
                -- Add the constraint
                ALTER TABLE circle_connections 
                ADD CONSTRAINT unique_user_circle_connection 
                UNIQUE (user_id, circle_id);
            END IF;
        END $$;
        """)
        
        # 2. Add indexes for better performance
        print("📝 Adding performance indexes...")
        cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_circle_connections_user_id ON circle_connections(user_id);
        CREATE INDEX IF NOT EXISTS idx_circle_connections_circle_id ON circle_connections(circle_id);
        CREATE INDEX IF NOT EXISTS idx_circle_connections_trust_level ON circle_connections(trust_level);
        """)
        
        # 3. Add unique constraint to circle_requests if not exists
        print("📝 Adding unique constraint to circle_requests...")
        cursor.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conname = 'unique_pending_request'
            ) THEN
                -- First remove any existing duplicate pending requests
                DELETE FROM circle_requests a USING (
                    SELECT MIN(request_id) as id, requester_id, receiver_id, status
                    FROM circle_requests 
                    WHERE status = 'pending'
                    GROUP BY requester_id, receiver_id, status HAVING COUNT(*) > 1
                ) b
                WHERE a.requester_id = b.requester_id 
                AND a.receiver_id = b.receiver_id 
                AND a.status = b.status
                AND a.request_id != b.id
                AND a.status = 'pending';
                
                -- Add the constraint
                ALTER TABLE circle_requests 
                ADD CONSTRAINT unique_pending_request 
                UNIQUE (requester_id, receiver_id, status);
            END IF;
        END $$;
        """)
        
        # 4. Add indexes for circle_requests
        print("📝 Adding indexes for circle_requests...")
        cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_circle_requests_receiver_status ON circle_requests(receiver_id, status);
        CREATE INDEX IF NOT EXISTS idx_circle_requests_requester ON circle_requests(requester_id);
        CREATE INDEX IF NOT EXISTS idx_circle_requests_created_at ON circle_requests(created_at);
        """)
        
        # 5. Drop the old circle_members table if it exists (since we're using CircleConnection now)
        print("📝 Cleaning up old circle_members table...")
        cursor.execute("""
        DO $$ 
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'circle_members') THEN
                -- Migrate any data from circle_members to circle_connections if needed
                INSERT INTO circle_connections (user_id, circle_id, trust_level, taste_match_score, connected_since, last_interaction, interaction_count)
                SELECT user_id, circle_id, trust_level, taste_match_score, joined_at, last_interaction, interaction_count
                FROM circle_members cm
                WHERE NOT EXISTS (
                    SELECT 1 FROM circle_connections cc 
                    WHERE cc.user_id = cm.user_id AND cc.circle_id = cm.circle_id
                )
                ON CONFLICT (user_id, circle_id) DO NOTHING;
                
                -- Drop the old table
                DROP TABLE IF EXISTS circle_members;
            END IF;
        END $$;
        """)
        
        conn.commit()
        print("✅ Migration completed successfully!")
        print("🎯 Benefits achieved:")
        print("   - Eliminated duplicate circle memberships")
        print("   - Prevented duplicate circle requests")
        print("   - Improved query performance with indexes")
        print("   - Consolidated database schema")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    run_migration()