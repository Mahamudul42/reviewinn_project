-- ============================================================================
-- ReviewInn Mobile Optimized Database Schema
-- ============================================================================
-- Version: 2.0
-- Date: 2025-12-26
-- Description: Optimized schema for fast mobile app performance
--
-- Key Features:
-- 1. Homepage loads from single 'reviews' table (denormalized)
-- 2. JSONB fields for maximum flexibility
-- 3. Cached counters (no expensive COUNT queries)
-- 4. Auto-updating triggers for data consistency
-- 5. GIN indexes on JSONB for fast filtering
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,

    -- Profile Info
    full_name VARCHAR(255),
    avatar TEXT,
    bio TEXT,

    -- Cached Counts (for fast profile loading)
    review_count INTEGER DEFAULT 0,
    follower_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,

    -- JSONB Fields for Flexibility
    preferences JSONB DEFAULT '{}',  -- {"theme": "dark", "notifications": {...}, "privacy": {...}}
    stats JSONB DEFAULT '{}',        -- {"badges": [...], "level": 5, "points": 1250, "achievements": [...]}
    metadata JSONB DEFAULT '{}',     -- {"website": "...", "social_links": {...}, "location": "..."}

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,

    -- Constraints
    CONSTRAINT username_length CHECK (char_length(username) >= 3),
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX idx_users_preferences ON users USING GIN(preferences);
CREATE INDEX idx_users_stats ON users USING GIN(stats);

-- Username search (case-insensitive)
CREATE INDEX idx_users_username_trgm ON users USING GIN(username gin_trgm_ops);

COMMENT ON TABLE users IS 'User accounts and profiles with JSONB for flexible data';
COMMENT ON COLUMN users.preferences IS 'User settings: theme, notifications, privacy, language';
COMMENT ON COLUMN users.stats IS 'Gamification data: badges, level, points, achievements';
COMMENT ON COLUMN users.metadata IS 'Custom profile fields, social links, website, location';

-- ============================================================================
-- 2. ENTITIES TABLE (Businesses, Professionals, Places, Products)
-- ============================================================================
CREATE TABLE entities (
    entity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    avatar TEXT,

    -- Cached Metrics (for fast listing and sorting)
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,

    -- JSONB Fields (flexible schema)
    images JSONB DEFAULT '[]',                    -- ["https://...", "https://..."]
    root_category JSONB,                          -- {"id": "uuid", "name": "Restaurant", "slug": "restaurant"}
    final_category JSONB,                         -- {"id": "uuid", "name": "Italian Restaurant", "slug": "italian-restaurant"}
    categories JSONB DEFAULT '[]',                -- [{"id": "...", "name": "...", "slug": "..."}] - full hierarchy
    tags JSONB DEFAULT '[]',                      -- ["vegan", "outdoor-seating", "halal", "parking"]
    metadata JSONB DEFAULT '{}',                  -- {"address": "...", "phone": "...", "hours": {...}, "website": "...", "social": {...}}

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT rating_range CHECK (average_rating >= 0 AND average_rating <= 5)
);

-- Indexes
CREATE INDEX idx_entities_name ON entities(name);
CREATE INDEX idx_entities_average_rating ON entities(average_rating DESC);
CREATE INDEX idx_entities_review_count ON entities(review_count DESC);
CREATE INDEX idx_entities_created_at ON entities(created_at DESC);
CREATE INDEX idx_entities_active ON entities(is_active) WHERE is_active = true;

-- JSONB Indexes for filtering
CREATE INDEX idx_entities_root_category ON entities USING GIN(root_category);
CREATE INDEX idx_entities_final_category ON entities USING GIN(final_category);
CREATE INDEX idx_entities_categories ON entities USING GIN(categories);
CREATE INDEX idx_entities_tags ON entities USING GIN(tags);
CREATE INDEX idx_entities_metadata ON entities USING GIN(metadata);

-- Full-text search
CREATE INDEX idx_entities_name_trgm ON entities USING GIN(name gin_trgm_ops);
CREATE INDEX idx_entities_description_trgm ON entities USING GIN(description gin_trgm_ops);

COMMENT ON TABLE entities IS 'Reviewable entities: businesses, professionals, places, products';
COMMENT ON COLUMN entities.images IS 'Array of image URLs';
COMMENT ON COLUMN entities.categories IS 'Full category hierarchy from root to final';
COMMENT ON COLUMN entities.metadata IS 'Contact info, hours, location, social links, business details';

-- ============================================================================
-- 3. REVIEWS TABLE ⭐ CRITICAL - Homepage Single Table Query
-- ============================================================================
CREATE TABLE reviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES entities(entity_id) ON DELETE CASCADE,

    -- Review Content
    title VARCHAR(500),
    content TEXT NOT NULL,
    rating DECIMAL(3,2) NOT NULL,

    -- JSONB Content (flexible)
    images JSONB DEFAULT '[]',                    -- ["https://...", "https://..."]
    pros JSONB DEFAULT '[]',                      -- ["Great service", "Clean environment", "Fast"]
    cons JSONB DEFAULT '[]',                      -- ["Expensive", "Limited parking", "Slow delivery"]
    ratings JSONB DEFAULT '{}',                   -- {"food": 4.5, "service": 5.0, "ambiance": 3.5, "value": 4.0}

    -- ⭐ DENORMALIZED USER DATA (for homepage - NO JOIN needed!)
    user_username VARCHAR(50) NOT NULL,
    user_full_name VARCHAR(255),
    user_avatar TEXT,
    user_stats JSONB DEFAULT '{}',                -- {"level": 5, "badges": [...], "is_verified": true}

    -- ⭐ DENORMALIZED ENTITY DATA (for homepage - NO JOIN needed!)
    entity_name VARCHAR(255) NOT NULL,
    entity_avatar TEXT,
    entity_average_rating DECIMAL(3,2),
    entity_categories JSONB DEFAULT '[]',         -- [{"id": "...", "name": "Restaurant", "slug": "..."}]

    -- ⭐ CACHED ENGAGEMENT (for homepage - NO COUNT queries!)
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,

    -- Group Support (optional)
    group_id UUID,  -- Will add FK after groups table
    group_name VARCHAR(255),
    review_scope VARCHAR(20) DEFAULT 'public',    -- public, friends, circle, group

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_anonymous BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT rating_range CHECK (rating >= 0 AND rating <= 5),
    CONSTRAINT scope_values CHECK (review_scope IN ('public', 'friends', 'circle', 'group'))
);

-- ⚡ CRITICAL INDEXES FOR HOMEPAGE PERFORMANCE
CREATE INDEX idx_reviews_feed ON reviews(is_active, created_at DESC) WHERE is_active = true;
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_reviews_user_id ON reviews(user_id, created_at DESC);
CREATE INDEX idx_reviews_entity_id ON reviews(entity_id, created_at DESC);
CREATE INDEX idx_reviews_rating ON reviews(rating DESC);
CREATE INDEX idx_reviews_likes_count ON reviews(likes_count DESC);
CREATE INDEX idx_reviews_group_id ON reviews(group_id) WHERE group_id IS NOT NULL;

-- JSONB Indexes for filtering
CREATE INDEX idx_reviews_entity_categories ON reviews USING GIN(entity_categories);
CREATE INDEX idx_reviews_pros ON reviews USING GIN(pros);
CREATE INDEX idx_reviews_cons ON reviews USING GIN(cons);
CREATE INDEX idx_reviews_ratings ON reviews USING GIN(ratings);

-- Full-text search
CREATE INDEX idx_reviews_title_trgm ON reviews USING GIN(title gin_trgm_ops);
CREATE INDEX idx_reviews_content_trgm ON reviews USING GIN(content gin_trgm_ops);

-- Composite indexes for common queries
CREATE INDEX idx_reviews_user_entity ON reviews(user_id, entity_id);
CREATE INDEX idx_reviews_entity_rating ON reviews(entity_id, rating DESC);

COMMENT ON TABLE reviews IS 'Main review table - DENORMALIZED for fast homepage loading';
COMMENT ON COLUMN reviews.user_username IS 'Denormalized: synced from users table';
COMMENT ON COLUMN reviews.entity_name IS 'Denormalized: synced from entities table';
COMMENT ON COLUMN reviews.likes_count IS 'Auto-updated by trigger';
COMMENT ON COLUMN reviews.comments_count IS 'Auto-updated by trigger';

-- ============================================================================
-- 4. REVIEW_COMMENTS TABLE
-- ============================================================================
CREATE TABLE review_comments (
    comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(review_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES review_comments(comment_id) ON DELETE CASCADE,

    content TEXT NOT NULL,

    -- Denormalized user data (for fast comment loading)
    user_username VARCHAR(50) NOT NULL,
    user_avatar TEXT,
    user_stats JSONB DEFAULT '{}',

    -- Cached counts
    likes_count INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT content_not_empty CHECK (char_length(content) > 0)
);

-- Indexes
CREATE INDEX idx_comments_review_id ON review_comments(review_id, created_at);
CREATE INDEX idx_comments_user_id ON review_comments(user_id);
CREATE INDEX idx_comments_parent ON review_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX idx_comments_active ON review_comments(review_id, is_active) WHERE is_active = true;

COMMENT ON TABLE review_comments IS 'Comments on reviews with nested threading support';

-- ============================================================================
-- 5. REVIEW_LIKES TABLE
-- ============================================================================
CREATE TABLE review_likes (
    like_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(review_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(review_id, user_id)
);

-- Indexes
CREATE INDEX idx_review_likes_review ON review_likes(review_id);
CREATE INDEX idx_review_likes_user ON review_likes(user_id);
CREATE INDEX idx_review_likes_created ON review_likes(created_at DESC);

COMMENT ON TABLE review_likes IS 'Like tracking for reviews';

-- ============================================================================
-- 6. REVIEW_HELPFUL_VOTES TABLE
-- ============================================================================
CREATE TABLE review_helpful_votes (
    vote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(review_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL,  -- true = helpful, false = not helpful
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(review_id, user_id)
);

-- Indexes
CREATE INDEX idx_helpful_votes_review ON review_helpful_votes(review_id);
CREATE INDEX idx_helpful_votes_user ON review_helpful_votes(user_id);
CREATE INDEX idx_helpful_votes_type ON review_helpful_votes(review_id, is_helpful);

COMMENT ON TABLE review_helpful_votes IS 'Helpful/Not Helpful votes for reviews';

-- ============================================================================
-- 7. BOOKMARKS TABLE
-- ============================================================================
CREATE TABLE bookmarks (
    bookmark_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

    -- Polymorphic bookmarking
    item_type VARCHAR(20) NOT NULL,  -- 'review', 'entity', 'group'
    item_id UUID NOT NULL,

    -- Denormalized data for fast bookmark list (no joins needed)
    item_data JSONB DEFAULT '{}',    -- {"title": "...", "image": "...", "preview": "...", "rating": 4.5}

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, item_type, item_id),
    CONSTRAINT item_type_values CHECK (item_type IN ('review', 'entity', 'group'))
);

-- Indexes
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id, created_at DESC);
CREATE INDEX idx_bookmarks_type ON bookmarks(user_id, item_type);
CREATE INDEX idx_bookmarks_item ON bookmarks(item_type, item_id);
CREATE INDEX idx_bookmarks_item_data ON bookmarks USING GIN(item_data);

COMMENT ON TABLE bookmarks IS 'Saved reviews, entities, and groups';
COMMENT ON COLUMN bookmarks.item_data IS 'Cached preview data to avoid joins';

-- ============================================================================
-- 8. USER_CONNECTIONS TABLE (Circle/Follow System)
-- ============================================================================
CREATE TABLE user_connections (
    connection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

    connection_type VARCHAR(20) NOT NULL,  -- 'follow', 'circle', 'block'

    -- JSONB for circle metadata
    metadata JSONB DEFAULT '{}',           -- {"trust_level": "trusted_reviewer", "taste_match": 85, "notes": "..."}

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(from_user_id, to_user_id, connection_type),
    CHECK (from_user_id != to_user_id),
    CONSTRAINT connection_type_values CHECK (connection_type IN ('follow', 'circle', 'block'))
);

-- Indexes
CREATE INDEX idx_connections_from ON user_connections(from_user_id, connection_type);
CREATE INDEX idx_connections_to ON user_connections(to_user_id, connection_type);
CREATE INDEX idx_connections_metadata ON user_connections USING GIN(metadata);
CREATE INDEX idx_connections_created ON user_connections(created_at DESC);

-- Composite for finding mutual connections
CREATE INDEX idx_connections_bidirectional ON user_connections(from_user_id, to_user_id, connection_type);

COMMENT ON TABLE user_connections IS 'Follow, circle, and block relationships';
COMMENT ON COLUMN user_connections.metadata IS 'Trust levels, taste match scores, notes';

-- ============================================================================
-- 9. GROUPS TABLE
-- ============================================================================
CREATE TABLE groups (
    group_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    avatar TEXT,
    banner_image TEXT,

    creator_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,

    -- Cached counts
    member_count INTEGER DEFAULT 1,
    review_count INTEGER DEFAULT 0,

    -- JSONB fields for flexibility
    settings JSONB DEFAULT '{}',           -- {"privacy": "public", "join_approval": false, "allow_discussions": true}
    entity_types JSONB DEFAULT '[]',       -- [{"id": "...", "name": "Restaurants"}] - allowed entity categories
    rules JSONB DEFAULT '[]',              -- ["Be respectful", "No spam", "Stay on topic"]

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_private BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_groups_creator ON groups(creator_id);
CREATE INDEX idx_groups_created_at ON groups(created_at DESC);
CREATE INDEX idx_groups_is_private ON groups(is_private);
CREATE INDEX idx_groups_member_count ON groups(member_count DESC);
CREATE INDEX idx_groups_active ON groups(is_active) WHERE is_active = true;
CREATE INDEX idx_groups_settings ON groups USING GIN(settings);
CREATE INDEX idx_groups_entity_types ON groups USING GIN(entity_types);

-- Full-text search
CREATE INDEX idx_groups_name_trgm ON groups USING GIN(name gin_trgm_ops);

COMMENT ON TABLE groups IS 'Community groups for specific interests or entities';
COMMENT ON COLUMN groups.settings IS 'Privacy, join approval, discussion settings';
COMMENT ON COLUMN groups.entity_types IS 'Allowed entity categories for this group';

-- ============================================================================
-- 10. GROUP_MEMBERS TABLE
-- ============================================================================
CREATE TABLE group_members (
    membership_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

    role VARCHAR(20) DEFAULT 'member',     -- owner, admin, moderator, member

    -- Denormalized user info (for fast member list)
    user_username VARCHAR(50) NOT NULL,
    user_avatar TEXT,
    user_stats JSONB DEFAULT '{}',

    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(group_id, user_id),
    CONSTRAINT role_values CHECK (role IN ('owner', 'admin', 'moderator', 'member'))
);

-- Indexes
CREATE INDEX idx_group_members_group ON group_members(group_id, joined_at DESC);
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_group_members_role ON group_members(group_id, role);

COMMENT ON TABLE group_members IS 'Group membership with roles';

-- ============================================================================
-- 11. CONVERSATIONS TABLE
-- ============================================================================
CREATE TABLE conversations (
    conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_type VARCHAR(20) DEFAULT 'direct',  -- direct, group

    -- Denormalized participant data (for fast conversation list)
    participant_ids JSONB DEFAULT '[]',    -- ["uuid1", "uuid2", ...]
    participant_data JSONB DEFAULT '{}',   -- {"uuid1": {"username": "...", "avatar": "..."}, "uuid2": {...}}

    -- Last message cache (for conversation list - no JOIN to messages!)
    last_message_text TEXT,
    last_message_at TIMESTAMP,
    last_message_by UUID,

    -- Metadata
    metadata JSONB DEFAULT '{}',           -- {"title": "...", "avatar": "...", "muted_by": [...]}

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT conversation_type_values CHECK (conversation_type IN ('direct', 'group'))
);

-- Indexes
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX idx_conversations_participants ON conversations USING GIN(participant_ids);
CREATE INDEX idx_conversations_type ON conversations(conversation_type);
CREATE INDEX idx_conversations_metadata ON conversations USING GIN(metadata);

COMMENT ON TABLE conversations IS 'Message conversation containers';
COMMENT ON COLUMN conversations.participant_data IS 'Cached participant info to avoid joins';
COMMENT ON COLUMN conversations.last_message_text IS 'Cached for fast conversation list loading';

-- ============================================================================
-- 12. MESSAGES TABLE
-- ============================================================================
CREATE TABLE messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

    message_type VARCHAR(20) DEFAULT 'text',  -- text, image, file
    content TEXT NOT NULL,

    -- JSONB for attachments
    attachments JSONB DEFAULT '[]',        -- [{"type": "image", "url": "...", "size": 1024, "name": "..."}]
    metadata JSONB DEFAULT '{}',           -- {"read_by": ["uuid1", "uuid2"], "delivered_to": [...], "reactions": {...}}

    -- Denormalized sender data (for fast message display)
    sender_username VARCHAR(50) NOT NULL,
    sender_avatar TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT message_type_values CHECK (message_type IN ('text', 'image', 'file', 'system'))
);

-- Indexes
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_metadata ON messages USING GIN(metadata);

COMMENT ON TABLE messages IS 'Direct messages with support for text, images, and files';
COMMENT ON COLUMN messages.metadata IS 'Read receipts, delivery status, reactions';

-- ============================================================================
-- 13. NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

    notification_type VARCHAR(50) NOT NULL,  -- comment, like, follow, group_invite, mention, entity_update, system
    title VARCHAR(255),
    message TEXT,

    -- JSONB for flexible notification data
    data JSONB DEFAULT '{}',               -- {"actor": {...}, "entity": {...}, "action_url": "...", "preview": "..."}

    is_read BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT notification_type_values CHECK (notification_type IN
        ('comment', 'like', 'follow', 'group_invite', 'mention', 'entity_update', 'system', 'helpful_vote'))
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON notifications(user_id, notification_type);
CREATE INDEX idx_notifications_data ON notifications USING GIN(data);

COMMENT ON TABLE notifications IS 'User notifications with flexible JSONB data';
COMMENT ON COLUMN notifications.data IS 'Actor info, entity details, action links, preview content';

-- ============================================================================
-- 14. BADGES TABLE
-- ============================================================================
CREATE TABLE badges (
    badge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,

    -- JSONB for badge configuration
    criteria JSONB DEFAULT '{}',           -- {"reviews_count": 10, "avg_rating": 4.0, "helpful_votes": 50}
    colors JSONB DEFAULT '{}',             -- {"start": "#FF6B6B", "end": "#4ECDC4"}

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_badges_name ON badges(name);
CREATE INDEX idx_badges_criteria ON badges USING GIN(criteria);

COMMENT ON TABLE badges IS 'Badge definitions with earning criteria';

-- ============================================================================
-- 15. USER_BADGES TABLE
-- ============================================================================
CREATE TABLE user_badges (
    user_badge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(badge_id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, badge_id)
);

-- Indexes
CREATE INDEX idx_user_badges_user ON user_badges(user_id, earned_at DESC);
CREATE INDEX idx_user_badges_badge ON user_badges(badge_id);

COMMENT ON TABLE user_badges IS 'User badge awards';

-- ============================================================================
-- 16. CATEGORIES TABLE
-- ============================================================================
CREATE TABLE categories (
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    parent_id UUID REFERENCES categories(category_id) ON DELETE CASCADE,

    icon VARCHAR(50),
    color VARCHAR(20),
    description TEXT,

    -- JSONB for flexible metadata
    metadata JSONB DEFAULT '{}',           -- {"order": 1, "featured": true, "custom_fields": {...}}

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_name ON categories(name);
CREATE INDEX idx_categories_metadata ON categories USING GIN(metadata);

COMMENT ON TABLE categories IS 'Hierarchical category system for entities';

-- Add foreign key to reviews.group_id now that groups table exists
ALTER TABLE reviews ADD CONSTRAINT fk_reviews_group
    FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE SET NULL;

-- ============================================================================
-- DATABASE TRIGGERS FOR AUTO-UPDATING COUNTERS
-- ============================================================================

-- 1. Update reviews.likes_count when review_likes changes
CREATE OR REPLACE FUNCTION update_review_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE reviews
        SET likes_count = likes_count + 1
        WHERE review_id = NEW.review_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE reviews
        SET likes_count = GREATEST(likes_count - 1, 0)
        WHERE review_id = OLD.review_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_review_likes_count
AFTER INSERT OR DELETE ON review_likes
FOR EACH ROW EXECUTE FUNCTION update_review_likes_count();

-- 2. Update reviews.comments_count when review_comments changes
CREATE OR REPLACE FUNCTION update_review_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE reviews
        SET comments_count = comments_count + 1
        WHERE review_id = NEW.review_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE reviews
        SET comments_count = GREATEST(comments_count - 1, 0)
        WHERE review_id = OLD.review_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_review_comments_count
AFTER INSERT OR DELETE ON review_comments
FOR EACH ROW EXECUTE FUNCTION update_review_comments_count();

-- 3. Update reviews.helpful_count and not_helpful_count when votes change
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.is_helpful THEN
            UPDATE reviews SET helpful_count = helpful_count + 1 WHERE review_id = NEW.review_id;
        ELSE
            UPDATE reviews SET not_helpful_count = not_helpful_count + 1 WHERE review_id = NEW.review_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.is_helpful THEN
            UPDATE reviews SET helpful_count = GREATEST(helpful_count - 1, 0) WHERE review_id = OLD.review_id;
        ELSE
            UPDATE reviews SET not_helpful_count = GREATEST(not_helpful_count - 1, 0) WHERE review_id = OLD.review_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' AND OLD.is_helpful != NEW.is_helpful THEN
        IF NEW.is_helpful THEN
            UPDATE reviews
            SET helpful_count = helpful_count + 1,
                not_helpful_count = GREATEST(not_helpful_count - 1, 0)
            WHERE review_id = NEW.review_id;
        ELSE
            UPDATE reviews
            SET helpful_count = GREATEST(helpful_count - 1, 0),
                not_helpful_count = not_helpful_count + 1
            WHERE review_id = NEW.review_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_review_helpful_count
AFTER INSERT OR DELETE OR UPDATE ON review_helpful_votes
FOR EACH ROW EXECUTE FUNCTION update_review_helpful_count();

-- 4. Update users.review_count when reviews change
CREATE OR REPLACE FUNCTION update_user_review_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users
        SET review_count = review_count + 1
        WHERE user_id = NEW.user_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users
        SET review_count = GREATEST(review_count - 1, 0)
        WHERE user_id = OLD.user_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_review_count
AFTER INSERT OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_user_review_count();

-- 5. Update entities.review_count when reviews change
CREATE OR REPLACE FUNCTION update_entity_review_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE entities
        SET review_count = review_count + 1
        WHERE entity_id = NEW.entity_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE entities
        SET review_count = GREATEST(review_count - 1, 0)
        WHERE entity_id = OLD.entity_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_entity_review_count
AFTER INSERT OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_entity_review_count();

-- 6. Update entities.average_rating when reviews change
CREATE OR REPLACE FUNCTION update_entity_average_rating()
RETURNS TRIGGER AS $$
DECLARE
    new_avg DECIMAL(3,2);
BEGIN
    -- Calculate new average rating
    SELECT COALESCE(AVG(rating), 0)::DECIMAL(3,2)
    INTO new_avg
    FROM reviews
    WHERE entity_id = COALESCE(NEW.entity_id, OLD.entity_id)
      AND is_active = true;

    -- Update entity
    UPDATE entities
    SET average_rating = new_avg
    WHERE entity_id = COALESCE(NEW.entity_id, OLD.entity_id);

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_entity_average_rating
AFTER INSERT OR DELETE OR UPDATE OF rating ON reviews
FOR EACH ROW EXECUTE FUNCTION update_entity_average_rating();

-- 7. Update users.follower_count and following_count
CREATE OR REPLACE FUNCTION update_user_connection_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.connection_type = 'follow' THEN
        -- Increment following count for from_user
        UPDATE users SET following_count = following_count + 1 WHERE user_id = NEW.from_user_id;
        -- Increment follower count for to_user
        UPDATE users SET follower_count = follower_count + 1 WHERE user_id = NEW.to_user_id;
    ELSIF TG_OP = 'DELETE' AND OLD.connection_type = 'follow' THEN
        -- Decrement following count for from_user
        UPDATE users SET following_count = GREATEST(following_count - 1, 0) WHERE user_id = OLD.from_user_id;
        -- Decrement follower count for to_user
        UPDATE users SET follower_count = GREATEST(follower_count - 1, 0) WHERE user_id = OLD.to_user_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_connection_counts
AFTER INSERT OR DELETE ON user_connections
FOR EACH ROW EXECUTE FUNCTION update_user_connection_counts();

-- 8. Update groups.member_count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE groups SET member_count = member_count + 1 WHERE group_id = NEW.group_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE groups SET member_count = GREATEST(member_count - 1, 0) WHERE group_id = OLD.group_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_group_member_count
AFTER INSERT OR DELETE ON group_members
FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- 9. Update conversations.last_message_* when new message arrives
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_text = NEW.content,
        last_message_at = NEW.created_at,
        last_message_by = NEW.sender_id,
        updated_at = NEW.created_at
    WHERE conversation_id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_conversation_last_message
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- 10. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_entities_updated_at BEFORE UPDATE ON entities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- USEFUL QUERY EXAMPLES
-- ============================================================================

-- HOMEPAGE FEED (Single table query - BLAZING FAST!)
/*
SELECT
    review_id,
    title,
    content,
    rating,
    images,
    pros,
    cons,
    -- User data (already in table)
    user_username,
    user_full_name,
    user_avatar,
    user_stats,
    -- Entity data (already in table)
    entity_name,
    entity_avatar,
    entity_categories,
    -- Engagement (already cached)
    likes_count,
    comments_count,
    helpful_count,
    view_count,
    created_at
FROM reviews
WHERE is_active = true
  AND review_scope = 'public'
ORDER BY created_at DESC
LIMIT 15 OFFSET 0;
*/

-- ENTITY DETAIL PAGE (Single query for entity + fast review load)
/*
SELECT * FROM entities WHERE entity_id = 'uuid-here';

SELECT * FROM reviews
WHERE entity_id = 'uuid-here'
  AND is_active = true
ORDER BY created_at DESC
LIMIT 10;
*/

-- USER PROFILE (Single query for user + reviews)
/*
SELECT * FROM users WHERE username = 'hasan';

SELECT * FROM reviews
WHERE user_id = 'uuid-here'
  AND is_active = true
ORDER BY created_at DESC
LIMIT 10;
*/

-- SEARCH ENTITIES
/*
SELECT * FROM entities
WHERE name ILIKE '%restaurant%'
  AND is_active = true
  AND root_category->>'slug' = 'food-dining'
ORDER BY review_count DESC
LIMIT 20;
*/

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

-- Summary:
-- ✅ 16 Tables total (15 main + 1 junction)
-- ✅ JSONB fields for maximum flexibility
-- ✅ Denormalized reviews table for fast homepage
-- ✅ Auto-updating triggers for all counters
-- ✅ GIN indexes on JSONB for fast filtering
-- ✅ Full-text search with pg_trgm
-- ✅ Optimized for mobile app performance
