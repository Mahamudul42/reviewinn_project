#!/usr/bin/env python3
"""
Category Migration Script
Migrates from old categories/subcategories tables to unified_categories using category_structure.json
"""

import json
import os
import sys
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def slugify(text: str) -> str:
    """Convert text to URL-friendly slug"""
    import re
    slug = re.sub(r'[^a-z0-9\s-]', '', text.lower())
    slug = re.sub(r'[\s_-]+', '-', slug)
    return slug.strip('-')

def create_unified_category(session, name: str, parent_id: Optional[int] = None, 
                          level: int = 1, path: str = "", sort_order: int = 0) -> int:
    """Create a unified category and return its ID"""
    slug = slugify(name)
    
    # Build path
    if parent_id:
        parent_result = session.execute(text("SELECT path FROM unified_categories WHERE id = :parent_id"), 
                                      {"parent_id": parent_id})
        parent_path = parent_result.fetchone()
        if parent_path:
            new_path = f"{parent_path[0]}.{slug}" if parent_path[0] else slug
        else:
            new_path = slug
    else:
        new_path = slug
    
    # Insert the category
    result = session.execute(text("""
        INSERT INTO unified_categories (name, slug, parent_id, path, level, sort_order, is_active, created_at, updated_at)
        VALUES (:name, :slug, :parent_id, :path, :level, :sort_order, true, NOW(), NOW())
        RETURNING id
    """), {
        "name": name,
        "slug": slug,
        "parent_id": parent_id,
        "path": new_path,
        "level": level,
        "sort_order": sort_order
    })
    
    category_id = result.fetchone()[0]
    logger.info(f"Created category: {name} (ID: {category_id}, Level: {level})")
    return category_id

def process_category_structure(session, categories: List[Dict[str, Any]], 
                             parent_id: Optional[int] = None, level: int = 1) -> None:
    """Recursively process category structure"""
    for idx, category in enumerate(categories):
        if isinstance(category, dict):
            # This is a nested category with subcategories
            category_name = category["name"]
            category_id = create_unified_category(session, category_name, parent_id, level, sort_order=idx)
            
            # Process subcategories if they exist
            if "category" in category:
                process_category_structure(session, category["category"], category_id, level + 1)
        else:
            # This is a leaf category (string)
            create_unified_category(session, category, parent_id, level, sort_order=idx)

def migrate_categories():
    """Main migration function"""
    
    # Database connection
    DATABASE_URL = os.environ.get("DATABASE_URL", 
                                 "postgresql://review_user:ReviewInn2024!SecurePass#Dev@localhost:5432/review_platform")
    
    # Read category structure
    script_dir = os.path.dirname(os.path.abspath(__file__))
    category_file = os.path.join(script_dir, "category_structure.json")
    
    if not os.path.exists(category_file):
        logger.error(f"Category structure file not found: {category_file}")
        sys.exit(1)
    
    with open(category_file, 'r') as f:
        data = json.load(f)
    
    logger.info(f"Loaded category structure from {category_file}")
    
    # Create database connection
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Start transaction
        session.begin()
        
        logger.info("Starting category migration...")
        
        # Step 1: Clear existing data from unified_categories
        logger.info("Clearing existing unified_categories data...")
        session.execute(text("DELETE FROM unified_categories"))
        
        # Step 2: Clear existing data from old category tables
        logger.info("Clearing old category/subcategory data...")
        session.execute(text("DELETE FROM entity_subcategories"))
        session.execute(text("DELETE FROM subcategories"))
        session.execute(text("DELETE FROM categories"))
        
        # Step 3: Reset sequences
        logger.info("Resetting sequences...")
        session.execute(text("ALTER SEQUENCE unified_categories_id_seq RESTART WITH 1"))
        session.execute(text("ALTER SEQUENCE categories_category_id_seq RESTART WITH 1"))
        session.execute(text("ALTER SEQUENCE subcategories_subcategory_id_seq RESTART WITH 1"))
        
        # Step 4: Import new category structure
        logger.info("Importing new category structure...")
        
        # Process main categories directly (Professionals, Companies/Institutes, Places, Products)
        if "category" in data:
            process_category_structure(session, data["category"], None, 1)
        
        # Step 5: Update entities to use default category references
        logger.info("Setting entities to use default category values...")
        session.execute(text("UPDATE entities SET category = 'professionals', subcategory = NULL, unified_category_id = NULL"))
        
        # Commit the transaction
        session.commit()
        logger.info("Migration completed successfully!")
        
        # Print summary
        result = session.execute(text("SELECT COUNT(*) FROM unified_categories"))
        total_categories = result.fetchone()[0]
        logger.info(f"Total categories created: {total_categories}")
        
        # Show root level categories
        logger.info("Root level categories:")
        result = session.execute(text("""
            SELECT id, name, level FROM unified_categories 
            WHERE parent_id IS NULL
            ORDER BY sort_order, name
        """))
        
        for row in result.fetchall():
            logger.info(f"  - {row[1]} (ID: {row[0]}, Level: {row[2]})")
            
    except Exception as e:
        session.rollback()
        logger.error(f"Migration failed: {str(e)}")
        raise
    finally:
        session.close()

def validate_migration():
    """Validate the migration was successful"""
    DATABASE_URL = os.environ.get("DATABASE_URL", 
                                 "postgresql://review_user:ReviewInn2024!SecurePass#Dev@localhost:5432/review_platform")
    
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Check if categories were created
        result = session.execute(text("SELECT COUNT(*) FROM unified_categories"))
        count = result.fetchone()[0]
        
        if count > 0:
            logger.info(f"✅ Migration validation passed: {count} categories found")
            
            # Show structure
            result = session.execute(text("""
                SELECT id, name, level, path, parent_id 
                FROM unified_categories 
                ORDER BY level, sort_order, name
                LIMIT 10
            """))
            
            logger.info("Sample categories:")
            for row in result.fetchall():
                indent = "  " * (row[2] - 1)
                logger.info(f"{indent}- {row[1]} (ID: {row[0]}, Level: {row[2]}, Path: {row[3]})")
                
            return True
        else:
            logger.error("❌ Migration validation failed: No categories found")
            return False
            
    except Exception as e:
        logger.error(f"❌ Migration validation failed: {str(e)}")
        return False
    finally:
        session.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Migrate categories to unified structure")
    parser.add_argument("--validate", action="store_true", help="Validate migration without running it")
    parser.add_argument("--force", action="store_true", help="Force migration even if data exists")
    
    args = parser.parse_args()
    
    if args.validate:
        validate_migration()
    else:
        # Check if user wants to proceed
        if not args.force:
            response = input("⚠️  This will delete all existing category data. Continue? (y/N): ")
            if response.lower() != 'y':
                logger.info("Migration cancelled by user")
                sys.exit(0)
        
        migrate_categories()
        
        # Validate after migration
        logger.info("\nValidating migration...")
        if validate_migration():
            logger.info("🎉 Migration completed and validated successfully!")
        else:
            logger.error("💥 Migration completed but validation failed!")
            sys.exit(1)