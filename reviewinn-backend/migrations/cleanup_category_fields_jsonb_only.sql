-- Migration to cleanup category fields and optimize for JSONB-only approach
-- This removes redundant ID fields and adds proper indexing for JSONB queries

BEGIN;

-- Remove redundant foreign key columns (keeping JSONB as source of truth)
ALTER TABLE core_entities DROP COLUMN IF EXISTS root_category_id;
ALTER TABLE core_entities DROP COLUMN IF EXISTS final_category_id;

-- Create GIN indexes on JSONB fields for fast category filtering
-- Index for root_category searches (e.g., root_category->>'id' = '186')
CREATE INDEX IF NOT EXISTS idx_core_entities_root_category_gin 
ON core_entities USING GIN (root_category);

-- Index for final_category searches (e.g., final_category->>'id' = '208')
CREATE INDEX IF NOT EXISTS idx_core_entities_final_category_gin 
ON core_entities USING GIN (final_category);

-- Specific indexes for common query patterns
-- Fast lookups by category ID
CREATE INDEX IF NOT EXISTS idx_core_entities_root_category_id 
ON core_entities ((root_category->>'id'));

CREATE INDEX IF NOT EXISTS idx_core_entities_final_category_id 
ON core_entities ((final_category->>'id'));

-- Fast lookups by category level (useful for hierarchical queries)
CREATE INDEX IF NOT EXISTS idx_core_entities_root_category_level 
ON core_entities ((root_category->>'level'));

CREATE INDEX IF NOT EXISTS idx_core_entities_final_category_level 
ON core_entities ((final_category->>'level'));

-- Fast lookups by category slug (for URL-friendly filtering)
CREATE INDEX IF NOT EXISTS idx_core_entities_root_category_slug 
ON core_entities ((root_category->>'slug'));

CREATE INDEX IF NOT EXISTS idx_core_entities_final_category_slug 
ON core_entities ((final_category->>'slug'));

COMMIT;