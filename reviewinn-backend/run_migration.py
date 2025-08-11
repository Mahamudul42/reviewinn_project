#!/usr/bin/env python3
"""
Script to run the unified categories migration
"""
import os
import sys
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def run_migration():
    """Run the unified categories migration"""
    try:
        # Get database URL from environment
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            print("ERROR: DATABASE_URL not found in environment variables")
            return False
        
        # Read the migration SQL file
        migration_path = '../database/unified_categories_migration.sql'
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
            print("Running unified categories migration...")
            cursor.execute(sql_content)
            print("✅ Migration completed successfully!")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)