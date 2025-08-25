-- Add unique constraint to prevent duplicate reactions
-- This ensures only one reaction per user per review

-- Check if constraint already exists before adding
DO $$
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_user_review_reaction' 
        AND table_name = 'review_reactions'
    ) THEN
        -- Add unique constraint
        ALTER TABLE review_reactions 
        ADD CONSTRAINT unique_user_review_reaction 
        UNIQUE (user_id, review_id);
        
        RAISE NOTICE 'Added unique constraint to review_reactions table';
    ELSE
        RAISE NOTICE 'Unique constraint already exists on review_reactions table';
    END IF;
END $$;

-- Check if constraint for comment reactions exists and add if needed
DO $$
BEGIN
    -- Check if the constraint already exists for comment reactions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_user_comment_reaction' 
        AND table_name = 'review_comment_reactions'
    ) THEN
        -- Add unique constraint for comment reactions too
        ALTER TABLE review_comment_reactions 
        ADD CONSTRAINT unique_user_comment_reaction 
        UNIQUE (user_id, comment_id);
        
        RAISE NOTICE 'Added unique constraint to review_comment_reactions table';
    ELSE
        RAISE NOTICE 'Unique constraint already exists on review_comment_reactions table';
    END IF;
END $$;
