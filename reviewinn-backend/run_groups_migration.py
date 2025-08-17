#!/usr/bin/env python3
"""
Script to run the groups migration
"""
import os
import sys
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def run_groups_migration():
    """Run the groups migration"""
    try:
        # Get database URL from environment
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            print("ERROR: DATABASE_URL not found in environment variables")
            return False
        
        # Read the migration SQL file
        migration_path = 'migrations/create_group_system.sql'
        if not os.path.exists(migration_path):
            print(f"ERROR: Migration file not found at {migration_path}")
            return False
        
        with open(migration_path, 'r') as f:
            sql_content = f.read()
        
        # Connect to database and run migration
        print("Connecting to database...")
        conn = psycopg2.connect(database_url)
        conn.autocommit = True
        
        with conn.cursor() as cursor:
            print("Running groups migration...")
            cursor.execute(sql_content)
            print("✅ Groups migration completed successfully!")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

if __name__ == "__main__":
    success = run_groups_migration()
    sys.exit(0 if success else 1)
