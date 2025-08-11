-- Migration: Add hierarchical category support to entities table
-- This adds root_category_id and final_category_id to properly store hierarchical category selection

BEGIN;

-- Add new columns for hierarchical category storage
ALTER TABLE entities ADD COLUMN IF NOT EXISTS root_category_id BIGINT REFERENCES unified_categories(id);
ALTER TABLE entities ADD COLUMN IF NOT EXISTS final_category_id BIGINT REFERENCES unified_categories(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_entities_root_category ON entities(root_category_id);
CREATE INDEX IF NOT EXISTS idx_entities_final_category ON entities(final_category_id);

-- Migrate existing data: set both root_category_id and final_category_id to unified_category_id
-- and populate root_category_id with the root category of the hierarchy
UPDATE entities 
SET 
    final_category_id = unified_category_id,
    root_category_id = CASE 
        WHEN unified_category_id IS NOT NULL THEN (
            -- Get the root category by traversing up the hierarchy
            WITH RECURSIVE category_hierarchy AS (
                -- Base case: start with the current category
                SELECT id, parent_id, level, path
                FROM unified_categories 
                WHERE id = entities.unified_category_id
                
                UNION ALL
                
                -- Recursive case: get parent categories
                SELECT uc.id, uc.parent_id, uc.level, uc.path
                FROM unified_categories uc
                INNER JOIN category_hierarchy ch ON uc.id = ch.parent_id
            )
            SELECT id FROM category_hierarchy WHERE level = 1 LIMIT 1
        )
        ELSE NULL
    END
WHERE unified_category_id IS NOT NULL;

-- For entities with no unified_category_id, try to infer from legacy category field
UPDATE entities 
SET 
    root_category_id = (
        SELECT id FROM unified_categories 
        WHERE path = entities.category AND level = 1 
        LIMIT 1
    ),
    final_category_id = (
        SELECT id FROM unified_categories 
        WHERE path = entities.category AND level = 1 
        LIMIT 1
    )
WHERE unified_category_id IS NULL AND category IS NOT NULL;

-- Update unified_category_id to match final_category_id for consistency
UPDATE entities 
SET unified_category_id = final_category_id 
WHERE final_category_id IS NOT NULL AND unified_category_id IS NULL;

COMMIT;