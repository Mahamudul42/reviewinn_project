-- 🎯 Unified Database Schema for Review Platform
-- Updated to reflect current database state after sync
-- Database: PostgreSQL 14+
-- Supports: Users, Profiles, Connections, Sessions, Conversations, Messages, Notifications, Settings, Entities, Categories, Reviews, Gamification, Analytics, Search

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS ltree;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. ENUM Types for Better Type Safety
CREATE TYPE entity_category_enum AS ENUM ('Professional', 'Company', 'Place', 'Product');
CREATE TYPE review_reaction_enum AS ENUM ('thumbs_up', 'thumbs_down', 'bomb', 'love', 'haha', 'celebration', 'sad', 'eyes');
CREATE TYPE notification_type_enum AS ENUM ('friend_request', 'post_like', 'comment', 'message', 'share', 'tag', 'badge_earned', 'goal_completed', 'review_reply', 'review_vote');
CREATE TYPE connection_status_enum AS ENUM ('pending', 'accepted', 'blocked', 'rejected');
CREATE TYPE connection_type_enum AS ENUM ('follow', 'friend');
CREATE TYPE reaction_type AS ENUM ('thumbs_up', 'thumbs_down', 'bomb', 'love', 'haha', 'celebration', 'sad', 'eyes');
CREATE TYPE comment_reaction_type AS ENUM ('thumbs_up', 'thumbs_down', 'bomb', 'love', 'haha', 'celebration', 'sad', 'eyes');

-- 3. Shared Trigger Function for Updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Users Table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    avatar VARCHAR(255),
    bio TEXT,
    level INTEGER DEFAULT 1,
    points INTEGER DEFAULT 0,
    preferences JSONB DEFAULT '{}',
    stats JSONB DEFAULT '{}',
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    hashed_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_username ON users(username);
CREATE TRIGGER trg_update_users_updated_at
BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 5. User Profiles (Enhanced)
CREATE TABLE user_profiles (
    profile_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    bio TEXT,
    location VARCHAR(100),
    avatar_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    work JSONB,
    education JSONB,
    relationship_status VARCHAR(50) CHECK (relationship_status IN ('Single', 'Married', 'In a relationship', 'Other')),
    interests JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_interests ON user_profiles USING GIN(interests);
CREATE TRIGGER trg_update_user_profiles_updated_at
BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 6. User Connections (Enhanced)
CREATE TABLE user_connections (
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    target_user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    connection_type connection_type_enum NOT NULL,
    status connection_status_enum DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, target_user_id),
    CHECK (user_id != target_user_id)
);
CREATE INDEX idx_user_connections_user_id ON user_connections(user_id);
CREATE INDEX idx_user_connections_target_id ON user_connections(target_user_id);
CREATE INDEX idx_user_connections_type_status ON user_connections(connection_type, status);
CREATE TRIGGER trg_update_user_connections_updated_at
BEFORE UPDATE ON user_connections FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 7. User Sessions
CREATE TABLE user_sessions (
    session_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash CHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    device_info JSONB,
    is_valid BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE TRIGGER trg_update_user_sessions_updated_at
BEFORE UPDATE ON user_sessions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 8. Conversations
CREATE TABLE conversations (
    conversation_id BIGSERIAL PRIMARY KEY,
    group_name VARCHAR(100),
    is_group BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER trg_update_conversations_updated_at
BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 9. Conversation Participants
CREATE TABLE conversation_participants (
    conversation_id BIGINT NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP WITH TIME ZONE,
    role VARCHAR(20) CHECK (role IN ('member', 'admin')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'left', 'removed')),
    PRIMARY KEY (conversation_id, user_id)
);
CREATE INDEX idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id);

-- 10. Messages
CREATE TABLE messages (
    message_id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'system')),
    content TEXT,
    media_urls JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE TRIGGER trg_update_messages_updated_at
BEFORE UPDATE ON messages FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 11. Notifications (Enhanced)
CREATE TABLE notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    actor_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    type notification_type_enum NOT NULL,
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('post', 'comment', 'message', 'friendship', 'badge', 'goal')),
    entity_id BIGINT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    content JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_entity ON notifications(entity_type, entity_id);
CREATE TRIGGER trg_update_notifications_updated_at
BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 12. User Settings
CREATE TABLE user_settings (
    user_id BIGINT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    privacy_settings JSONB,
    notification_settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_user_settings_privacy ON user_settings USING GIN(privacy_settings);
CREATE INDEX idx_user_settings_notifications ON user_settings USING GIN(notification_settings);
CREATE TRIGGER trg_update_user_settings_updated_at
BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 13. Categories Table
CREATE TABLE categories (
    category_id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- 14. Subcategories Table (Hierarchical, with ltree path)
CREATE TABLE subcategories (
    subcategory_id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category_id BIGINT REFERENCES categories(category_id) ON DELETE CASCADE,
    parent_id BIGINT REFERENCES subcategories(subcategory_id) ON DELETE SET NULL,
    path LTREE,
    path_text TEXT,
    level INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX idx_subcategories_path ON subcategories USING GIST(path);

-- 15. Entities Table (Enhanced)
CREATE TABLE entities (
    entity_id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL DEFAULT 'professionals',
    subcategory VARCHAR(100),
    avatar VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    is_claimed BOOLEAN DEFAULT FALSE,
    claimed_by INTEGER REFERENCES users(user_id),
    claimed_at TIMESTAMPTZ,
    context JSONB DEFAULT '{}',
    average_rating FLOAT DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_entities_entity_type ON entities(category);
CREATE INDEX idx_entities_category_rating ON entities(category, average_rating DESC);
CREATE INDEX idx_entities_subcategory ON entities(subcategory);
CREATE INDEX idx_entities_verified ON entities(is_verified);
CREATE TRIGGER trg_update_entities_updated_at
BEFORE UPDATE ON entities FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 16. Entity ↔ Subcategory Mapping (Many-to-Many)
CREATE TABLE entity_subcategories (
    entity_id INTEGER REFERENCES entities(entity_id) ON DELETE CASCADE,
    subcategory_id BIGINT REFERENCES subcategories(subcategory_id) ON DELETE CASCADE,
    PRIMARY KEY (entity_id, subcategory_id)
);

-- 17. Entity Relations (for entity relationships)
CREATE TABLE entity_relations (
    relation_id BIGSERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES entities(entity_id) ON DELETE CASCADE,
    related_entity_id INTEGER REFERENCES entities(entity_id) ON DELETE CASCADE,
    relation_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (entity_id, related_entity_id, relation_type)
);

-- 18. Entity Roles (for Person/Company)
CREATE TABLE entity_roles (
    role_id BIGSERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES entities(entity_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    organization TEXT,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_entity_roles_entity_id ON entity_roles(entity_id);
CREATE TRIGGER trg_update_entity_roles_updated_at
BEFORE UPDATE ON entity_roles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 19. Entity Metadata (for dynamic forms)
CREATE TABLE entity_metadata (
    metadata_id BIGSERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES entities(entity_id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    field_type TEXT CHECK (field_type IN ('text', 'checkbox', 'radio', 'number', 'date')),
    options JSONB,
    is_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_entity_metadata_entity_id ON entity_metadata(entity_id);
CREATE TRIGGER trg_update_entity_metadata_updated_at
BEFORE UPDATE ON entity_metadata FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 20. Reviews Table (Enhanced)
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    entity_id INTEGER REFERENCES entities(entity_id) ON DELETE CASCADE,
    title VARCHAR(200),
    content TEXT NOT NULL,
    category VARCHAR(20),
    overall_rating FLOAT NOT NULL,
    criteria JSONB DEFAULT '{}',
    ratings JSONB DEFAULT '{}',
    pros JSONB DEFAULT '[]',
    cons JSONB DEFAULT '[]',
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_entity_id ON reviews(entity_id);
CREATE INDEX idx_reviews_overall_rating ON reviews(overall_rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_reviews_entity_rating ON reviews(entity_id, overall_rating);
CREATE TRIGGER trg_update_reviews_updated_at
BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 21. Review Versions
CREATE TABLE review_versions (
    version_id BIGSERIAL PRIMARY KEY,
    review_id INTEGER REFERENCES reviews(review_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_review_versions_review_id ON review_versions(review_id);
CREATE INDEX idx_review_versions_user_id ON review_versions(user_id);
CREATE TRIGGER trg_update_review_versions_updated_at
BEFORE UPDATE ON review_versions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 22. Review Comments (Enhanced)
CREATE TABLE comments (
    comment_id SERIAL PRIMARY KEY,
    review_id INTEGER REFERENCES reviews(review_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_review_comments_user_id ON comments(user_id);
CREATE INDEX idx_review_comments_review_id ON comments(review_id);
CREATE TRIGGER trg_update_review_comments_updated_at
BEFORE UPDATE ON comments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 23. Review Reactions (Enhanced)
CREATE TABLE review_reactions (
    reaction_id SERIAL PRIMARY KEY,
    review_id INTEGER REFERENCES reviews(review_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    reaction_type reaction_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (review_id, user_id)
);
CREATE INDEX idx_review_reactions_user_id ON review_reactions(user_id);
CREATE INDEX idx_review_reactions_review_id ON review_reactions(review_id);
CREATE TRIGGER trg_update_review_reactions_updated_at
BEFORE UPDATE ON review_reactions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 24. Comment Reactions
CREATE TABLE comment_reactions (
    reaction_id SERIAL PRIMARY KEY,
    comment_id INTEGER REFERENCES comments(comment_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    reaction_type comment_reaction_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (comment_id, user_id)
);
CREATE INDEX idx_comment_reactions_comment_id ON comment_reactions(comment_id);
CREATE INDEX idx_comment_reactions_user_id ON comment_reactions(user_id);
CREATE INDEX idx_comment_reactions_type ON comment_reactions(reaction_type);
CREATE TRIGGER trg_update_comment_reactions_updated_at
BEFORE UPDATE ON comment_reactions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 25. User Events
CREATE TABLE user_events (
    event_id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    event_type TEXT CHECK (event_type IN ('login', 'edit_profile', 'delete_review', 'search')),
    event_data JSONB,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_user_events_user_id ON user_events(user_id);
CREATE INDEX idx_user_events_event_type ON user_events(event_type);
CREATE TRIGGER trg_update_user_events_updated_at
BEFORE UPDATE ON user_events FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 26. User Search History
CREATE TABLE user_search_history (
    search_id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    matched_entity_ids BIGINT[],
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_search_history_user_id ON user_search_history(user_id);
CREATE INDEX idx_search_history_query ON user_search_history USING GIN (query gin_trgm_ops);
CREATE TRIGGER trg_update_user_search_history_updated_at
BEFORE UPDATE ON user_search_history FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 27. User Entity Views
CREATE TABLE user_entity_views (
    view_id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    entity_id INTEGER REFERENCES entities(entity_id),
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_entity_views_user_id ON user_entity_views(user_id);
CREATE INDEX idx_entity_views_entity_id ON user_entity_views(entity_id);
CREATE TRIGGER trg_update_user_entity_views_updated_at
BEFORE UPDATE ON user_entity_views FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 28. User Progress (Enhanced)
CREATE TABLE user_progress (
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    points INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    progress_to_next_level INTEGER NOT NULL DEFAULT 0,
    daily_streak INTEGER NOT NULL DEFAULT 0,
    last_reviewed DATE,
    published_reviews INTEGER NOT NULL DEFAULT 0,
    review_target INTEGER NOT NULL DEFAULT 10,
    total_helpful_votes INTEGER DEFAULT 0,
    average_rating_given DECIMAL(3,2) DEFAULT 0.00,
    entities_reviewed INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_user_progress_points ON user_progress(points);
CREATE INDEX idx_user_progress_last_reviewed ON user_progress(last_reviewed);
CREATE INDEX idx_user_progress_level_points ON user_progress(level DESC, points DESC);
CREATE TRIGGER trg_update_user_progress_updated_at
BEFORE UPDATE ON user_progress FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 29. Badge Definitions & Awards
CREATE TABLE badge_definitions (
    badge_definition_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    criteria JSONB NOT NULL,
    image_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_badge_definitions_criteria ON badge_definitions USING GIN(criteria);
CREATE TRIGGER trg_update_badge_definitions_updated_at
BEFORE UPDATE ON badge_definitions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE badge_awards (
    award_id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    badge_definition_id INTEGER REFERENCES badge_definitions(badge_definition_id) ON DELETE RESTRICT,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, badge_definition_id)
);
CREATE INDEX idx_badge_awards_user_id ON badge_awards(user_id);
CREATE INDEX idx_badge_awards_badge_definition_id ON badge_awards(badge_definition_id);
CREATE TRIGGER trg_update_badge_awards_updated_at
BEFORE UPDATE ON badge_awards FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 30. Weekly Engagement
CREATE TABLE weekly_engagement (
    engagement_id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    engagement_date DATE NOT NULL,
    reviews INTEGER NOT NULL DEFAULT 0,
    reactions INTEGER NOT NULL DEFAULT 0,
    comments INTEGER NOT NULL DEFAULT 0,
    reports INTEGER NOT NULL DEFAULT 0,
    forwards INTEGER NOT NULL DEFAULT 0,
    points INTEGER NOT NULL DEFAULT 0,
    streak_broken BOOLEAN DEFAULT FALSE,
    weekly_rank INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, engagement_date)
);
CREATE INDEX idx_weekly_engagement_user_id_date ON weekly_engagement(user_id, engagement_date);
CREATE TRIGGER trg_update_weekly_engagement_updated_at
BEFORE UPDATE ON weekly_engagement FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 31. Daily Tasks
CREATE TABLE daily_tasks (
    task_id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    label VARCHAR(100) NOT NULL,
    complete BOOLEAN NOT NULL DEFAULT FALSE,
    task_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, label, task_date)
);
CREATE INDEX idx_daily_tasks_user_id_date ON daily_tasks(user_id, task_date);
CREATE TRIGGER trg_update_daily_tasks_updated_at
BEFORE UPDATE ON daily_tasks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 32. Whats Next Goals
CREATE TABLE whats_next_goals (
    goal_id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('points', 'level', 'daily_streak', 'reviews', 'reactions', 'comments', 'forwards')),
    target_value INTEGER NOT NULL,
    reward VARCHAR(100) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_whats_next_goals_user_id ON whats_next_goals(user_id);
CREATE TRIGGER trg_update_whats_next_goals_updated_at
BEFORE UPDATE ON whats_next_goals FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 33. Search and Analytics Tables
CREATE TABLE search_analytics (
    search_id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    clicked_entity_id BIGINT REFERENCES entities(entity_id) ON DELETE SET NULL,
    search_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    filters JSONB DEFAULT '{}'
);

CREATE TABLE entity_analytics (
    entity_id INTEGER PRIMARY KEY REFERENCES entities(entity_id) ON DELETE CASCADE,
    total_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    average_time_on_page INTEGER DEFAULT 0, -- in seconds
    bounce_rate DECIMAL(5,2) DEFAULT 0.00,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 34. Review Templates (For better UX)
CREATE TABLE review_templates (
    template_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category_id BIGINT REFERENCES categories(category_id),
    subcategory_id BIGINT REFERENCES subcategories(subcategory_id),
    template_data JSONB NOT NULL, -- Store template structure
    is_public BOOLEAN DEFAULT FALSE,
    created_by BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 35. Entity Comparison (For comparison features)
CREATE TABLE entity_comparisons (
    comparison_id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    entity_ids BIGINT[] NOT NULL, -- Array of entity IDs being compared
    comparison_data JSONB NOT NULL, -- Store comparison matrix
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 36. Views for Common Queries
CREATE OR REPLACE VIEW entity_summary AS
SELECT 
    e.entity_id,
    e.name,
    e.description,
    e.category,
    e.average_rating,
    e.review_count,
    e.is_verified,
    e.avatar,
    e.context,
    c.name as category_name,
    s.name as subcategory_name,
    e.created_at,
    e.updated_at
FROM entities e
LEFT JOIN categories c ON e.category = c.name
LEFT JOIN subcategories s ON e.subcategory = s.name;

CREATE OR REPLACE VIEW user_summary AS
SELECT 
    u.user_id,
    u.email,
    u.username,
    u.name,
    u.avatar,
    u.bio,
    u.level,
    u.points,
    u.preferences,
    u.stats,
    u.is_verified,
    u.is_active,
    u.created_at,
    u.updated_at,
    up.bio as profile_bio,
    up.location,
    up.avatar_url,
    up.is_verified as profile_verified,
    pr.points as progress_points,
    pr.level as progress_level,
    pr.published_reviews,
    pr.daily_streak,
    pr.last_reviewed,
    pr.review_target
FROM users u
LEFT JOIN user_profiles up ON u.user_id = up.user_id
LEFT JOIN user_progress pr ON u.user_id = pr.user_id;

-- 37. Functions for Common Operations
CREATE OR REPLACE FUNCTION update_entity_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update entity average rating and review count
    UPDATE entities 
    SET 
        average_rating = (
            SELECT COALESCE(AVG(overall_rating), 0)
            FROM reviews 
            WHERE entity_id = COALESCE(NEW.entity_id, OLD.entity_id)
        ),
        review_count = (
            SELECT COUNT(*)
            FROM reviews 
            WHERE entity_id = COALESCE(NEW.entity_id, OLD.entity_id)
        )
    WHERE entity_id = COALESCE(NEW.entity_id, OLD.entity_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating entity stats when reviews change
CREATE TRIGGER trg_update_entity_rating_stats
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE PROCEDURE update_entity_rating_stats();

-- Function to Update Subcategory Paths
CREATE OR REPLACE FUNCTION update_subcategory_paths()
RETURNS TRIGGER AS $$
BEGIN
  -- Update path and path_text for the affected subcategory
  UPDATE subcategories
  SET 
    path = (
      CASE 
        WHEN NEW.parent_id IS NULL THEN NEW.subcategory_id::TEXT::LTREE
        ELSE (SELECT path FROM subcategories WHERE subcategory_id = NEW.parent_id) || NEW.subcategory_id::TEXT
      END
    ),
    path_text = (
      CASE 
        WHEN NEW.parent_id IS NULL THEN NEW.name
        ELSE (SELECT path_text FROM subcategories WHERE subcategory_id = NEW.parent_id) || ' > ' || NEW.name
      END
    ),
    level = (
      CASE 
        WHEN NEW.parent_id IS NULL THEN 1
        ELSE (SELECT level + 1 FROM subcategories WHERE subcategory_id = NEW.parent_id)
      END
    )
  WHERE subcategory_id = NEW.subcategory_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update paths on insert or update
CREATE TRIGGER trg_update_subcategory_paths
AFTER INSERT OR UPDATE OF parent_id, name ON subcategories
FOR EACH ROW EXECUTE PROCEDURE update_subcategory_paths();

-- 38. Sample Data Insertion
INSERT INTO categories (name) VALUES 
    ('Professionals'),
    ('Companies'),
    ('Places'),
    ('Products')
ON CONFLICT (name) DO NOTHING;

INSERT INTO subcategories (name, category_id, parent_id) VALUES 
    ('Doctors', 1, NULL),
    ('Lawyers', 1, NULL),
    ('Teachers', 1, NULL),
    ('Cardiologists', 1, 1),
    ('Dermatologists', 1, 1),
    ('Tech Companies', 2, NULL),
    ('Restaurants', 3, NULL),
    ('Software', 4, NULL)
ON CONFLICT DO NOTHING;

-- 39. Comments for Documentation
COMMENT ON TABLE entities IS 'Main entities table for professionals, companies, places, and products';
COMMENT ON TABLE reviews IS 'User reviews for entities with ratings and feedback';
COMMENT ON TABLE review_reactions IS 'User reactions to reviews (like, helpful, etc.)';
COMMENT ON TABLE user_progress IS 'User gamification progress and statistics';
COMMENT ON TABLE search_analytics IS 'Search query analytics for improving search';
COMMENT ON TABLE entity_analytics IS 'Entity view and engagement analytics';

-- 🎉 Database setup complete!
-- Your review platform database is now synchronized with the unified schema. 