-- Category Questions Table for Dynamic Rating System
-- This table stores rating questions for both root categories and leaf subcategories

CREATE TABLE category_questions (
    id BIGSERIAL PRIMARY KEY,
    category_path VARCHAR(255) NOT NULL UNIQUE,
    category_name VARCHAR(200) NOT NULL,
    category_level INTEGER NOT NULL, -- 1 for root, 3+ for leaf subcategories
    is_root_category BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- JSON array of question objects
    -- Each question: {"key": "professionalism", "question": "How professional was the service?", "description": "Rate the professionalism and expertise"}
    questions JSONB NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER REFERENCES users(user_id),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- For tracking usage and optimization
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for efficient querying
CREATE INDEX idx_category_questions_path ON category_questions(category_path);
CREATE INDEX idx_category_questions_level ON category_questions(category_level);
CREATE INDEX idx_category_questions_root ON category_questions(is_root_category);
CREATE INDEX idx_category_questions_active ON category_questions(is_active);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_category_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_category_questions_updated_at
    BEFORE UPDATE ON category_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_category_questions_updated_at();

-- Comments for documentation
COMMENT ON TABLE category_questions IS 'Stores dynamic rating questions for different categories and subcategories';
COMMENT ON COLUMN category_questions.category_path IS 'Dot-separated path like "professionals.education.teachers" or "professionals" for root';
COMMENT ON COLUMN category_questions.questions IS 'JSONB array of question objects with key, question, and description';
COMMENT ON COLUMN category_questions.is_root_category IS 'True for root-level fallback questions (professionals, companies, etc.)';
COMMENT ON COLUMN category_questions.usage_count IS 'Number of times these questions have been used in reviews';