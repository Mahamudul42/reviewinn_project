-- Migration: Merge categories and subcategories into unified categories table
-- This migration creates a single hierarchical categories table to replace both categories and subcategories

-- Step 1: Create new unified categories table
CREATE TABLE unified_categories (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug VARCHAR(100) NOT NULL,
    parent_id BIGINT REFERENCES unified_categories(id) ON DELETE CASCADE,
    path LTREE,
    level INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(slug, parent_id),
    CONSTRAINT check_level_consistency CHECK (
        (parent_id IS NULL AND level = 1) OR 
        (parent_id IS NOT NULL AND level > 1)
    )
);

-- Create indexes for performance
CREATE INDEX idx_unified_categories_parent_id ON unified_categories(parent_id);
CREATE INDEX idx_unified_categories_slug ON unified_categories(slug);
CREATE INDEX idx_unified_categories_path ON unified_categories USING GIST(path);
CREATE INDEX idx_unified_categories_level ON unified_categories(level);
CREATE INDEX idx_unified_categories_active ON unified_categories(is_active);

-- Create trigger for automatic path updates
CREATE OR REPLACE FUNCTION update_category_path()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.path = NEW.id::text::ltree;
        NEW.level = 1;
    ELSE
        SELECT path || NEW.id::text::ltree, level + 1
        INTO NEW.path, NEW.level
        FROM unified_categories 
        WHERE id = NEW.parent_id;
    END IF;
    
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_category_path
    BEFORE INSERT OR UPDATE ON unified_categories
    FOR EACH ROW EXECUTE FUNCTION update_category_path();

-- Step 2: Migrate existing data
-- Insert root categories first
INSERT INTO unified_categories (name, slug, parent_id, level, description, icon, color, sort_order) VALUES
('Professionals', 'professionals', NULL, 1, 'Individual professionals and service providers', 'users', '#8B5CF6', 1),
('Companies', 'companies', NULL, 1, 'Organizations, businesses, and institutions', 'building', '#10B981', 2),
('Places', 'places', NULL, 1, 'Locations, venues, and physical establishments', 'map-pin', '#F59E0B', 3),
('Products', 'products', NULL, 1, 'Goods, services, and consumable products', 'package', '#EF4444', 4);

-- Migrate existing subcategories data
-- This will be done in phases to maintain data integrity

-- Step 3: Update entities table to reference unified categories
-- First add new column
ALTER TABLE entities ADD COLUMN unified_category_id BIGINT REFERENCES unified_categories(id);

-- Create index for the new column
CREATE INDEX idx_entities_unified_category ON entities(unified_category_id);

-- Step 4: Create mapping function to help with migration
CREATE OR REPLACE FUNCTION get_or_create_unified_category(
    cat_name TEXT,
    subcat_name TEXT DEFAULT NULL,
    parent_category_id BIGINT DEFAULT NULL
) RETURNS BIGINT AS $$
DECLARE
    category_id BIGINT;
    parent_id BIGINT;
    category_slug VARCHAR(100);
BEGIN
    -- Generate slug
    category_slug = lower(regexp_replace(trim(cat_name), '[^a-zA-Z0-9]+', '-', 'g'));
    
    -- If it's a root category (no parent)
    IF parent_category_id IS NULL AND subcat_name IS NULL THEN
        SELECT id INTO category_id 
        FROM unified_categories 
        WHERE slug = category_slug AND parent_id IS NULL;
        
        IF category_id IS NULL THEN
            INSERT INTO unified_categories (name, slug, parent_id, level)
            VALUES (cat_name, category_slug, NULL, 1)
            RETURNING id INTO category_id;
        END IF;
    ELSE
        -- It's a subcategory
        parent_id = COALESCE(parent_category_id, (
            SELECT id FROM unified_categories 
            WHERE slug = lower(regexp_replace(trim(cat_name), '[^a-zA-Z0-9]+', '-', 'g')) 
            AND parent_id IS NULL
        ));
        
        IF parent_id IS NOT NULL THEN
            category_slug = lower(regexp_replace(trim(COALESCE(subcat_name, cat_name)), '[^a-zA-Z0-9]+', '-', 'g'));
            
            SELECT id INTO category_id 
            FROM unified_categories 
            WHERE slug = category_slug AND parent_id = parent_id;
            
            IF category_id IS NULL THEN
                INSERT INTO unified_categories (name, slug, parent_id)
                VALUES (COALESCE(subcat_name, cat_name), category_slug, parent_id)
                RETURNING id INTO category_id;
            END IF;
        END IF;
    END IF;
    
    RETURN category_id;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Migration script for existing entities
-- This maps existing category/subcategory combinations to unified categories
DO $$
DECLARE
    entity_record RECORD;
    unified_cat_id BIGINT;
    prof_id BIGINT;
    comp_id BIGINT;
    place_id BIGINT;
    prod_id BIGINT;
BEGIN
    -- Get root category IDs
    SELECT id INTO prof_id FROM unified_categories WHERE slug = 'professionals' AND parent_id IS NULL;
    SELECT id INTO comp_id FROM unified_categories WHERE slug = 'companies' AND parent_id IS NULL;
    SELECT id INTO place_id FROM unified_categories WHERE slug = 'places' AND parent_id IS NULL;
    SELECT id INTO prod_id FROM unified_categories WHERE slug = 'products' AND parent_id IS NULL;
    
    -- Process each entity
    FOR entity_record IN 
        SELECT entity_id, category, subcategory 
        FROM entities 
        WHERE unified_category_id IS NULL
    LOOP
        unified_cat_id = NULL;
        
        -- Determine parent category ID
        CASE entity_record.category
            WHEN 'professionals' THEN
                IF entity_record.subcategory IS NOT NULL AND entity_record.subcategory != '' THEN
                    unified_cat_id = get_or_create_unified_category(
                        entity_record.category, 
                        entity_record.subcategory, 
                        prof_id
                    );
                ELSE
                    unified_cat_id = prof_id;
                END IF;
            WHEN 'companies' THEN
                IF entity_record.subcategory IS NOT NULL AND entity_record.subcategory != '' THEN
                    unified_cat_id = get_or_create_unified_category(
                        entity_record.category, 
                        entity_record.subcategory, 
                        comp_id
                    );
                ELSE
                    unified_cat_id = comp_id;
                END IF;
            WHEN 'places' THEN
                IF entity_record.subcategory IS NOT NULL AND entity_record.subcategory != '' THEN
                    unified_cat_id = get_or_create_unified_category(
                        entity_record.category, 
                        entity_record.subcategory, 
                        place_id
                    );
                ELSE
                    unified_cat_id = place_id;
                END IF;
            WHEN 'products' THEN
                IF entity_record.subcategory IS NOT NULL AND entity_record.subcategory != '' THEN
                    unified_cat_id = get_or_create_unified_category(
                        entity_record.category, 
                        entity_record.subcategory, 
                        prod_id
                    );
                ELSE
                    unified_cat_id = prod_id;
                END IF;
            ELSE
                -- Default to professionals if unknown category
                unified_cat_id = prof_id;
        END CASE;
        
        -- Update entity with unified category ID
        IF unified_cat_id IS NOT NULL THEN
            UPDATE entities 
            SET unified_category_id = unified_cat_id 
            WHERE entity_id = entity_record.entity_id;
        END IF;
    END LOOP;
END;
$$;

-- Step 6: Clean up old tables (run this after verifying migration)
-- DROP TABLE IF EXISTS entity_subcategories;
-- DROP TABLE IF EXISTS subcategories;
-- DROP TABLE IF EXISTS categories;

-- Step 7: Make unified_category_id NOT NULL after migration is complete
-- ALTER TABLE entities ALTER COLUMN unified_category_id SET NOT NULL;

-- Step 8: Remove old category columns after migration is verified
-- ALTER TABLE entities DROP COLUMN category;
-- ALTER TABLE entities DROP COLUMN subcategory;

-- Add some useful views for easier querying
CREATE VIEW category_hierarchy AS
WITH RECURSIVE hierarchy AS (
    -- Base case: root categories
    SELECT 
        id,
        name,
        slug,
        parent_id,
        path,
        level,
        ARRAY[name] as name_path,
        ARRAY[id] as id_path
    FROM unified_categories 
    WHERE parent_id IS NULL
    
    UNION ALL
    
    -- Recursive case: subcategories
    SELECT 
        c.id,
        c.name,
        c.slug,
        c.parent_id,
        c.path,
        c.level,
        h.name_path || c.name,
        h.id_path || c.id
    FROM unified_categories c
    JOIN hierarchy h ON c.parent_id = h.id
)
SELECT * FROM hierarchy ORDER BY path;

-- View for getting leaf categories (categories without children)
CREATE VIEW leaf_categories AS
SELECT c.*
FROM unified_categories c
LEFT JOIN unified_categories children ON children.parent_id = c.id
WHERE children.id IS NULL AND c.is_active = true;

-- View for getting root categories with their child counts
CREATE VIEW root_categories_with_counts AS
SELECT 
    root.*,
    COUNT(children.id) as child_count,
    COUNT(entities.entity_id) as entity_count
FROM unified_categories root
LEFT JOIN unified_categories children ON children.path ~ (root.path::text || '.*')::lquery AND children.id != root.id
LEFT JOIN entities ON entities.unified_category_id = children.id OR entities.unified_category_id = root.id
WHERE root.parent_id IS NULL AND root.is_active = true
GROUP BY root.id, root.name, root.slug, root.parent_id, root.path, root.level, root.description, root.icon, root.color, root.is_active, root.sort_order, root.metadata, root.created_at, root.updated_at;