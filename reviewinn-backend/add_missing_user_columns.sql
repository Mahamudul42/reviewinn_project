-- Add missing columns to core_users table for auth-production system

-- Enhanced security fields
ALTER TABLE core_users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
ALTER TABLE core_users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]';
ALTER TABLE core_users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE core_users ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE core_users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE;

-- Email verification fields  
ALTER TABLE core_users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);
ALTER TABLE core_users ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP WITH TIME ZONE;
ALTER TABLE core_users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;

-- Password reset fields
ALTER TABLE core_users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);  
ALTER TABLE core_users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITH TIME ZONE;

-- Device and session tracking
ALTER TABLE core_users ADD COLUMN IF NOT EXISTS active_sessions JSONB DEFAULT '[]';
ALTER TABLE core_users ADD COLUMN IF NOT EXISTS trusted_devices JSONB DEFAULT '[]'; 
ALTER TABLE core_users ADD COLUMN IF NOT EXISTS security_events JSONB DEFAULT '[]';

-- Two-factor authentication
ALTER TABLE core_users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE core_users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);
ALTER TABLE core_users ADD COLUMN IF NOT EXISTS recovery_codes JSONB DEFAULT '[]';

-- Update role enum constraint if needed
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN
        CREATE TYPE userrole AS ENUM ('user', 'moderator', 'admin');
        ALTER TABLE core_users ALTER COLUMN role TYPE userrole USING role::userrole;
    END IF;
END $$;