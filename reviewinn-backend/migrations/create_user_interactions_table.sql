-- Create user_interactions table for cross-browser synchronization
-- This table stores user reactions, bookmarks, and other interactions

CREATE TABLE IF NOT EXISTS user_interactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    review_id VARCHAR NOT NULL,
    
    -- Interaction data
    reaction_type VARCHAR(50) NULL,  -- 'like', 'love', 'laugh', etc.
    is_bookmarked BOOLEAN DEFAULT FALSE,
    is_helpful BOOLEAN NULL,  -- TRUE for helpful, FALSE for not helpful, NULL for no vote
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT uix_user_review_interaction UNIQUE (user_id, review_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_review_id ON user_interactions(review_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_reaction_type ON user_interactions(reaction_type) WHERE reaction_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_interactions_bookmarked ON user_interactions(is_bookmarked) WHERE is_bookmarked = TRUE;

-- Update trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_user_interactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_user_interactions_updated_at ON user_interactions;
CREATE TRIGGER trigger_update_user_interactions_updated_at
    BEFORE UPDATE ON user_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_interactions_updated_at();

-- Comments
COMMENT ON TABLE user_interactions IS 'Stores user interactions (reactions, bookmarks, votes) for cross-browser synchronization';
COMMENT ON COLUMN user_interactions.reaction_type IS 'Type of emoji reaction (like, love, laugh, etc.)';
COMMENT ON COLUMN user_interactions.is_bookmarked IS 'Whether user has bookmarked this review';
COMMENT ON COLUMN user_interactions.is_helpful IS 'User vote on review helpfulness (TRUE/FALSE/NULL)';