-- Optimize entity table for 10k+ concurrent users
-- Add engagement stats columns and remove legacy category fields

BEGIN;

-- Step 1: Add new engagement stats columns
ALTER TABLE entities 
ADD COLUMN IF NOT EXISTS reaction_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0 NOT NULL;

-- Step 2: Create indexes for the new columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entities_reaction_count 
ON entities(reaction_count DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entities_comment_count 
ON entities(comment_count DESC);

-- Step 3: Populate the new columns with current data
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

-- Step 4: Create comprehensive indexes for entity list queries
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

-- Step 5: Remove legacy category columns (no longer needed)
-- These are replaced by the hierarchical category system

-- First, create a backup table with the old data (safety measure)
CREATE TABLE IF NOT EXISTS entities_legacy_backup AS 
SELECT entity_id, category, subcategory, unified_category_id 
FROM entities 
WHERE category IS NOT NULL OR subcategory IS NOT NULL OR unified_category_id IS NOT NULL;

-- Remove the legacy columns
ALTER TABLE entities DROP COLUMN IF EXISTS category;
ALTER TABLE entities DROP COLUMN IF EXISTS subcategory; 
ALTER TABLE entities DROP COLUMN IF EXISTS unified_category_id;

-- Step 6: Update entity statistics for accuracy
ANALYZE entities;

-- Step 7: Create function to maintain engagement stats (for future updates)
CREATE OR REPLACE FUNCTION update_entity_engagement_stats(entity_id_param INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE entities 
    SET 
        reaction_count = (
            SELECT COALESCE(COUNT(rr.reaction_id), 0)
            FROM reviews r 
            LEFT JOIN review_reactions rr ON r.review_id = rr.review_id 
            WHERE r.entity_id = entity_id_param
        ),
        comment_count = (
            SELECT COALESCE(COUNT(c.comment_id), 0)
            FROM reviews r 
            LEFT JOIN comments c ON r.review_id = c.review_id 
            WHERE r.entity_id = entity_id_param
        ),
        updated_at = NOW()
    WHERE entity_id = entity_id_param;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger to automatically update engagement stats when reviews change
CREATE OR REPLACE FUNCTION trigger_update_entity_engagement_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM update_entity_engagement_stats(NEW.entity_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN  
        PERFORM update_entity_engagement_stats(OLD.entity_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic stats updates
DROP TRIGGER IF EXISTS trigger_review_entity_stats ON reviews;
CREATE TRIGGER trigger_review_entity_stats
    AFTER INSERT OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION trigger_update_entity_engagement_stats();

DROP TRIGGER IF EXISTS trigger_reaction_entity_stats ON review_reactions;  
CREATE TRIGGER trigger_reaction_entity_stats
    AFTER INSERT OR DELETE ON review_reactions
    FOR EACH ROW EXECUTE FUNCTION trigger_update_entity_engagement_stats();

DROP TRIGGER IF EXISTS trigger_comment_entity_stats ON comments;
CREATE TRIGGER trigger_comment_entity_stats
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION trigger_update_entity_engagement_stats();

-- Verify the migration
SELECT 
    'Migration Summary' as info,
    COUNT(*) as total_entities,
    AVG(review_count) as avg_review_count,
    AVG(reaction_count) as avg_reaction_count, 
    AVG(comment_count) as avg_comment_count,
    COUNT(*) FILTER (WHERE reaction_count > 0) as entities_with_reactions,
    COUNT(*) FILTER (WHERE comment_count > 0) as entities_with_comments
FROM entities;

COMMIT;

-- Performance monitoring query
-- Run this after migration to verify index usage:
/*
SELECT 
    schemaname, 
    tablename, 
    indexname, 
    idx_scan, 
    idx_tup_read,
    idx_tup_fetch 
FROM pg_stat_user_indexes 
WHERE tablename = 'entities' 
ORDER BY idx_scan DESC;
*/