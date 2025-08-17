-- Fix review_groups table by adding missing columns
ALTER TABLE review_groups 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS group_type VARCHAR(50) DEFAULT 'interest_based',
ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public',
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS allow_public_reviews BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS require_approval_for_reviews BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES core_users(user_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS group_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS rules_and_guidelines TEXT,
ADD COLUMN IF NOT EXISTS external_links JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS active_members_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_review_groups_type ON review_groups(group_type);
CREATE INDEX IF NOT EXISTS idx_review_groups_visibility ON review_groups(visibility);
CREATE INDEX IF NOT EXISTS idx_review_groups_active ON review_groups(is_active);
CREATE INDEX IF NOT EXISTS idx_review_groups_created_by ON review_groups(created_by);