#!/usr/bin/env python3
"""
Script to insert hierarchical categories from category_structure.json into unified_categories table
"""

import json
import psycopg2
from datetime import datetime


def slugify(text):
    """Convert text to URL-friendly slug"""
    import re
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')


def get_icon_for_category(name):
    """Get emoji icon based on category name"""
    icons = {
        # Root categories
        'professionals': '👨‍💼',
        'companies/institutes': '🏢',
        'places': '📍',
        'products': '📦',
        'other': '🔧',
        
        # Professionals subcategories
        'education': '🎓',
        'healthcare': '⚕️',
        'legal': '⚖️',
        'engineering': '🛠️',
        'information technology': '💻',
        'business': '💼',
        'finance': '💰',
        'creative arts': '🎨',
        'media': '📺',
        'public services': '🏛️',
        'hospitality': '🍽️',
        'skilled trades': '🔧',
        
        # Companies subcategories
        'technology': '💻',
        'manufacturing': '🏭',
        'retail': '🛍️',
        'government agencies': '🏛️',
        'non-profits': '🤝',
        
        # Places subcategories
        'tourism': '🗺️',
        'recreation': '🎮',
        
        # Products subcategories
        'electronics': '📱',
        'fashion': '👗',
        'food & beverages': '🍔',
        'home & kitchen': '🏠',
        'health & beauty': '💄',
        'automotive': '🚗',
        'sports & outdoors': '⚽',
    }
    return icons.get(name.lower(), '📂')


def get_color_for_level(level):
    """Get color based on category level"""
    colors = {
        1: 'blue',      # Root categories
        2: 'green',     # Subcategories  
        3: 'purple'     # Final categories
    }
    return colors.get(level, 'gray')


def insert_categories():
    # Database connection
    conn = psycopg2.connect(
        host="localhost",
        port="5432",
        database="reviewinn_db",
        user="reviewinn_user",
        password="jtQ8UGVg9YAT7!eTwbVAGKuZ29YHV%Ax"
    )
    cur = conn.cursor()
    
    # Load JSON data
    with open('category_structure.json', 'r') as f:
        data = json.load(f)
    
    def insert_category_recursive(category_data, parent_id=None, level=1, path_prefix=""):
        """Recursively insert categories and subcategories"""
        
        if isinstance(category_data, str):
            # This is a leaf category (final subcategory)
            name = category_data
            slug = slugify(name)
            path = f"{path_prefix}/{slug}" if path_prefix else slug
            icon = get_icon_for_category(name)
            color = get_color_for_level(level)
            
            cur.execute("""
                INSERT INTO unified_categories (name, slug, description, parent_id, path, level, icon, color, is_active, sort_order, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                name, slug, f"{name} category", parent_id, path, level, 
                icon, color, True, 1, datetime.now(), datetime.now()
            ))
            
            category_id = cur.fetchone()[0]
            print(f"Inserted leaf category: {name} (ID: {category_id}, Level: {level})")
            return category_id
            
        elif isinstance(category_data, dict):
            # This is a category with subcategories
            name = category_data['name']
            slug = slugify(name)
            path = f"{path_prefix}/{slug}" if path_prefix else slug
            icon = get_icon_for_category(name)
            color = get_color_for_level(level)
            
            cur.execute("""
                INSERT INTO unified_categories (name, slug, description, parent_id, path, level, icon, color, is_active, sort_order, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                name, slug, f"{name} category with subcategories", parent_id, path, level,
                icon, color, True, 1, datetime.now(), datetime.now()
            ))
            
            category_id = cur.fetchone()[0]
            print(f"Inserted category: {name} (ID: {category_id}, Level: {level})")
            
            # Process subcategories
            if 'category' in category_data:
                for i, subcategory in enumerate(category_data['category']):
                    insert_category_recursive(subcategory, category_id, level + 1, path)
            
            return category_id
    
    try:
        # Process root categories
        root_categories = data['category']
        for root_category in root_categories:
            insert_category_recursive(root_category)
        
        conn.commit()
        print("✅ Successfully inserted all categories!")
        
        # Verify insertion
        cur.execute("SELECT COUNT(*) FROM unified_categories")
        count = cur.fetchone()[0]
        print(f"📊 Total categories inserted: {count}")
        
        # Show structure
        cur.execute("""
            SELECT level, COUNT(*) as count 
            FROM unified_categories 
            GROUP BY level 
            ORDER BY level
        """)
        results = cur.fetchall()
        print("📈 Categories by level:")
        for level, count in results:
            print(f"  Level {level}: {count} categories")
            
    except Exception as e:
        conn.rollback()
        print(f"❌ Error inserting categories: {e}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    insert_categories()