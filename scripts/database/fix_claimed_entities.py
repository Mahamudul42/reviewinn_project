#!/usr/bin/env python3
"""
Fix script to set is_claimed=True for entities that have claimed_by set but is_claimed=False
"""

import sys
import os

# Add the project root to Python path
sys.path.append('/home/hasan181/personal/my_project/reviewsite/reviewsite-backend')

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from database import engine
from models.entity import Entity

def fix_claimed_entities():
    """Fix entities that have claimed_by set but is_claimed is False"""
    
    # Create database connection
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Find entities that have claimed_by but is_claimed is False
        entities_to_fix = db.query(Entity).filter(
            Entity.claimed_by.isnot(None),
            Entity.is_claimed == False
        ).all()
        
        print(f"Found {len(entities_to_fix)} entities to fix:")
        
        for entity in entities_to_fix:
            print(f"  - Entity {entity.entity_id}: {entity.name} (claimed_by: {entity.claimed_by})")
            entity.is_claimed = True
        
        # Commit the changes
        db.commit()
        print(f"\n✅ Successfully fixed {len(entities_to_fix)} entities")
        
        # Verify the fix
        verification = db.query(Entity).filter(
            Entity.claimed_by.isnot(None),
            Entity.is_claimed == False
        ).count()
        
        print(f"🔍 Verification: {verification} entities still need fixing")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error fixing entities: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_claimed_entities()