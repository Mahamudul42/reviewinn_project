-- Badge System Tables for ReviewInn
-- Following the game_ prefix convention

-- Badges table - stores all available badges
CREATE TABLE IF NOT EXISTS game_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon VARCHAR(10) NOT NULL,
  color VARCHAR(7) NOT NULL,
  category VARCHAR(50) NOT NULL,
  rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  requirements JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User badges table - tracks which badges users have unlocked
CREATE TABLE IF NOT EXISTS game_user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES game_badges(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  is_displayed BOOLEAN DEFAULT true,
  progress INTEGER DEFAULT 100,
  UNIQUE(user_id, badge_id)
);

-- Badge progress table - tracks user progress towards badges
CREATE TABLE IF NOT EXISTS game_badge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES game_badges(id) ON DELETE CASCADE,
  current_value INTEGER DEFAULT 0,
  target_value INTEGER NOT NULL,
  percentage DECIMAL(5,2) DEFAULT 0.0,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_badges_category ON game_badges(category);
CREATE INDEX IF NOT EXISTS idx_game_badges_rarity ON game_badges(rarity);
CREATE INDEX IF NOT EXISTS idx_game_badges_active ON game_badges(is_active);
CREATE INDEX IF NOT EXISTS idx_game_user_badges_user_id ON game_user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_game_user_badges_badge_id ON game_user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_game_user_badges_displayed ON game_user_badges(is_displayed);
CREATE INDEX IF NOT EXISTS idx_game_badge_progress_user_id ON game_badge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_game_badge_progress_badge_id ON game_badge_progress(badge_id);

-- Insert initial badge definitions
INSERT INTO game_badges (name, description, icon, color, category, rarity, requirements) VALUES
-- Registration & Welcome Badges
('Welcome Reviewer', 'Welcome to ReviewInn! Start your journey as a reviewer.', '👋', '#10b981', 'milestone', 'common', '{"type": "registration", "value": 1}'),

-- Reviewer Badges
('First Review', 'Published your first review on ReviewInn.', '✍️', '#3b82f6', 'reviewer', 'common', '{"type": "reviews_count", "value": 1}'),
('Review Rookie', 'Published 5 reviews. You''re getting the hang of it!', '📝', '#6366f1', 'reviewer', 'common', '{"type": "reviews_count", "value": 5}'),
('Review Pro', 'Published 25 reviews. You''re becoming a trusted voice!', '⭐', '#8b5cf6', 'reviewer', 'uncommon', '{"type": "reviews_count", "value": 25}'),
('Review Expert', 'Published 100 reviews. Your insights help the community!', '🏆', '#a855f7', 'reviewer', 'rare', '{"type": "reviews_count", "value": 100}'),
('Review Master', 'Published 500 reviews. You''re a true review master!', '👑', '#d946ef', 'reviewer', 'epic', '{"type": "reviews_count", "value": 500}'),
('Review Legend', 'Published 1000+ reviews. Your dedication is legendary!', '🌟', '#f59e0b', 'reviewer', 'legendary', '{"type": "reviews_count", "value": 1000}'),

-- Quality Badges
('Quality Writer', 'Received 50+ helpful votes on your reviews.', '📚', '#059669', 'reviewer', 'uncommon', '{"type": "helpful_votes", "value": 50}'),
('Trusted Reviewer', 'Received 200+ helpful votes. People trust your opinions!', '🎯', '#0d9488', 'reviewer', 'rare', '{"type": "helpful_votes", "value": 200}'),

-- Engagement Badges
('Conversationalist', 'Posted 50 comments on reviews.', '💬', '#06b6d4', 'engagement', 'common', '{"type": "comments_count", "value": 50}'),
('Community Contributor', 'Posted 200 comments. You make the community better!', '🤝', '#0ea5e9', 'engagement', 'uncommon', '{"type": "comments_count", "value": 200}'),
('Reaction Magnet', 'Received 500+ reactions on your content.', '🧲', '#ec4899', 'engagement', 'rare', '{"type": "reactions_received", "value": 500}'),

-- Explorer Badges
('Explorer', 'Reviewed 10 different entities.', '🗺️', '#84cc16', 'achievement', 'common', '{"type": "entities_reviewed", "value": 10}'),
('World Traveler', 'Reviewed 50 different entities across various categories.', '🌍', '#65a30d', 'achievement', 'uncommon', '{"type": "entities_reviewed", "value": 50}'),

-- Streak Badges
('Daily Reviewer', 'Reviewed something for 7 consecutive days.', '🔥', '#dc2626', 'achievement', 'uncommon', '{"type": "consecutive_days", "value": 7}'),
('Dedication Award', 'Reviewed something for 30 consecutive days!', '💪', '#b91c1c', 'achievement', 'rare', '{"type": "consecutive_days", "value": 30}'),

-- Community Badges
('Circle Leader', 'Have 50+ members in your review circle.', '👥', '#7c3aed', 'community', 'rare', '{"type": "circle_members", "value": 50}'),

-- Milestone Badges
('One Month Strong', 'Been a member for 30 days.', '📅', '#4338ca', 'milestone', 'common', '{"type": "account_age", "value": 30}'),
('Veteran Reviewer', 'Been a member for 1 year. Thank you for your loyalty!', '🎖️', '#3730a3', 'milestone', 'epic', '{"type": "account_age", "value": 365}')

ON CONFLICT (name) DO NOTHING;

-- Update function for badge progress
CREATE OR REPLACE FUNCTION update_badge_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the percentage based on current_value and target_value
  NEW.percentage = CASE 
    WHEN NEW.target_value > 0 THEN LEAST(100.0, (NEW.current_value::DECIMAL / NEW.target_value::DECIMAL) * 100)
    ELSE 0.0
  END;
  
  NEW.last_updated = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic percentage calculation
CREATE TRIGGER trigger_update_badge_progress
  BEFORE INSERT OR UPDATE ON game_badge_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_badge_progress();