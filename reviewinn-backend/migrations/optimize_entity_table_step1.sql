-- Step 1: Add new engagement stats columns (can be done in transaction)
BEGIN;

-- Add new engagement stats columns
ALTER TABLE entities 
ADD COLUMN IF NOT EXISTS reaction_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0 NOT NULL;

-- Populate the new columns with current data
-- reaction_count: Sum of all reactions on all reviews for this entity
UPDATE entities 
SET reaction_count = (
    SELECT COALESCE(COUNT(rr.reaction_id), 0)
    FROM reviews r 
    LEFT JOIN review_reactions rr ON r.review_id = rr.review_id 
    WHERE r.entity_id = entities.entity_id
);

-- comment_count: Sum of all comments on all reviews for this entity  
UPDATE entities 
SET comment_count = (
    SELECT COALESCE(COUNT(c.comment_id), 0)
    FROM reviews r 
    LEFT JOIN comments c ON r.review_id = c.review_id 
    WHERE r.entity_id = entities.entity_id
);

-- Create backup of legacy fields before removal
CREATE TABLE IF NOT EXISTS entities_legacy_backup AS 
SELECT entity_id, category, subcategory, unified_category_id 
FROM entities 
WHERE category IS NOT NULL OR subcategory IS NOT NULL OR unified_category_id IS NOT NULL;

-- Remove the legacy columns  
ALTER TABLE entities DROP COLUMN IF EXISTS category;
ALTER TABLE entities DROP COLUMN IF EXISTS subcategory;
ALTER TABLE entities DROP COLUMN IF EXISTS unified_category_id;

-- Update statistics
ANALYZE entities;

COMMIT;