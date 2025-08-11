-- Migration: Add top_reactions_json field for ultra-fast reaction loading
-- Used by major platforms like Facebook, Instagram, Twitter for performance optimization

-- Add the new column
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS top_reactions_json JSONB DEFAULT '{}' NOT NULL;

-- Create index for better performance on JSON queries
CREATE INDEX IF NOT EXISTS idx_reviews_top_reactions_json ON reviews USING GIN (top_reactions_json);

-- Populate existing reviews with computed top reactions data
-- This will calculate and store top 3-5 reactions for each review
UPDATE reviews 
SET top_reactions_json = (
    SELECT COALESCE(
        json_object_agg(reaction_type, reaction_count ORDER BY reaction_count DESC),
        '{}'::json
    )
    FROM (
        SELECT 
            CASE 
                WHEN rr.reaction_type::text = 'thumbs_up' THEN 'thumbs_up'
                WHEN rr.reaction_type::text = 'thumbs_down' THEN 'thumbs_down'
                WHEN rr.reaction_type::text = 'love' THEN 'love'
                WHEN rr.reaction_type::text = 'haha' THEN 'haha'
                WHEN rr.reaction_type::text = 'bomb' THEN 'bomb'
                WHEN rr.reaction_type::text = 'celebration' THEN 'celebration'
                WHEN rr.reaction_type::text = 'sad' THEN 'sad'
                WHEN rr.reaction_type::text = 'eyes' THEN 'eyes'
                ELSE rr.reaction_type::text
            END as reaction_type,
            COUNT(*) as reaction_count
        FROM review_reactions rr 
        WHERE rr.review_id = reviews.review_id 
        GROUP BY rr.reaction_type
        ORDER BY reaction_count DESC
        LIMIT 5  -- Store top 5 reactions for flexibility
    ) AS reaction_data
)
WHERE EXISTS (
    SELECT 1 FROM review_reactions rr WHERE rr.review_id = reviews.review_id
);

-- Verify the migration
SELECT 
    review_id,
    title,
    reaction_count,
    top_reactions_json,
    CASE 
        WHEN top_reactions_json = '{}' THEN 'No reactions'
        ELSE 'Has reactions'
    END as status
FROM reviews 
WHERE reaction_count > 0
ORDER BY reaction_count DESC 
LIMIT 10;

COMMIT;