-- Migration: Add first_name and last_name fields to users and user_profiles tables
-- Date: 2025-01-31

BEGIN;

-- Add first_name and last_name to users table
ALTER TABLE users 
ADD COLUMN first_name VARCHAR(50),
ADD COLUMN last_name VARCHAR(50);

-- Add first_name and last_name to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN first_name VARCHAR(50),
ADD COLUMN last_name VARCHAR(50);

-- Create an index for better search performance
CREATE INDEX idx_users_first_name ON users(first_name);
CREATE INDEX idx_users_last_name ON users(last_name);
CREATE INDEX idx_user_profiles_first_name ON user_profiles(first_name);
CREATE INDEX idx_user_profiles_last_name ON user_profiles(last_name);

-- Optional: Update existing users to split their name into first/last name
-- This is a simple split - you might want to customize this logic
UPDATE users 
SET 
  first_name = CASE 
    WHEN POSITION(' ' IN name) > 0 THEN SUBSTRING(name FROM 1 FOR POSITION(' ' IN name) - 1)
    ELSE name
  END,
  last_name = CASE 
    WHEN POSITION(' ' IN name) > 0 THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
    ELSE NULL
  END
WHERE first_name IS NULL AND last_name IS NULL;

COMMIT;