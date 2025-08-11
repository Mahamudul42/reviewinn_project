-- Simple migration without LTREE for unified categories
-- Drop table if it exists
DROP TABLE IF EXISTS unified_categories CASCADE;

-- Create new unified categories table
CREATE TABLE unified_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id BIGINT REFERENCES unified_categories(id) ON DELETE CASCADE,
    path VARCHAR(500),  -- Store path as string
    level INTEGER NOT NULL DEFAULT 1,
    icon VARCHAR(50),
    color VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    extra_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_level_consistency CHECK (
        (parent_id IS NULL AND level = 1) OR 
        (parent_id IS NOT NULL AND level > 1)
    )
);

-- Create indexes for performance
CREATE INDEX idx_unified_categories_parent_id ON unified_categories(parent_id);
CREATE INDEX idx_unified_categories_slug ON unified_categories(slug);
CREATE INDEX idx_unified_categories_path ON unified_categories(path);
CREATE INDEX idx_unified_categories_level ON unified_categories(level);
CREATE INDEX idx_unified_categories_active ON unified_categories(is_active);

-- Insert root categories
INSERT INTO unified_categories (name, slug, description, level, path, sort_order, icon, color) VALUES
('Professionals', 'professionals', 'Individual service providers and experts', 1, '1', 1, '👨‍💼', '#8B5CF6'),
('Companies', 'companies', 'Business organizations and institutions', 1, '2', 2, '🏢', '#10B981'),
('Places', 'places', 'Physical locations and venues', 1, '3', 3, '📍', '#F59E0B'),
('Products', 'products', 'Goods and items for review', 1, '4', 4, '📦', '#EF4444');

-- Add foreign key to entities table
ALTER TABLE entities ADD COLUMN IF NOT EXISTS unified_category_id BIGINT REFERENCES unified_categories(id);
CREATE INDEX IF NOT EXISTS idx_entities_unified_category ON entities(unified_category_id);

-- Add hierarchical category support to entities table
ALTER TABLE entities ADD COLUMN IF NOT EXISTS root_category_id BIGINT REFERENCES unified_categories(id);
ALTER TABLE entities ADD COLUMN IF NOT EXISTS final_category_id BIGINT REFERENCES unified_categories(id);
CREATE INDEX IF NOT EXISTS idx_entities_root_category ON entities(root_category_id);
CREATE INDEX IF NOT EXISTS idx_entities_final_category ON entities(final_category_id);