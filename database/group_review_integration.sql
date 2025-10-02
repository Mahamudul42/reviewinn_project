-- ============================================================================
-- SIMPLE GROUP-REVIEW INTEGRATION
-- Connect existing reviews to groups without duplicating functionality
-- ============================================================================

-- Add group_id to review_main (making reviews work in groups)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'review_main' AND column_name = 'group_id') THEN
        ALTER TABLE review_main 
        ADD COLUMN group_id INTEGER REFERENCES review_groups(group_id) ON DELETE SET NULL;
        
        -- Add index for performance
        CREATE INDEX idx_review_main_group_id ON review_main(group_id);
        
        -- Add review_scope to distinguish between public and group reviews
        ALTER TABLE review_main
        ADD COLUMN review_scope VARCHAR(20) DEFAULT 'public';
        -- Possible values: 'public', 'group_only', 'mixed'
        
        COMMENT ON COLUMN review_main.group_id IS 'If set, this review is posted in a specific group';
        COMMENT ON COLUMN review_main.review_scope IS 'Visibility scope: public (visible everywhere), group_only (only in group), mixed (both)';
    END IF;
END $$;

-- Update review_groups to track review counts
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'review_groups' AND column_name = 'review_count') THEN
        ALTER TABLE review_groups 
        ADD COLUMN review_count INTEGER DEFAULT 0;
        
        -- Initialize counts from existing reviews
        UPDATE review_groups g
        SET review_count = (
            SELECT COUNT(*) 
            FROM review_main r 
            WHERE r.group_id = g.group_id
        );
    END IF;
END $$;

-- Trigger to auto-update review_count on review_groups
CREATE OR REPLACE FUNCTION update_group_review_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.group_id IS NOT NULL THEN
        UPDATE review_groups 
        SET review_count = COALESCE(review_count, 0) + 1,
            updated_at = NOW()
        WHERE group_id = NEW.group_id;
        
    ELSIF TG_OP = 'UPDATE' AND NEW.group_id IS NOT NULL AND OLD.group_id IS NULL THEN
        -- Review was added to a group
        UPDATE review_groups 
        SET review_count = COALESCE(review_count, 0) + 1,
            updated_at = NOW()
        WHERE group_id = NEW.group_id;
        
    ELSIF TG_OP = 'UPDATE' AND NEW.group_id IS NULL AND OLD.group_id IS NOT NULL THEN
        -- Review was removed from a group
        UPDATE review_groups 
        SET review_count = GREATEST(COALESCE(review_count, 0) - 1, 0),
            updated_at = NOW()
        WHERE group_id = OLD.group_id;
        
    ELSIF TG_OP = 'UPDATE' AND NEW.group_id IS NOT NULL AND OLD.group_id IS NOT NULL AND NEW.group_id != OLD.group_id THEN
        -- Review moved from one group to another
        UPDATE review_groups 
        SET review_count = GREATEST(COALESCE(review_count, 0) - 1, 0),
            updated_at = NOW()
        WHERE group_id = OLD.group_id;
        
        UPDATE review_groups 
        SET review_count = COALESCE(review_count, 0) + 1,
            updated_at = NOW()
        WHERE group_id = NEW.group_id;
        
    ELSIF TG_OP = 'DELETE' AND OLD.group_id IS NOT NULL THEN
        UPDATE review_groups 
        SET review_count = GREATEST(COALESCE(review_count, 0) - 1, 0),
            updated_at = NOW()
        WHERE group_id = OLD.group_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_group_review_count ON review_main;
CREATE TRIGGER trg_update_group_review_count
AFTER INSERT OR UPDATE OR DELETE ON review_main
FOR EACH ROW EXECUTE FUNCTION update_group_review_count();

-- Create a view for group reviews (easier querying)
CREATE OR REPLACE VIEW v_group_reviews AS
SELECT 
    r.*,
    g.name as group_name,
    g.avatar_url as group_avatar,
    u.username,
    u.first_name,
    u.last_name,
    u.avatar as user_avatar,
    e.name as entity_name
FROM review_main r
LEFT JOIN review_groups g ON r.group_id = g.group_id
LEFT JOIN core_users u ON r.user_id = u.user_id
LEFT JOIN core_entities e ON r.entity_id = e.entity_id
WHERE r.group_id IS NOT NULL
ORDER BY r.created_at DESC;

-- Grant permissions
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'reviewinn_user') THEN
        GRANT ALL ON ALL TABLES IN SCHEMA public TO reviewinn_user;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO reviewinn_user;
    END IF;
END
$$;

-- ============================================================================
-- COMPLETED: Simple Group-Review Integration
-- ============================================================================
-- Now reviews can be posted in groups using existing review_main table
-- All existing features (comments, reactions) work automatically in groups!
-- ============================================================================
