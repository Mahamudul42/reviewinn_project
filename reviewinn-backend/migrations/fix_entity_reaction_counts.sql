-- Fix Entity Reaction Counts Migration
-- This script updates the core_entities.reaction_count field to match the sum of all reaction counts from reviews for each entity

-- Update entity reaction counts based on sum of review reaction counts
UPDATE core_entities 
SET reaction_count = COALESCE(review_totals.total_reactions, 0)
FROM (
    SELECT 
        entity_id,
        SUM(reaction_count) as total_reactions
    FROM review_main 
    WHERE entity_id IS NOT NULL
    GROUP BY entity_id
) AS review_totals
WHERE core_entities.entity_id = review_totals.entity_id;

-- Reset reaction_count to 0 for entities with no reviews
UPDATE core_entities 
SET reaction_count = 0
WHERE entity_id NOT IN (
    SELECT DISTINCT entity_id 
    FROM review_main 
    WHERE entity_id IS NOT NULL
) AND reaction_count != 0;

-- Display the results for verification
SELECT 
    ce.entity_id,
    ce.name,
    ce.reaction_count as entity_reaction_count,
    COALESCE(SUM(rm.reaction_count), 0) as calculated_reaction_count
FROM core_entities ce
LEFT JOIN review_main rm ON ce.entity_id = rm.entity_id
GROUP BY ce.entity_id, ce.name, ce.reaction_count
ORDER BY calculated_reaction_count DESC
LIMIT 10;