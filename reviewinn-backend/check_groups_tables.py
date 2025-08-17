#!/usr/bin/env python3
"""
Script to check if groups tables exist and create them if needed
"""
import os
import sys
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_and_create_groups_tables():
    """Check if groups tables exist and create them if needed"""
    try:
        # Get database URL from environment
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            print("ERROR: DATABASE_URL not found in environment variables")
            return False
        
        # Connect to database
        print("Connecting to database...")
        conn = psycopg2.connect(database_url)
        conn.autocommit = True
        
        with conn.cursor() as cursor:
            # Check if review_groups table exists
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'review_groups'
                );
            """)
            
            table_exists = cursor.fetchone()[0]
            
            if table_exists:
                print("✅ Groups tables already exist")
                return True
            
            print("❌ Groups tables don't exist. Creating them...")
            
            # Read and execute the migration SQL file
            migration_path = 'migrations/create_group_system.sql'
            if not os.path.exists(migration_path):
                print(f"ERROR: Migration file not found at {migration_path}")
                return False
            
            with open(migration_path, 'r') as f:
                sql_content = f.read()
            
            print("Running groups migration...")
            cursor.execute(sql_content)
            print("✅ Groups tables created successfully!")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = check_and_create_groups_tables()
    sys.exit(0 if success else 1)
