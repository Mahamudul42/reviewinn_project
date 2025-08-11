-- Migration: Add images column to reviews table
-- Date: 2025-01-07
-- Description: Add support for up to 5 images per review

-- Add images column to reviews table (JSON type to store array of image URLs)
ALTER TABLE reviews ADD COLUMN images JSON DEFAULT '[]';

-- Update existing reviews to have empty images array
UPDATE reviews SET images = '[]' WHERE images IS NULL;

-- Add index for better performance when querying reviews with images
CREATE INDEX idx_reviews_has_images ON reviews ((CASE WHEN JSON_LENGTH(images) > 0 THEN 1 ELSE 0 END));

-- Update any existing stored procedures or views if needed
-- (Add any additional migration code here as needed)