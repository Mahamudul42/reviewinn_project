-- Migration: Add comprehensive follower/following system
-- This supports the social relationship features

-- Create followers table for follower/following relationships
CREATE TABLE IF NOT EXISTS followers (
    id SERIAL PRIMARY KEY,
    follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship_type VARCHAR(20) NOT NULL DEFAULT 'follower',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique follower-following pairs
    UNIQUE(follower_id, following_id),
    
    -- Prevent self-following
    CHECK (follower_id != following_id)
);

-- Add check constraint for relationship types
ALTER TABLE followers 
ADD CONSTRAINT followers_relationship_type_check 
CHECK (relationship_type IN ('follower', 'circle_mate'));

-- Update social_circle_requests table to support the new flow
ALTER TABLE social_circle_requests 
ADD COLUMN IF NOT EXISTS final_relationship VARCHAR(20) DEFAULT NULL;

-- Add check constraint for final relationship
ALTER TABLE social_circle_requests 
ADD CONSTRAINT final_relationship_check 
CHECK (final_relationship IN ('circle_mate', 'follower', 'rejected', NULL));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id);
CREATE INDEX IF NOT EXISTS idx_followers_relationship_type ON followers(relationship_type);
CREATE INDEX IF NOT EXISTS idx_circle_requests_final_relationship ON social_circle_requests(final_relationship);

-- Add comments for documentation
COMMENT ON TABLE followers IS 'Stores follower and circle mate relationships between users';
COMMENT ON COLUMN followers.relationship_type IS 'Type of relationship: follower (one-way) or circle_mate (bidirectional)';
COMMENT ON COLUMN social_circle_requests.final_relationship IS 'Final relationship decision when responding to request';

-- Create function to automatically sync followers when circle requests are processed
CREATE OR REPLACE FUNCTION sync_follower_relationships()
RETURNS TRIGGER AS $$
BEGIN
    -- When a circle request is sent, add sender as follower of recipient
    IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
        INSERT INTO followers (follower_id, following_id, relationship_type)
        VALUES (NEW.requester_id, NEW.recipient_id, 'follower')
        ON CONFLICT (follower_id, following_id) DO NOTHING;
        
        RETURN NEW;
    END IF;
    
    -- When a circle request is responded to
    IF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected') THEN
        
        -- If accepted and final_relationship is 'circle_mate'
        IF NEW.status = 'accepted' AND NEW.final_relationship = 'circle_mate' THEN
            -- Update existing follower relationship to circle_mate
            UPDATE followers 
            SET relationship_type = 'circle_mate', updated_at = NOW()
            WHERE follower_id = NEW.requester_id AND following_id = NEW.recipient_id;
            
            -- Create reverse relationship (circle mates follow each other)
            INSERT INTO followers (follower_id, following_id, relationship_type)
            VALUES (NEW.recipient_id, NEW.requester_id, 'circle_mate')
            ON CONFLICT (follower_id, following_id) 
            DO UPDATE SET relationship_type = 'circle_mate', updated_at = NOW();
            
        -- If accepted and final_relationship is 'follower'
        ELSIF NEW.status = 'accepted' AND NEW.final_relationship = 'follower' THEN
            -- Keep as follower relationship (no change needed)
            UPDATE followers 
            SET updated_at = NOW()
            WHERE follower_id = NEW.requester_id AND following_id = NEW.recipient_id;
            
        -- If rejected
        ELSIF NEW.status = 'rejected' THEN
            -- Remove the follower relationship
            DELETE FROM followers 
            WHERE follower_id = NEW.requester_id AND following_id = NEW.recipient_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- When a circle request is cancelled
    IF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'cancelled' THEN
        -- Remove the follower relationship
        DELETE FROM followers 
        WHERE follower_id = NEW.requester_id AND following_id = NEW.recipient_id;
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync relationships
DROP TRIGGER IF EXISTS sync_follower_relationships_trigger ON social_circle_requests;
CREATE TRIGGER sync_follower_relationships_trigger
    AFTER INSERT OR UPDATE ON social_circle_requests
    FOR EACH ROW
    EXECUTE FUNCTION sync_follower_relationships();

-- Create views for easy querying
CREATE OR REPLACE VIEW user_followers AS
SELECT 
    f.following_id as user_id,
    u.id as follower_id,
    u.username as follower_username,
    u.email as follower_email,
    f.relationship_type,
    f.created_at,
    f.updated_at
FROM followers f
JOIN users u ON f.follower_id = u.id
WHERE f.relationship_type IN ('follower', 'circle_mate');

CREATE OR REPLACE VIEW user_following AS
SELECT 
    f.follower_id as user_id,
    u.id as following_id,
    u.username as following_username,
    u.email as following_email,
    f.relationship_type,
    f.created_at,
    f.updated_at
FROM followers f
JOIN users u ON f.following_id = u.id
WHERE f.relationship_type IN ('follower', 'circle_mate');

CREATE OR REPLACE VIEW circle_mates AS
SELECT 
    f.follower_id as user_id,
    u.id as mate_id,
    u.username as mate_username,
    u.email as mate_email,
    f.created_at,
    f.updated_at
FROM followers f
JOIN users u ON f.following_id = u.id
WHERE f.relationship_type = 'circle_mate';