-- Enterprise-Grade Counting System for ReviewInn
-- This migration creates database triggers to maintain count consistency
-- Author: Claude Code Assistant
-- Date: 2025-08-25

-- =============================================================================
-- 1. CREATE TRIGGER FUNCTIONS FOR COMMENT COUNT SYNCHRONIZATION
-- =============================================================================

-- Function to update comment count when comments are added/removed
CREATE OR REPLACE FUNCTION update_review_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        UPDATE review_main 
        SET comment_count = (
            SELECT COUNT(*) 
            FROM review_comments 
            WHERE review_id = NEW.review_id
        )
        WHERE review_id = NEW.review_id;
        
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        UPDATE review_main 
        SET comment_count = (
            SELECT COUNT(*) 
            FROM review_comments 
            WHERE review_id = OLD.review_id
        )
        WHERE review_id = OLD.review_id;
        
        RETURN OLD;
    END IF;
    
    -- Handle UPDATE (if review_id changes)
    IF TG_OP = 'UPDATE' AND OLD.review_id != NEW.review_id THEN
        -- Update old review count
        UPDATE review_main 
        SET comment_count = (
            SELECT COUNT(*) 
            FROM review_comments 
            WHERE review_id = OLD.review_id
        )
        WHERE review_id = OLD.review_id;
        
        -- Update new review count
        UPDATE review_main 
        SET comment_count = (
            SELECT COUNT(*) 
            FROM review_comments 
            WHERE review_id = NEW.review_id
        )
        WHERE review_id = NEW.review_id;
        
        RETURN NEW;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update comment reaction count when reactions are added/removed
CREATE OR REPLACE FUNCTION update_comment_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        UPDATE review_comments 
        SET reaction_count = (
            SELECT COUNT(*) 
            FROM review_comment_reactions 
            WHERE comment_id = NEW.comment_id
        )
        WHERE comment_id = NEW.comment_id;
        
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        UPDATE review_comments 
        SET reaction_count = (
            SELECT COUNT(*) 
            FROM review_comment_reactions 
            WHERE comment_id = OLD.comment_id
        )
        WHERE comment_id = OLD.comment_id;
        
        RETURN OLD;
    END IF;
    
    -- Handle UPDATE (if comment_id changes)
    IF TG_OP = 'UPDATE' AND OLD.comment_id != NEW.comment_id THEN
        -- Update old comment count
        UPDATE review_comments 
        SET reaction_count = (
            SELECT COUNT(*) 
            FROM review_comment_reactions 
            WHERE comment_id = OLD.comment_id
        )
        WHERE comment_id = OLD.comment_id;
        
        -- Update new comment count
        UPDATE review_comments 
        SET reaction_count = (
            SELECT COUNT(*) 
            FROM review_comment_reactions 
            WHERE comment_id = NEW.comment_id
        )
        WHERE comment_id = NEW.comment_id;
        
        RETURN NEW;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 2. CREATE TRIGGER FUNCTIONS FOR REVIEW REACTION COUNT SYNCHRONIZATION
-- =============================================================================

-- Function to update review reaction count and top_reactions JSON
CREATE OR REPLACE FUNCTION update_review_reaction_count()
RETURNS TRIGGER AS $$
DECLARE
    target_review_id INTEGER;
    reaction_stats RECORD;
    total_reactions INTEGER := 0;
    top_reactions_json JSON := '{}';
BEGIN
    -- Determine which review_id to update
    IF TG_OP = 'DELETE' THEN
        target_review_id := OLD.review_id;
    ELSE
        target_review_id := NEW.review_id;
    END IF;
    
    -- Handle case where review_id changes (UPDATE)
    IF TG_OP = 'UPDATE' AND OLD.review_id != NEW.review_id THEN
        -- Update old review
        PERFORM update_single_review_reaction_count(OLD.review_id);
        -- Continue with new review below
    END IF;
    
    -- Update the target review
    PERFORM update_single_review_reaction_count(target_review_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Helper function to update a single review's reaction count
CREATE OR REPLACE FUNCTION update_single_review_reaction_count(target_review_id INTEGER)
RETURNS VOID AS $$
DECLARE
    reaction_stats RECORD;
    total_reactions INTEGER := 0;
    top_reactions_json JSON := '{}';
    reactions_obj JSON := '{}';
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
        -- Build the reactions object
        reactions_obj := reactions_obj || json_build_object(reaction_stats.reaction_type::text, reaction_stats.count);
        total_reactions := total_reactions + reaction_stats.count;
    END LOOP;
    
    -- Update the review with new counts
    UPDATE review_main 
    SET 
        reaction_count = total_reactions,
        top_reactions = reactions_obj,
        updated_at = NOW()
    WHERE review_id = target_review_id;
    
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 3. CREATE TRIGGER FUNCTIONS FOR VIEW COUNT SYNCHRONIZATION
-- =============================================================================

-- Function to update view count when views are tracked
-- Note: This approach counts unique valid views, not just increments
CREATE OR REPLACE FUNCTION update_review_view_count()
RETURNS TRIGGER AS $$
DECLARE
    target_review_id INTEGER;
    valid_view_count INTEGER;
BEGIN
    -- Determine which review_id to update
    IF TG_OP = 'DELETE' THEN
        target_review_id := OLD.review_id;
    ELSE
        target_review_id := NEW.review_id;
    END IF;
    
    -- Handle case where review_id changes (UPDATE)
    IF TG_OP = 'UPDATE' AND OLD.review_id != NEW.review_id THEN
        -- Update old review count
        SELECT COUNT(*) INTO valid_view_count
        FROM review_views 
        WHERE review_id = OLD.review_id 
        AND (is_valid IS NULL OR is_valid = true)
        AND (expires_at IS NULL OR expires_at > NOW());
        
        UPDATE review_main 
        SET view_count = valid_view_count
        WHERE review_id = OLD.review_id;
    END IF;
    
    -- Count valid views for the target review
    SELECT COUNT(*) INTO valid_view_count
    FROM review_views 
    WHERE review_id = target_review_id 
    AND (is_valid IS NULL OR is_valid = true)
    AND (expires_at IS NULL OR expires_at > NOW());
    
    -- Update the review with the accurate count
    UPDATE review_main 
    SET view_count = valid_view_count
    WHERE review_id = target_review_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 4. CREATE TRIGGERS
-- =============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_review_comment_count ON review_comments;
DROP TRIGGER IF EXISTS trigger_update_comment_reaction_count ON review_comment_reactions;
DROP TRIGGER IF EXISTS trigger_update_review_reaction_count ON review_reactions;
DROP TRIGGER IF EXISTS trigger_update_review_view_count ON review_views;

-- Create triggers for comment count synchronization
CREATE TRIGGER trigger_update_review_comment_count
    AFTER INSERT OR DELETE OR UPDATE OF review_id ON review_comments
    FOR EACH ROW EXECUTE FUNCTION update_review_comment_count();

-- Create triggers for comment reaction count synchronization
CREATE TRIGGER trigger_update_comment_reaction_count
    AFTER INSERT OR DELETE OR UPDATE OF comment_id ON review_comment_reactions
    FOR EACH ROW EXECUTE FUNCTION update_comment_reaction_count();

-- Create triggers for review reaction count synchronization
CREATE TRIGGER trigger_update_review_reaction_count
    AFTER INSERT OR DELETE OR UPDATE OF review_id ON review_reactions
    FOR EACH ROW EXECUTE FUNCTION update_review_reaction_count();

-- Create triggers for view count synchronization
CREATE TRIGGER trigger_update_review_view_count
    AFTER INSERT OR DELETE OR UPDATE OF review_id ON review_views
    FOR EACH ROW EXECUTE FUNCTION update_review_view_count();

-- =============================================================================
-- 5. FIX EXISTING DATA INCONSISTENCIES
-- =============================================================================

-- Fix comment counts for all reviews
UPDATE review_main SET comment_count = (
    SELECT COUNT(*) 
    FROM review_comments 
    WHERE review_comments.review_id = review_main.review_id
);

-- Fix comment reaction counts for all comments
UPDATE review_comments SET reaction_count = COALESCE((
    SELECT COUNT(*) 
    FROM review_comment_reactions 
    WHERE review_comment_reactions.comment_id = review_comments.comment_id
), 0);

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

-- Fix view counts for all reviews (count only valid, non-expired views)
UPDATE review_main SET view_count = COALESCE((
    SELECT COUNT(*) 
    FROM review_views 
    WHERE review_views.review_id = review_main.review_id
    AND (is_valid IS NULL OR is_valid = true)
    AND (expires_at IS NULL OR expires_at > NOW())
), 0);

-- =============================================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Indexes for efficient trigger operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_review_comments_review_id_for_count 
ON review_comments(review_id) WHERE review_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_review_comment_reactions_comment_id_for_count 
ON review_comment_reactions(comment_id) WHERE comment_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_review_reactions_review_id_type_for_count 
ON review_reactions(review_id, reaction_type) WHERE review_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_review_views_review_id_valid_for_count 
ON review_views(review_id) WHERE (is_valid IS NULL OR is_valid = true) 
AND (expires_at IS NULL OR expires_at > NOW());

-- =============================================================================
-- 7. CREATE MAINTENANCE FUNCTIONS
-- =============================================================================

-- Function to manually recalculate all counts (for maintenance)
CREATE OR REPLACE FUNCTION recalculate_all_counts()
RETURNS TABLE(
    reviews_updated INTEGER,
    comments_updated INTEGER,
    reactions_updated INTEGER,
    views_updated INTEGER
) AS $$
DECLARE
    review_count INTEGER;
    comment_count INTEGER;
    reaction_count INTEGER;
    view_count INTEGER;
    review_record RECORD;
BEGIN
    -- Fix comment counts
    UPDATE review_main SET comment_count = (
        SELECT COUNT(*) 
        FROM review_comments 
        WHERE review_comments.review_id = review_main.review_id
    );
    GET DIAGNOSTICS review_count = ROW_COUNT;
    
    -- Fix comment reaction counts
    UPDATE review_comments SET reaction_count = COALESCE((
        SELECT COUNT(*) 
        FROM review_comment_reactions 
        WHERE review_comment_reactions.comment_id = review_comments.comment_id
    ), 0);
    GET DIAGNOSTICS comment_count = ROW_COUNT;
    
    -- Fix review reaction counts
    FOR review_record IN SELECT review_id FROM review_main
    LOOP
        PERFORM update_single_review_reaction_count(review_record.review_id);
    END LOOP;
    GET DIAGNOSTICS reaction_count = ROW_COUNT;
    
    -- Fix view counts
    UPDATE review_main SET view_count = COALESCE((
        SELECT COUNT(*) 
        FROM review_views 
        WHERE review_views.review_id = review_main.review_id
        AND (is_valid IS NULL OR is_valid = true)
        AND (expires_at IS NULL OR expires_at > NOW())
    ), 0);
    GET DIAGNOSTICS view_count = ROW_COUNT;
    
    RETURN QUERY SELECT review_count, comment_count, reaction_count, view_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get count consistency report
CREATE OR REPLACE FUNCTION get_count_consistency_report()
RETURNS TABLE(
    review_id INTEGER,
    stored_comment_count INTEGER,
    actual_comment_count BIGINT,
    comment_count_diff INTEGER,
    stored_view_count INTEGER,
    actual_view_count BIGINT,
    view_count_diff INTEGER,
    stored_reaction_count INTEGER,
    actual_reaction_count BIGINT,
    reaction_count_diff INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rm.review_id,
        rm.comment_count as stored_comment_count,
        COALESCE(cc.actual_comments, 0) as actual_comment_count,
        rm.comment_count - COALESCE(cc.actual_comments, 0)::INTEGER as comment_count_diff,
        rm.view_count as stored_view_count,
        COALESCE(vc.actual_views, 0) as actual_view_count,
        rm.view_count - COALESCE(vc.actual_views, 0)::INTEGER as view_count_diff,
        rm.reaction_count as stored_reaction_count,
        COALESCE(rc.actual_reactions, 0) as actual_reaction_count,
        rm.reaction_count - COALESCE(rc.actual_reactions, 0)::INTEGER as reaction_count_diff
    FROM review_main rm
    LEFT JOIN (
        SELECT review_id, COUNT(*) as actual_comments
        FROM review_comments
        GROUP BY review_id
    ) cc ON rm.review_id = cc.review_id
    LEFT JOIN (
        SELECT review_id, COUNT(*) as actual_views
        FROM review_views
        WHERE (is_valid IS NULL OR is_valid = true)
        AND (expires_at IS NULL OR expires_at > NOW())
        GROUP BY review_id
    ) vc ON rm.review_id = vc.review_id
    LEFT JOIN (
        SELECT review_id, COUNT(*) as actual_reactions
        FROM review_reactions
        GROUP BY review_id
    ) rc ON rm.review_id = rc.review_id
    WHERE rm.comment_count != COALESCE(cc.actual_comments, 0)
       OR rm.view_count != COALESCE(vc.actual_views, 0)
       OR rm.reaction_count != COALESCE(rc.actual_reactions, 0)
    ORDER BY rm.review_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 8. GRANT PERMISSIONS
-- =============================================================================

-- Grant execute permissions to the application user
GRANT EXECUTE ON FUNCTION update_review_comment_count() TO reviewinn_user;
GRANT EXECUTE ON FUNCTION update_comment_reaction_count() TO reviewinn_user;
GRANT EXECUTE ON FUNCTION update_review_reaction_count() TO reviewinn_user;
GRANT EXECUTE ON FUNCTION update_single_review_reaction_count(INTEGER) TO reviewinn_user;
GRANT EXECUTE ON FUNCTION update_review_view_count() TO reviewinn_user;
GRANT EXECUTE ON FUNCTION recalculate_all_counts() TO reviewinn_user;
GRANT EXECUTE ON FUNCTION get_count_consistency_report() TO reviewinn_user;

-- =============================================================================
-- MIGRATION COMPLETED SUCCESSFULLY
-- =============================================================================

SELECT 'Enterprise counting system migration completed successfully!' as status;