-- Enhanced Notifications Table Migration
-- This migration creates an enhanced notifications table with all the new notification types

-- Drop existing notification table if it exists (be careful in production!)
DROP TABLE IF EXISTS notifications CASCADE;

-- Create enhanced notification type enum
CREATE TYPE notification_type_enum AS ENUM (
    -- Circle-related notifications
    'circle_request',
    'circle_accepted',
    'circle_declined',
    'circle_invite',
    
    -- Review-related notifications
    'review_reply',
    'review_vote',
    'review_reaction',
    'review_comment',
    'review_shared',
    'review_same_entity',
    
    -- Gamification notifications
    'badge_earned',
    'level_up',
    'goal_completed',
    'milestone_reached',
    'daily_task_complete',
    
    -- Social notifications
    'friend_request',
    'friend_accepted',
    'user_followed',
    'user_mentioned',
    
    -- Messaging notifications
    'message',
    'message_reaction',
    
    -- System notifications
    'system_announcement',
    'account_verification',
    'security_alert',
    
    -- Legacy (keeping for backward compatibility)
    'post_like',
    'comment',
    'share',
    'tag'
);

-- Create enhanced notifications table
CREATE TABLE notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    actor_id BIGINT NULL,
    notification_type notification_type_enum NOT NULL,
    entity_type VARCHAR(50) NULL,
    entity_id BIGINT NULL,
    title VARCHAR(255) NOT NULL,
    content VARCHAR(1000) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_actor_id ON notifications(actor_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_entity ON notifications(entity_type, entity_id);

-- Create composite index for efficient querying
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- Add some sample data for testing (remove in production)
INSERT INTO notifications (user_id, actor_id, notification_type, entity_type, entity_id, title, content, is_read, data) VALUES
(1, 2, 'circle_request', 'circle', 1, 'New Circle Request', 'wants to join your circle ''Tech Reviews''', FALSE, '{"circle_name": "Tech Reviews"}'),
(1, 3, 'review_reaction', 'review', 1, 'Review Reaction', 'reacted ❤️ to your review', FALSE, '{"reaction_type": "love"}'),
(1, NULL, 'badge_earned', 'badge', 1, 'Badge Earned! 🏆', 'You earned the ''First Review'' badge!', FALSE, '{"badge_name": "First Review"}'),
(1, 2, 'review_comment', 'review', 1, 'New Comment', 'commented on your review', FALSE, '{"entity_name": "Sample Business"}'),
(1, NULL, 'level_up', 'user', 1, 'Level Up! 🎉', 'Congratulations! You reached level 2!', FALSE, '{"new_level": 2}');

-- Add comments for documentation
COMMENT ON TABLE notifications IS 'Enhanced notifications table with comprehensive notification types';
COMMENT ON COLUMN notifications.notification_id IS 'Unique identifier for the notification';
COMMENT ON COLUMN notifications.user_id IS 'ID of the user who receives the notification';
COMMENT ON COLUMN notifications.actor_id IS 'ID of the user who triggered the notification (nullable for system notifications)';
COMMENT ON COLUMN notifications.notification_type IS 'Type of notification from the enum';
COMMENT ON COLUMN notifications.entity_type IS 'Type of entity related to the notification (review, circle, etc.)';
COMMENT ON COLUMN notifications.entity_id IS 'ID of the related entity';
COMMENT ON COLUMN notifications.title IS 'Short title of the notification';
COMMENT ON COLUMN notifications.content IS 'Main content/message of the notification';
COMMENT ON COLUMN notifications.is_read IS 'Whether the notification has been read';
COMMENT ON COLUMN notifications.data IS 'Additional structured data in JSON format';
COMMENT ON COLUMN notifications.created_at IS 'When the notification was created';
COMMENT ON COLUMN notifications.updated_at IS 'When the notification was last updated';

-- Grant permissions (adjust as needed for your setup)
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO reviewsite_user;
GRANT USAGE, SELECT ON notifications_notification_id_seq TO reviewsite_user;