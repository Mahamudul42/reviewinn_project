-- FIX AUTHENTICATION SCHEMA ISSUES
-- ==================================
-- This migration fixes all identified schema issues from the deep scan

BEGIN;

-- Ensure the core_users table has all required fields
-- Add missing fields that may not exist

-- Add email_verified_at field if it doesn't exist
ALTER TABLE core_users 
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;

-- Ensure consistent field names and types
-- Update field types if needed
ALTER TABLE core_users 
ALTER COLUMN role SET DEFAULT 'user',
ALTER COLUMN permissions SET DEFAULT '[]',
ALTER COLUMN failed_login_attempts SET DEFAULT 0,
ALTER COLUMN active_sessions SET DEFAULT '[]',
ALTER COLUMN trusted_devices SET DEFAULT '[]',
ALTER COLUMN security_events SET DEFAULT '[]',
ALTER COLUMN recovery_codes SET DEFAULT '[]',
ALTER COLUMN two_factor_enabled SET DEFAULT false;

-- Add NOT NULL constraints where appropriate
ALTER TABLE core_users 
ALTER COLUMN role SET NOT NULL,
ALTER COLUMN permissions SET NOT NULL,
ALTER COLUMN failed_login_attempts SET NOT NULL,
ALTER COLUMN two_factor_enabled SET NOT NULL;

-- Create missing indexes for production performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active_verified 
ON core_users(email, is_active, is_verified);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username_active 
ON core_users(username, is_active);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_active 
ON core_users(role, is_active);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_failed_attempts 
ON core_users(failed_login_attempts) 
WHERE failed_login_attempts > 0;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_active 
ON core_users(last_active_at DESC);

-- Ensure email_verification_codes table exists with proper structure
CREATE TABLE IF NOT EXISTS email_verification_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    code_type VARCHAR(30) NOT NULL CHECK (code_type IN ('email_verification', 'password_reset')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    is_used BOOLEAN DEFAULT FALSE
);

-- Create indexes for verification codes
CREATE INDEX IF NOT EXISTS idx_verification_codes_email_type 
ON email_verification_codes(email, code_type, is_used);

CREATE INDEX IF NOT EXISTS idx_verification_codes_expires 
ON email_verification_codes(expires_at);

-- Ensure security_audit_log table exists
CREATE TABLE IF NOT EXISTS security_audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES core_users(user_id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB DEFAULT '{}',
    client_ip INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(64),
    success BOOLEAN DEFAULT TRUE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for security audit log
CREATE INDEX IF NOT EXISTS idx_security_audit_user_event_time 
ON security_audit_log(user_id, event_type, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_event_time 
ON security_audit_log(event_type, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_ip_time 
ON security_audit_log(client_ip, timestamp DESC);

-- Ensure token_blacklist table exists
CREATE TABLE IF NOT EXISTS token_blacklist (
    id SERIAL PRIMARY KEY,
    token_jti VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES core_users(user_id) ON DELETE CASCADE,
    token_type VARCHAR(20) NOT NULL CHECK (token_type IN ('access', 'refresh')),
    blacklisted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes for token blacklist
CREATE INDEX IF NOT EXISTS idx_token_blacklist_jti 
ON token_blacklist(token_jti);

CREATE INDEX IF NOT EXISTS idx_token_blacklist_user_expires 
ON token_blacklist(user_id, expires_at);

-- Ensure user_sessions table exists
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES core_users(user_id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    device_fingerprint VARCHAR(64),
    device_info JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for user sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active 
ON user_sessions(user_id, is_active, expires_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token 
ON user_sessions(session_token) 
WHERE is_active = true;

-- Update existing users to have proper default values
UPDATE core_users 
SET 
    role = 'user' 
WHERE role IS NULL;

UPDATE core_users 
SET 
    permissions = '[]' 
WHERE permissions IS NULL;

UPDATE core_users 
SET 
    failed_login_attempts = 0 
WHERE failed_login_attempts IS NULL;

UPDATE core_users 
SET 
    active_sessions = '[]' 
WHERE active_sessions IS NULL;

UPDATE core_users 
SET 
    trusted_devices = '[]' 
WHERE trusted_devices IS NULL;

UPDATE core_users 
SET 
    security_events = '[]' 
WHERE security_events IS NULL;

UPDATE core_users 
SET 
    recovery_codes = '[]' 
WHERE recovery_codes IS NULL;

UPDATE core_users 
SET 
    two_factor_enabled = false 
WHERE two_factor_enabled IS NULL;

-- Create function to clean up expired data
CREATE OR REPLACE FUNCTION cleanup_auth_expired_data()
RETURNS void AS $$
BEGIN
    -- Clean up expired verification codes
    DELETE FROM email_verification_codes 
    WHERE expires_at < NOW() - INTERVAL '1 hour';
    
    -- Clean up expired tokens
    DELETE FROM token_blacklist 
    WHERE expires_at < NOW();
    
    -- Clean up expired sessions
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() OR (is_active = false AND last_activity < NOW() - INTERVAL '7 days');
    
    -- Clean up old audit logs (keep last 365 days)
    DELETE FROM security_audit_log 
    WHERE timestamp < NOW() - INTERVAL '365 days';
    
    -- Reset failed login attempts for accounts locked more than 24 hours
    UPDATE core_users 
    SET failed_login_attempts = 0 
    WHERE account_locked_until < NOW() - INTERVAL '24 hours';
    
END;
$$ LANGUAGE plpgsql;

-- Create function for secure user lookup
CREATE OR REPLACE FUNCTION find_user_by_identifier(identifier_param TEXT)
RETURNS TABLE (
    user_id INTEGER,
    email VARCHAR(255),
    username VARCHAR(255),
    hashed_password TEXT,
    is_active BOOLEAN,
    is_verified BOOLEAN,
    role VARCHAR(20),
    failed_login_attempts INTEGER,
    account_locked_until TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.user_id,
        u.email,
        u.username,
        u.hashed_password,
        u.is_active,
        u.is_verified,
        u.role,
        u.failed_login_attempts,
        u.account_locked_until,
        u.last_login_at,
        u.created_at
    FROM core_users u
    WHERE LOWER(u.email) = LOWER(identifier_param) 
       OR LOWER(u.username) = LOWER(identifier_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for authentication statistics
CREATE OR REPLACE VIEW auth_statistics AS
SELECT 
    'total_users' as metric,
    COUNT(*)::TEXT as value
FROM core_users
UNION ALL
SELECT 
    'active_users',
    COUNT(*)::TEXT
FROM core_users 
WHERE is_active = true
UNION ALL
SELECT 
    'verified_users',
    COUNT(*)::TEXT
FROM core_users 
WHERE is_verified = true AND is_active = true
UNION ALL
SELECT 
    'locked_accounts',
    COUNT(*)::TEXT
FROM core_users 
WHERE account_locked_until > NOW()
UNION ALL
SELECT 
    'failed_logins_24h',
    COUNT(*)::TEXT
FROM security_audit_log 
WHERE event_type = 'login_failed' 
  AND timestamp >= NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
    'successful_logins_24h',
    COUNT(*)::TEXT
FROM security_audit_log 
WHERE event_type = 'login_success' 
  AND timestamp >= NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
    'active_sessions',
    COUNT(*)::TEXT
FROM user_sessions 
WHERE is_active = true AND expires_at > NOW();

-- Add constraints for data integrity
ALTER TABLE core_users 
ADD CONSTRAINT chk_email_format 
CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE core_users 
ADD CONSTRAINT chk_username_format 
CHECK (username ~ '^[a-z0-9_.-]+$' AND LENGTH(username) >= 3);

ALTER TABLE core_users 
ADD CONSTRAINT chk_failed_attempts_range 
CHECK (failed_login_attempts >= 0 AND failed_login_attempts <= 100);

-- Add comments for documentation
COMMENT ON TABLE core_users IS 'Main user accounts with enhanced security fields';
COMMENT ON TABLE security_audit_log IS 'Comprehensive security audit trail';
COMMENT ON TABLE email_verification_codes IS 'Email verification and password reset codes';
COMMENT ON TABLE token_blacklist IS 'Blacklisted JWT tokens for security';
COMMENT ON TABLE user_sessions IS 'Active user sessions with device tracking';

COMMENT ON COLUMN core_users.role IS 'User role: user, moderator, admin';
COMMENT ON COLUMN core_users.permissions IS 'JSONB array of specific permissions';
COMMENT ON COLUMN core_users.failed_login_attempts IS 'Count of consecutive failed logins';
COMMENT ON COLUMN core_users.account_locked_until IS 'Account lockout expiration';
COMMENT ON COLUMN core_users.email_verified_at IS 'Timestamp when email was verified';
COMMENT ON COLUMN core_users.two_factor_enabled IS 'Whether 2FA is enabled';

COMMIT;

-- Analyze tables for query optimization
ANALYZE core_users;
ANALYZE security_audit_log;
ANALYZE email_verification_codes;
ANALYZE token_blacklist;
ANALYZE user_sessions;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Authentication schema fix migration completed successfully!';
    RAISE NOTICE 'All required tables and fields are now properly configured.';
    RAISE NOTICE 'Indexes have been created for optimal performance.';
    RAISE NOTICE 'Data integrity constraints have been added.';
    RAISE NOTICE 'Security functions and views are available.';
END $$;