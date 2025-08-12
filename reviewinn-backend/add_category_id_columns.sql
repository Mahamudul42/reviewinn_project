-- Add foreign key columns for category IDs to core_entities table
ALTER TABLE core_entities ADD COLUMN IF NOT EXISTS root_category_id BIGINT REFERENCES unified_categories(id);
ALTER TABLE core_entities ADD COLUMN IF NOT EXISTS final_category_id BIGINT REFERENCES unified_categories(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_core_entities_root_category ON core_entities(root_category_id);
CREATE INDEX IF NOT EXISTS idx_core_entities_final_category ON core_entities(final_category_id);

-- Update the ID columns based on JSONB data (if any exists)
UPDATE core_entities 
SET root_category_id = (root_category->>'id')::BIGINT 
WHERE root_category IS NOT NULL AND root_category->>'id' IS NOT NULL;

UPDATE core_entities 
SET final_category_id = (final_category->>'id')::BIGINT 
WHERE final_category IS NOT NULL AND final_category->>'id' IS NOT NULL;