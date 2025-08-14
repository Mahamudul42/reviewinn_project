-- Migration: Enhance social_circle_members table for comprehensive follower/circle system

-- First, let's see what we have and add any missing pieces

-- Update social_circle_requests table to support final relationship decisions
ALTER TABLE social_circle_requests 
ADD COLUMN IF NOT EXISTS final_relationship VARCHAR(20) DEFAULT NULL;

-- Add check constraint for final relationship
ALTER TABLE social_circle_requests 
DROP CONSTRAINT IF EXISTS final_relationship_check;

ALTER TABLE social_circle_requests 
ADD CONSTRAINT final_relationship_check 
CHECK (final_relationship IN ('circle_member', 'follower', 'rejected', NULL));

-- Create function to automatically sync social relationships when circle requests are processed
CREATE OR REPLACE FUNCTION sync_social_relationships()
RETURNS TRIGGER AS $$
BEGIN
    -- When a circle request is sent, add requester as follower of recipient
    IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
        INSERT INTO social_circle_members (owner_id, member_id, membership_type)
        VALUES (NEW.recipient_id, NEW.requester_id, 'follower')
        ON CONFLICT (owner_id, member_id) 
        DO UPDATE SET membership_type = 'follower', updated_at = NOW();
        
        RETURN NEW;
    END IF;
    
    -- When a circle request is responded to
    IF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected') THEN
        
        -- If accepted and final_relationship is 'circle_member'
        IF NEW.status = 'accepted' AND NEW.final_relationship = 'circle_member' THEN
            -- Update existing follower relationship to circle member
            UPDATE social_circle_members 
            SET membership_type = 'member', updated_at = NOW()
            WHERE owner_id = NEW.recipient_id AND member_id = NEW.requester_id;
            
            -- Create reverse relationship (circle members follow each other)
            INSERT INTO social_circle_members (owner_id, member_id, membership_type)
            VALUES (NEW.requester_id, NEW.recipient_id, 'member')
            ON CONFLICT (owner_id, member_id) 
            DO UPDATE SET membership_type = 'member', updated_at = NOW();
            
        -- If accepted and final_relationship is 'follower'
        ELSIF NEW.status = 'accepted' AND NEW.final_relationship = 'follower' THEN
            -- Keep as follower relationship (already set when request was sent)
            UPDATE social_circle_members 
            SET updated_at = NOW()
            WHERE owner_id = NEW.recipient_id AND member_id = NEW.requester_id;
            
        -- If rejected
        ELSIF NEW.status = 'rejected' THEN
            -- Remove the follower relationship
            DELETE FROM social_circle_members 
            WHERE owner_id = NEW.recipient_id AND member_id = NEW.requester_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- When a circle request is cancelled
    IF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'cancelled' THEN
        -- Remove the follower relationship
        DELETE FROM social_circle_members 
        WHERE owner_id = NEW.recipient_id AND member_id = NEW.requester_id;
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync relationships
DROP TRIGGER IF EXISTS sync_social_relationships_trigger ON social_circle_requests;
CREATE TRIGGER sync_social_relationships_trigger
    AFTER INSERT OR UPDATE ON social_circle_requests
    FOR EACH ROW
    EXECUTE FUNCTION sync_social_relationships();

-- Create or update views for easy querying
CREATE OR REPLACE VIEW user_followers_view AS
SELECT 
    scm.owner_id as user_id,
    scm.member_id as follower_id,
    u.username as follower_username,
    u.email as follower_email,
    u.name as follower_name,
    u.avatar as follower_avatar,
    scm.membership_type,
    scm.joined_at,
    scm.updated_at
FROM social_circle_members scm
JOIN users u ON scm.member_id = u.user_id
WHERE scm.membership_type IN ('follower', 'member');

CREATE OR REPLACE VIEW user_following_view AS
SELECT 
    scm.member_id as user_id,
    scm.owner_id as following_id,
    u.username as following_username,
    u.email as following_email,
    u.name as following_name,
    u.avatar as following_avatar,
    scm.membership_type,
    scm.joined_at,
    scm.updated_at
FROM social_circle_members scm
JOIN users u ON scm.owner_id = u.user_id
WHERE scm.membership_type IN ('follower', 'member');

CREATE OR REPLACE VIEW circle_members_view AS
SELECT 
    scm.owner_id as user_id,
    scm.member_id as member_id,
    u.username as member_username,
    u.email as member_email,
    u.name as member_name,
    u.avatar as member_avatar,
    scm.joined_at,
    scm.updated_at,
    scm.can_see_private_reviews,
    scm.notification_preferences
FROM social_circle_members scm
JOIN users u ON scm.member_id = u.user_id
WHERE scm.membership_type = 'member';

-- Add comments for documentation
COMMENT ON COLUMN social_circle_requests.final_relationship IS 'Final relationship decision when responding to request: circle_member, follower, or rejected';
COMMENT ON VIEW user_followers_view IS 'Users who follow a given user (including circle members)';
COMMENT ON VIEW user_following_view IS 'Users that a given user follows (including circle members they belong to)';
COMMENT ON VIEW circle_members_view IS 'Circle members only (bidirectional relationships)';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_circle_requests_final_relationship ON social_circle_requests(final_relationship);
CREATE INDEX IF NOT EXISTS idx_social_circle_members_composite ON social_circle_members(owner_id, member_id, membership_type);