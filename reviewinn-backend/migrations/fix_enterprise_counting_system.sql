-- Fix Enterprise-Grade Counting System Issues
-- This migration fixes the issues with JSON concatenation and indexes
-- Author: Claude Code Assistant
-- Date: 2025-08-25

-- =============================================================================
-- 1. FIX JSON CONCATENATION ISSUE
-- =============================================================================

-- Drop the problematic function and recreate it with JSONB
DROP FUNCTION IF EXISTS update_single_review_reaction_count(INTEGER);

-- Helper function to update a single review's reaction count (using JSONB)
CREATE OR REPLACE FUNCTION update_single_review_reaction_count(target_review_id INTEGER)
RETURNS VOID AS $$
DECLARE
    reaction_stats RECORD;
    total_reactions INTEGER := 0;
    reactions_obj JSONB := '{}';
BEGIN
    -- Get reaction counts grouped by type
    FOR reaction_stats IN
        SELECT reaction_type, COUNT(*) as count
        FROM review_reactions 
        WHERE review_id = target_review_id
        GROUP BY reaction_type
        ORDER BY COUNT(*) DESC
        LIMIT 10
    LOOP
        -- Build the reactions object using JSONB
        reactions_obj := reactions_obj || jsonb_build_object(reaction_stats.reaction_type::text, reaction_stats.count);
        total_reactions := total_reactions + reaction_stats.count;
    END LOOP;
    
    -- Update the review with new counts (cast JSONB to JSON)
    UPDATE review_main 
    SET 
        reaction_count = total_reactions,
        top_reactions = reactions_obj::json,
        updated_at = NOW()
    WHERE review_id = target_review_id;
    
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_single_review_reaction_count(INTEGER) TO reviewinn_user;

-- =============================================================================
-- 2. FIX INDEX CREATION ISSUES
-- =============================================================================

-- Drop problematic indexes
DROP INDEX IF EXISTS idx_review_views_review_id_valid_for_count;

-- Create simplified index for review views
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_review_views_review_id_valid_simple 
ON review_views(review_id, is_valid, expires_at);

-- =============================================================================
-- 3. RE-RUN DATA FIXES WITH CORRECTED FUNCTIONS
-- =============================================================================

-- Fix review reaction counts and top_reactions JSON for all reviews
DO $$
DECLARE
    review_record RECORD;
BEGIN
    FOR review_record IN SELECT review_id FROM review_main
    LOOP
        PERFORM update_single_review_reaction_count(review_record.review_id);
    END LOOP;
END $$;

-- =============================================================================
-- 4. TEST THE SYSTEM
-- =============================================================================

-- Verify counts are now consistent
SELECT 
    COUNT(*) as reviews_with_correct_comment_counts
FROM review_main rm
LEFT JOIN (
    SELECT review_id, COUNT(*) as actual_comments
    FROM review_comments
    GROUP BY review_id
) cc ON rm.review_id = cc.review_id
WHERE rm.comment_count = COALESCE(cc.actual_comments, 0);

SELECT 'Enterprise counting system fix completed successfully!' as status;