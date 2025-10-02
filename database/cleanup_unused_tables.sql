-- Clean up unnecessary tables created earlier
DROP TABLE IF EXISTS group_notifications CASCADE;
DROP TABLE IF EXISTS group_activities CASCADE;
DROP TABLE IF EXISTS group_post_reactions CASCADE;
DROP TABLE IF EXISTS group_post_comments CASCADE;
DROP TABLE IF EXISTS group_post_media CASCADE;
DROP TABLE IF EXISTS group_posts CASCADE;

-- Drop views
DROP VIEW IF EXISTS v_active_group_posts CASCADE;
DROP VIEW IF EXISTS v_group_activity_feed CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_group_posts_count() CASCADE;
DROP FUNCTION IF EXISTS update_post_comments_count() CASCADE;
DROP FUNCTION IF EXISTS update_reaction_counts() CASCADE;

-- Remove unnecessary columns
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'review_groups' AND column_name = 'posts_count') THEN
        ALTER TABLE review_groups DROP COLUMN IF EXISTS posts_count;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'group_memberships' AND column_name = 'posts_count') THEN
        ALTER TABLE group_memberships DROP COLUMN IF EXISTS posts_count;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'group_memberships' AND column_name = 'comments_count') THEN
        ALTER TABLE group_memberships DROP COLUMN IF EXISTS comments_count;
    END IF;
END $$;

SELECT 'Cleanup completed!' as status;
