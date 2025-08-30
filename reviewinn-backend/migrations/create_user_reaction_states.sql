-- ENTERPRISE MIGRATION: User-Specific Reaction State Table
-- This eliminates expensive JOINs by denormalizing user reaction data
-- Designed for 10M+ users with sub-millisecond query performance

-- Create the user_reaction_states table for O(1) lookups
CREATE TABLE IF NOT EXISTS user_reaction_states (
    -- Primary composite key for instant lookups
    user_id INTEGER NOT NULL,
    review_id INTEGER NOT NULL,
    
    -- Reaction data (denormalized for performance)
    reaction_type VARCHAR(50) NOT NULL,
    
    -- Metadata for enterprise features
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Enterprise audit fields
    session_id VARCHAR(255),
    client_ip INET,
    user_agent TEXT,
    
    -- Performance optimization: Single primary key lookup
    PRIMARY KEY (user_id, review_id)
);

-- ENTERPRISE INDEXING STRATEGY for maximum performance
-- Index 1: User-centric queries (get all reactions for a user)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_reaction_states_user_id 
ON user_reaction_states (user_id);

-- Index 2: Review-centric queries (get all user reactions for a review) 
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_reaction_states_review_id
ON user_reaction_states (review_id);

-- Index 3: Reaction type analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_reaction_states_reaction_type
ON user_reaction_states (reaction_type);

-- Index 4: Time-based queries for analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_reaction_states_created_at
ON user_reaction_states (created_at);

-- Index 5: Composite index for dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_reaction_states_user_created
ON user_reaction_states (user_id, created_at DESC);

-- ENTERPRISE CONSTRAINT: Ensure referential integrity
ALTER TABLE user_reaction_states
ADD CONSTRAINT fk_user_reaction_states_user_id
FOREIGN KEY (user_id) REFERENCES core_users(user_id) ON DELETE CASCADE;

ALTER TABLE user_reaction_states  
ADD CONSTRAINT fk_user_reaction_states_review_id
FOREIGN KEY (review_id) REFERENCES review_main(review_id) ON DELETE CASCADE;

-- ENTERPRISE TRIGGER: Auto-update timestamp
CREATE OR REPLACE FUNCTION update_user_reaction_states_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_reaction_states_updated_at
    BEFORE UPDATE ON user_reaction_states
    FOR EACH ROW EXECUTE FUNCTION update_user_reaction_states_updated_at();

-- ENTERPRISE FUNCTION: Upsert user reaction (INSERT or UPDATE)
CREATE OR REPLACE FUNCTION upsert_user_reaction(
    p_user_id INTEGER,
    p_review_id INTEGER, 
    p_reaction_type VARCHAR(50),
    p_session_id VARCHAR(255) DEFAULT NULL,
    p_client_ip INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE(
    action VARCHAR(10),
    user_id INTEGER,
    review_id INTEGER,
    reaction_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql AS $$
BEGIN
    -- Try to update existing record first (most common case)
    UPDATE user_reaction_states 
    SET 
        reaction_type = p_reaction_type,
        updated_at = NOW(),
        session_id = COALESCE(p_session_id, session_id),
        client_ip = COALESCE(p_client_ip, client_ip),
        user_agent = COALESCE(p_user_agent, user_agent)
    WHERE user_reaction_states.user_id = p_user_id 
      AND user_reaction_states.review_id = p_review_id;
    
    -- If record was updated, return it
    IF FOUND THEN
        RETURN QUERY
        SELECT 
            'UPDATE'::VARCHAR(10) as action,
            urs.user_id,
            urs.review_id,
            urs.reaction_type,
            urs.created_at,
            urs.updated_at
        FROM user_reaction_states urs
        WHERE urs.user_id = p_user_id AND urs.review_id = p_review_id;
        RETURN;
    END IF;
    
    -- Otherwise, insert new record
    INSERT INTO user_reaction_states (
        user_id,
        review_id,
        reaction_type,
        session_id,
        client_ip,
        user_agent
    ) VALUES (
        p_user_id,
        p_review_id,
        p_reaction_type,
        p_session_id,
        p_client_ip,
        p_user_agent
    );
    
    -- Return the inserted record
    RETURN QUERY
    SELECT 
        'INSERT'::VARCHAR(10) as action,
        urs.user_id,
        urs.review_id,
        urs.reaction_type,
        urs.created_at,
        urs.updated_at
    FROM user_reaction_states urs
    WHERE urs.user_id = p_user_id AND urs.review_id = p_review_id;
END;
$$;

-- ENTERPRISE FUNCTION: Remove user reaction
CREATE OR REPLACE FUNCTION remove_user_reaction(
    p_user_id INTEGER,
    p_review_id INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM user_reaction_states 
    WHERE user_id = p_user_id AND review_id = p_review_id;
    
    RETURN FOUND;
END;
$$;

-- ENTERPRISE FUNCTION: Get user reaction for review (O(1) lookup)
CREATE OR REPLACE FUNCTION get_user_reaction(
    p_user_id INTEGER,
    p_review_id INTEGER
)
RETURNS VARCHAR(50)
LANGUAGE plpgsql AS $$
DECLARE
    reaction VARCHAR(50);
BEGIN
    SELECT reaction_type INTO reaction
    FROM user_reaction_states
    WHERE user_id = p_user_id AND review_id = p_review_id;
    
    RETURN reaction;
END;
$$;

-- ENTERPRISE FUNCTION: Get reaction counts for review (single table scan)
CREATE OR REPLACE FUNCTION get_reaction_counts_optimized(
    p_review_id INTEGER
)
RETURNS TABLE(
    reaction_type VARCHAR(50),
    reaction_count BIGINT
)
LANGUAGE sql AS $$
    SELECT 
        urs.reaction_type,
        COUNT(*) as reaction_count
    FROM user_reaction_states urs
    WHERE urs.review_id = p_review_id
    GROUP BY urs.reaction_type
    ORDER BY reaction_count DESC;
$$;

-- ENTERPRISE FUNCTION: Get user's reactions with counts (dashboard view)
CREATE OR REPLACE FUNCTION get_user_reactions_with_counts(
    p_user_id INTEGER,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    review_id INTEGER,
    reaction_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE,
    total_reactions_on_review BIGINT
)
LANGUAGE sql AS $$
    SELECT 
        urs.review_id,
        urs.reaction_type,
        urs.created_at,
        (SELECT COUNT(*) FROM user_reaction_states urs2 WHERE urs2.review_id = urs.review_id) as total_reactions_on_review
    FROM user_reaction_states urs
    WHERE urs.user_id = p_user_id
    ORDER BY urs.created_at DESC
    LIMIT p_limit OFFSET p_offset;
$$;

-- Create a view for analytics (optional, for reporting)
CREATE OR REPLACE VIEW user_reaction_analytics AS
SELECT 
    DATE_TRUNC('day', created_at) as reaction_date,
    reaction_type,
    COUNT(*) as daily_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT review_id) as unique_reviews
FROM user_reaction_states
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), reaction_type
ORDER BY reaction_date DESC, daily_count DESC;

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_reaction_states TO reviewinn_user;
GRANT EXECUTE ON FUNCTION upsert_user_reaction TO reviewinn_user;
GRANT EXECUTE ON FUNCTION remove_user_reaction TO reviewinn_user;
GRANT EXECUTE ON FUNCTION get_user_reaction TO reviewinn_user;
GRANT EXECUTE ON FUNCTION get_reaction_counts_optimized TO reviewinn_user;
GRANT EXECUTE ON FUNCTION get_user_reactions_with_counts TO reviewinn_user;
GRANT SELECT ON user_reaction_analytics TO reviewinn_user;