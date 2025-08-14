-- Fix the views with correct column names

-- Create views for easy querying
CREATE OR REPLACE VIEW user_followers AS
SELECT 
    f.user_id,
    f.follower_user_id as follower_id,
    u.username as follower_username,
    u.email as follower_email,
    u.name as follower_name,
    u.avatar as follower_avatar,
    f.relationship_type,
    f.created_at,
    f.updated_at
FROM followers f
JOIN users u ON f.follower_user_id = u.user_id
WHERE f.relationship_type IN ('follower', 'circle_mate');

CREATE OR REPLACE VIEW user_following AS
SELECT 
    f.follower_user_id as user_id,
    f.user_id as following_id,
    u.username as following_username,
    u.email as following_email,
    u.name as following_name,
    u.avatar as following_avatar,
    f.relationship_type,
    f.created_at,
    f.updated_at
FROM followers f
JOIN users u ON f.user_id = u.user_id
WHERE f.relationship_type IN ('follower', 'circle_mate');

CREATE OR REPLACE VIEW circle_mates AS
SELECT 
    f.user_id,
    f.follower_user_id as mate_id,
    u.username as mate_username,
    u.email as mate_email,
    u.name as mate_name,
    u.avatar as mate_avatar,
    f.created_at,
    f.updated_at
FROM followers f
JOIN users u ON f.follower_user_id = u.user_id
WHERE f.relationship_type = 'circle_mate';