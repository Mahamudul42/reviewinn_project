-- Step 2: Create indexes and triggers (must be run outside transactions)

-- Create indexes for the new columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entities_reaction_count 
ON entities(reaction_count DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entities_comment_count 
ON entities(comment_count DESC);

-- Create comprehensive indexes for entity list queries
-- Combined index for sorting by multiple engagement metrics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entities_engagement_stats 
ON entities(review_count DESC, reaction_count DESC, comment_count DESC, view_count DESC);

-- Index for name-based searches with stats
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entities_name_stats 
ON entities(name, average_rating DESC, review_count DESC);

-- Index for category-based queries (using new hierarchical system)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entities_category_stats 
ON entities(final_category_id, average_rating DESC, review_count DESC);

-- Index for trending/popular entities
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entities_trending 
ON entities(is_verified, average_rating DESC, review_count DESC, reaction_count DESC) 
WHERE average_rating >= 4.0;