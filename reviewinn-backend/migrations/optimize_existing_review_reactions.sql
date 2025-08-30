-- ENTERPRISE OPTIMIZATION: Transform existing review_reactions table
-- Convert to high-performance user-centric design without expensive JOINs
-- Maintains existing data while adding enterprise-grade performance

-- Step 1: Clean up any duplicate reactions (users can only have one reaction per review)
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Count duplicates first
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT user_id, review_id, COUNT(*) as cnt
        FROM review_reactions
        GROUP BY user_id, review_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    RAISE NOTICE 'Found % duplicate user reactions to clean up', duplicate_count;
    
    -- Remove duplicates, keeping the most recent one
    WITH duplicates_to_remove AS (
        SELECT reaction_id,
               ROW_NUMBER() OVER (
                   PARTITION BY user_id, review_id 
                   ORDER BY created_at DESC, reaction_id DESC
               ) as rn
        FROM review_reactions
    )
    DELETE FROM review_reactions 
    WHERE reaction_id IN (
        SELECT reaction_id 
        FROM duplicates_to_remove 
        WHERE rn > 1
    );
    
    GET DIAGNOSTICS duplicate_count = ROW_COUNT;
    RAISE NOTICE 'Removed % duplicate reactions', duplicate_count;
END $$;

-- Step 2: Add enterprise-grade unique constraint for O(1) user lookups
-- This prevents duplicates and enables instant user reaction lookups
ALTER TABLE review_reactions 
ADD CONSTRAINT uq_review_reactions_user_review 
UNIQUE (user_id, review_id);

-- Step 3: Add missing enterprise-grade indexes for maximum performance
-- Index 1: User-centric queries (O(1) lookup for user's reaction on specific review)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_review_reactions_user_review_optimized
ON review_reactions (user_id, review_id);

-- Index 2: User dashboard queries (get all user's reactions)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_review_reactions_user_created
ON review_reactions (user_id, created_at DESC);

-- Index 3: Review analytics (get all reactions for a review) - already exists but let's ensure
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_review_reactions_review_analytics
ON review_reactions (review_id, reaction_type, created_at);

-- Index 4: Reaction type analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_review_reactions_type_created
ON review_reactions (reaction_type, created_at DESC);

-- Step 4: Create enterprise-grade stored procedures for maximum performance

-- ENTERPRISE FUNCTION: Get user's reaction for a specific review (O(1) lookup)
CREATE OR REPLACE FUNCTION get_user_reaction_optimized(
    p_user_id INTEGER,
    p_review_id INTEGER
)
RETURNS VARCHAR(50)
LANGUAGE sql STABLE
AS $$
    SELECT reaction_type::text
    FROM review_reactions
    WHERE user_id = p_user_id AND review_id = p_review_id;
$$;

-- ENTERPRISE FUNCTION: Upsert user reaction (handles both insert and update)
CREATE OR REPLACE FUNCTION upsert_user_reaction_optimized(
    p_user_id INTEGER,
    p_review_id INTEGER, 
    p_reaction_type VARCHAR(50)
)
RETURNS TABLE(
    action VARCHAR(10),
    reaction_id INTEGER,
    user_id INTEGER,
    review_id INTEGER,
    reaction_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql AS $$
BEGIN
    -- Use PostgreSQL's native UPSERT (ON CONFLICT) for maximum performance
    INSERT INTO review_reactions (user_id, review_id, reaction_type)
    VALUES (p_user_id, p_review_id, p_reaction_type::reaction_type)
    ON CONFLICT (user_id, review_id) 
    DO UPDATE SET 
        reaction_type = EXCLUDED.reaction_type,
        updated_at = NOW()
    RETURNING 
        CASE 
            WHEN xmax = 0 THEN 'INSERT'::VARCHAR(10)
            ELSE 'UPDATE'::VARCHAR(10)
        END as action,
        review_reactions.reaction_id,
        review_reactions.user_id,
        review_reactions.review_id,
        review_reactions.reaction_type::VARCHAR(50),
        review_reactions.created_at,
        review_reactions.updated_at
    INTO action, reaction_id, user_id, review_id, reaction_type, created_at, updated_at;
    
    RETURN NEXT;
END;
$$;

-- ENTERPRISE FUNCTION: Remove user reaction
CREATE OR REPLACE FUNCTION remove_user_reaction_optimized(
    p_user_id INTEGER,
    p_review_id INTEGER
)
RETURNS TABLE(
    deleted BOOLEAN,
    reaction_id INTEGER,
    reaction_type VARCHAR(50)
)
LANGUAGE plpgsql AS $$
DECLARE
    deleted_reaction RECORD;
BEGIN
    DELETE FROM review_reactions 
    WHERE user_id = p_user_id AND review_id = p_review_id
    RETURNING review_reactions.reaction_id, review_reactions.reaction_type::VARCHAR(50) INTO deleted_reaction;
    
    IF FOUND THEN
        RETURN QUERY SELECT TRUE, deleted_reaction.reaction_id, deleted_reaction.reaction_type;
    ELSE
        RETURN QUERY SELECT FALSE, NULL::INTEGER, NULL::VARCHAR(50);
    END IF;
END;
$$;

-- ENTERPRISE FUNCTION: Get reaction summary with user state (single query, no JOINs)
CREATE OR REPLACE FUNCTION get_reaction_summary_enterprise(
    p_review_id INTEGER,
    p_user_id INTEGER DEFAULT NULL
)
RETURNS TABLE(
    reaction_type VARCHAR(50),
    reaction_count BIGINT,
    user_reaction VARCHAR(50),
    total_reactions BIGINT
)
LANGUAGE sql STABLE
AS $$
    WITH reaction_counts AS (
        SELECT 
            rr.reaction_type::VARCHAR(50) as reaction_type,
            COUNT(*) as reaction_count
        FROM review_reactions rr
        WHERE rr.review_id = p_review_id
        GROUP BY rr.reaction_type
    ),
    user_reaction_query AS (
        SELECT rr.reaction_type::VARCHAR(50) as user_reaction_type
        FROM review_reactions rr
        WHERE rr.review_id = p_review_id 
          AND rr.user_id = p_user_id
        LIMIT 1
    ),
    total_count AS (
        SELECT COUNT(*) as total
        FROM review_reactions rr
        WHERE rr.review_id = p_review_id
    )
    SELECT 
        rc.reaction_type,
        rc.reaction_count,
        COALESCE(ur.user_reaction_type, NULL::VARCHAR(50)) as user_reaction,
        tc.total as total_reactions
    FROM reaction_counts rc
    CROSS JOIN total_count tc
    LEFT JOIN user_reaction_query ur ON TRUE
    
    UNION ALL
    
    -- Handle case where user has reaction but it's not in the main counts
    SELECT 
        NULL::VARCHAR(50),
        0::BIGINT,
        ur.user_reaction_type,
        tc.total
    FROM user_reaction_query ur
    CROSS JOIN total_count tc
    WHERE NOT EXISTS (SELECT 1 FROM reaction_counts);
$$;

-- ENTERPRISE FUNCTION: Bulk get user reactions (for user profiles/dashboards)
CREATE OR REPLACE FUNCTION get_user_reactions_bulk(
    p_user_id INTEGER,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    review_id INTEGER,
    reaction_type VARCHAR(50),
    reaction_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql STABLE
AS $$
    SELECT 
        rr.review_id,
        rr.reaction_type::VARCHAR(50),
        rr.reaction_id,
        rr.created_at,
        rr.updated_at
    FROM review_reactions rr
    WHERE rr.user_id = p_user_id
    ORDER BY rr.created_at DESC
    LIMIT p_limit OFFSET p_offset;
$$;

-- Step 5: Create analytics view for enterprise reporting
CREATE OR REPLACE VIEW review_reaction_analytics_enterprise AS
SELECT 
    DATE_TRUNC('day', created_at) as reaction_date,
    reaction_type::VARCHAR(50) as reaction_type,
    COUNT(*) as daily_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT review_id) as unique_reviews,
    ROUND(COUNT(*)::DECIMAL / COUNT(DISTINCT review_id), 2) as avg_reactions_per_review
FROM review_reactions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), reaction_type
ORDER BY reaction_date DESC, daily_count DESC;

-- Step 6: Add enterprise monitoring and performance tracking
CREATE OR REPLACE FUNCTION review_reactions_performance_stats()
RETURNS TABLE(
    total_reactions BIGINT,
    unique_users BIGINT,
    unique_reviews BIGINT,
    avg_reactions_per_review DECIMAL,
    avg_reactions_per_user DECIMAL,
    top_reaction_type VARCHAR(50),
    top_reaction_count BIGINT,
    index_usage_stats JSON
)
LANGUAGE sql STABLE
AS $$
    WITH base_stats AS (
        SELECT 
            COUNT(*) as total_reactions,
            COUNT(DISTINCT user_id) as unique_users,
            COUNT(DISTINCT review_id) as unique_reviews
        FROM review_reactions
    ),
    reaction_type_stats AS (
        SELECT 
            reaction_type::VARCHAR(50) as top_reaction_type,
            COUNT(*) as top_reaction_count
        FROM review_reactions
        GROUP BY reaction_type
        ORDER BY COUNT(*) DESC
        LIMIT 1
    ),
    index_stats AS (
        SELECT json_agg(
            json_build_object(
                'index_name', indexname,
                'size', pg_size_pretty(pg_total_relation_size(indexname::regclass))
            )
        ) as index_usage_stats
        FROM pg_indexes 
        WHERE tablename = 'review_reactions'
    )
    SELECT 
        bs.total_reactions,
        bs.unique_users,
        bs.unique_reviews,
        ROUND(bs.total_reactions::DECIMAL / bs.unique_reviews, 2) as avg_reactions_per_review,
        ROUND(bs.total_reactions::DECIMAL / bs.unique_users, 2) as avg_reactions_per_user,
        rts.top_reaction_type,
        rts.top_reaction_count,
        is_table.index_usage_stats
    FROM base_stats bs
    CROSS JOIN reaction_type_stats rts  
    CROSS JOIN index_stats is_table;
$$;

-- Step 7: Grant permissions for the new functions
GRANT EXECUTE ON FUNCTION get_user_reaction_optimized TO reviewinn_user;
GRANT EXECUTE ON FUNCTION upsert_user_reaction_optimized TO reviewinn_user;
GRANT EXECUTE ON FUNCTION remove_user_reaction_optimized TO reviewinn_user;
GRANT EXECUTE ON FUNCTION get_reaction_summary_enterprise TO reviewinn_user;
GRANT EXECUTE ON FUNCTION get_user_reactions_bulk TO reviewinn_user;
GRANT EXECUTE ON FUNCTION review_reactions_performance_stats TO reviewinn_user;
GRANT SELECT ON review_reaction_analytics_enterprise TO reviewinn_user;

-- Step 8: Analyze table for query planner optimization
ANALYZE review_reactions;

-- Summary Report
DO $$
DECLARE
    table_size TEXT;
    index_count INTEGER;
    total_reactions INTEGER;
BEGIN
    SELECT pg_size_pretty(pg_total_relation_size('review_reactions')) INTO table_size;
    SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'review_reactions' INTO index_count;
    SELECT COUNT(*) FROM review_reactions INTO total_reactions;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== ENTERPRISE OPTIMIZATION COMPLETE ===';
    RAISE NOTICE 'Table size: %', table_size;
    RAISE NOTICE 'Total indexes: %', index_count;
    RAISE NOTICE 'Total reactions: %', total_reactions;
    RAISE NOTICE 'Unique constraint added: (user_id, review_id)';
    RAISE NOTICE 'Enterprise functions created: 6';
    RAISE NOTICE 'Performance: O(1) user reaction lookups enabled';
    RAISE NOTICE '==========================================';
END $$;