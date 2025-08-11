-- Step 3: Create maintenance functions and triggers

-- Create function to maintain engagement stats (for future updates)
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

-- Create trigger function to automatically update engagement stats
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

-- For review_reactions, we need a different trigger function since it doesn't have entity_id directly
CREATE OR REPLACE FUNCTION trigger_update_entity_stats_from_reaction()
RETURNS TRIGGER AS $$
DECLARE
    entity_id_val INTEGER;
BEGIN
    IF TG_OP = 'INSERT' THEN
        SELECT r.entity_id INTO entity_id_val FROM reviews r WHERE r.review_id = NEW.review_id;
        PERFORM update_entity_engagement_stats(entity_id_val);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        SELECT r.entity_id INTO entity_id_val FROM reviews r WHERE r.review_id = OLD.review_id;
        PERFORM update_entity_engagement_stats(entity_id_val);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reaction_entity_stats ON review_reactions;
CREATE TRIGGER trigger_reaction_entity_stats
    AFTER INSERT OR DELETE ON review_reactions
    FOR EACH ROW EXECUTE FUNCTION trigger_update_entity_stats_from_reaction();

-- For comments, we need another trigger function since it doesn't have entity_id directly
CREATE OR REPLACE FUNCTION trigger_update_entity_stats_from_comment()
RETURNS TRIGGER AS $$
DECLARE
    entity_id_val INTEGER;
BEGIN
    IF TG_OP = 'INSERT' THEN
        SELECT r.entity_id INTO entity_id_val FROM reviews r WHERE r.review_id = NEW.review_id;
        PERFORM update_entity_engagement_stats(entity_id_val);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        SELECT r.entity_id INTO entity_id_val FROM reviews r WHERE r.review_id = OLD.review_id;
        PERFORM update_entity_engagement_stats(entity_id_val);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_comment_entity_stats ON comments;
CREATE TRIGGER trigger_comment_entity_stats
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION trigger_update_entity_stats_from_comment();

-- Final verification
SELECT 
    'Migration Complete - Entity Optimization Summary' as info,
    COUNT(*) as total_entities,
    AVG(review_count) as avg_review_count,
    AVG(reaction_count) as avg_reaction_count, 
    AVG(comment_count) as avg_comment_count,
    COUNT(*) FILTER (WHERE reaction_count > 0) as entities_with_reactions,
    COUNT(*) FILTER (WHERE comment_count > 0) as entities_with_comments
FROM entities;