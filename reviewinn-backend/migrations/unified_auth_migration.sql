-- UNIFIED AUTHENTICATION SYSTEM MIGRATION
-- =========================================
-- This migration adds necessary fields to support the unified auth system
-- while maintaining backward compatibility with existing data

BEGIN;

-- Add new auth-related columns to core_users table
ALTER TABLE core_users 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS active_sessions JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS trusted_devices JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS security_events JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255),
ADD COLUMN IF NOT EXISTS recovery_codes JSONB DEFAULT '[]';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON core_users(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON core_users(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_users_role ON core_users(role);
CREATE INDEX IF NOT EXISTS idx_users_failed_login_attempts ON core_users(failed_login_attempts);
CREATE INDEX IF NOT EXISTS idx_users_account_locked_until ON core_users(account_locked_until);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON core_users(last_login);

-- Create security audit log table
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

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_timestamp ON security_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_client_ip ON security_audit_log(client_ip);

-- Create token blacklist table
CREATE TABLE IF NOT EXISTS token_blacklist (
    id SERIAL PRIMARY KEY,
    token_jti VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES core_users(user_id) ON DELETE CASCADE,
    token_type VARCHAR(20) NOT NULL CHECK (token_type IN ('access', 'refresh')),
    blacklisted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes for token blacklist
CREATE INDEX IF NOT EXISTS idx_token_blacklist_jti ON token_blacklist(token_jti);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_user_id ON token_blacklist(user_id);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at ON token_blacklist(expires_at);

-- Create email verification codes table (for 6-digit codes)
CREATE TABLE IF NOT EXISTS email_verification_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    code_type VARCHAR(20) NOT NULL CHECK (code_type IN ('email_verification', 'password_reset')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    is_used BOOLEAN DEFAULT FALSE
);

-- Create indexes for verification codes
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email ON email_verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_code ON email_verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_expires_at ON email_verification_codes(expires_at);

-- Create user sessions table for session management
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
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

-- Create rate limiting table (if not using Redis)
CREATE TABLE IF NOT EXISTS rate_limits (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL,
    count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes for rate limiting
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at ON rate_limits(expires_at);

-- Update existing users with default values
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

-- Copy last_login_at to last_login for backward compatibility
UPDATE core_users 
SET 
    last_login = last_login_at 
WHERE last_login IS NULL AND last_login_at IS NOT NULL;

-- Create function to clean up expired tokens and codes
CREATE OR REPLACE FUNCTION cleanup_expired_auth_data()
RETURNS void AS $$
BEGIN
    -- Clean up expired tokens
    DELETE FROM token_blacklist WHERE expires_at < NOW();
    
    -- Clean up expired verification codes
    DELETE FROM email_verification_codes WHERE expires_at < NOW();
    
    -- Clean up old rate limiting entries
    DELETE FROM rate_limits WHERE expires_at < NOW();
    
    -- Clean up expired sessions
    DELETE FROM user_sessions WHERE expires_at < NOW();
    
    -- Clean up old security audit logs (keep last 90 days)
    DELETE FROM security_audit_log WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically update last_activity
CREATE OR REPLACE FUNCTION update_user_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_active_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic last_activity update
CREATE TRIGGER trigger_update_user_last_activity
    BEFORE UPDATE ON core_users
    FOR EACH ROW
    EXECUTE FUNCTION update_user_last_activity();

-- Create stored procedure for secure password reset
CREATE OR REPLACE FUNCTION secure_password_reset(
    p_email VARCHAR(255),
    p_reset_code VARCHAR(6),
    p_new_password_hash TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_id INTEGER;
    v_code_valid BOOLEAN := FALSE;
BEGIN
    -- Check if code is valid
    SELECT 
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM email_verification_codes 
                WHERE email = p_email 
                AND code = p_reset_code 
                AND code_type = 'password_reset'
                AND NOT is_used 
                AND expires_at > NOW()
                AND attempts < max_attempts
            ) THEN TRUE
            ELSE FALSE
        END INTO v_code_valid;
    
    IF NOT v_code_valid THEN
        -- Increment attempts
        UPDATE email_verification_codes 
        SET attempts = attempts + 1 
        WHERE email = p_email AND code = p_reset_code AND code_type = 'password_reset';
        
        RETURN FALSE;
    END IF;
    
    -- Get user ID
    SELECT user_id INTO v_user_id FROM core_users WHERE email = p_email;
    
    IF v_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Update password
    UPDATE core_users 
    SET 
        hashed_password = p_new_password_hash,
        password_changed_at = NOW(),
        failed_login_attempts = 0,
        account_locked_until = NULL
    WHERE user_id = v_user_id;
    
    -- Mark code as used
    UPDATE email_verification_codes 
    SET 
        is_used = TRUE,
        used_at = NOW()
    WHERE email = p_email AND code = p_reset_code AND code_type = 'password_reset';
    
    -- Log security event
    INSERT INTO security_audit_log (user_id, event_type, event_data)
    VALUES (v_user_id, 'password_reset', json_build_object('method', 'email_code'));
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create stored procedure for email verification
CREATE OR REPLACE FUNCTION verify_email_with_code(
    p_email VARCHAR(255),
    p_verification_code VARCHAR(6)
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_id INTEGER;
    v_code_valid BOOLEAN := FALSE;
BEGIN
    -- Check if code is valid
    SELECT 
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM email_verification_codes 
                WHERE email = p_email 
                AND code = p_verification_code 
                AND code_type = 'email_verification'
                AND NOT is_used 
                AND expires_at > NOW()
                AND attempts < max_attempts
            ) THEN TRUE
            ELSE FALSE
        END INTO v_code_valid;
    
    IF NOT v_code_valid THEN
        -- Increment attempts
        UPDATE email_verification_codes 
        SET attempts = attempts + 1 
        WHERE email = p_email AND code = p_verification_code AND code_type = 'email_verification';
        
        RETURN FALSE;
    END IF;
    
    -- Get user ID
    SELECT user_id INTO v_user_id FROM core_users WHERE email = p_email;
    
    IF v_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Verify email
    UPDATE core_users 
    SET 
        is_verified = TRUE,
        email_verification_token = NULL,
        email_verification_expires = NULL
    WHERE user_id = v_user_id;
    
    -- Mark code as used
    UPDATE email_verification_codes 
    SET 
        is_used = TRUE,
        used_at = NOW()
    WHERE email = p_email AND code = p_verification_code AND code_type = 'email_verification';
    
    -- Log security event
    INSERT INTO security_audit_log (user_id, event_type, event_data)
    VALUES (v_user_id, 'email_verified', json_build_object('verification_method', 'code'));
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add constraints for data integrity
ALTER TABLE core_users 
ADD CONSTRAINT chk_failed_login_attempts 
CHECK (failed_login_attempts >= 0 AND failed_login_attempts <= 100);

ALTER TABLE core_users 
ADD CONSTRAINT chk_account_lock_future 
CHECK (account_locked_until IS NULL OR account_locked_until > NOW());

-- Create view for active users
CREATE OR REPLACE VIEW active_users AS
SELECT 
    user_id,
    email,
    username,
    first_name,
    last_name,
    display_name,
    is_verified,
    is_active,
    role,
    created_at,
    last_login,
    last_active_at
FROM core_users 
WHERE is_active = TRUE 
AND (account_locked_until IS NULL OR account_locked_until <= NOW());

-- Create view for security dashboard
CREATE OR REPLACE VIEW security_summary AS
SELECT 
    (SELECT COUNT(*) FROM core_users WHERE is_active = TRUE) as active_users,
    (SELECT COUNT(*) FROM core_users WHERE is_verified = FALSE) as unverified_users,
    (SELECT COUNT(*) FROM core_users WHERE failed_login_attempts >= 3) as users_with_failed_attempts,
    (SELECT COUNT(*) FROM core_users WHERE account_locked_until > NOW()) as locked_accounts,
    (SELECT COUNT(*) FROM security_audit_log WHERE timestamp > NOW() - INTERVAL '24 hours') as security_events_24h,
    (SELECT COUNT(*) FROM user_sessions WHERE is_active = TRUE) as active_sessions;

COMMIT;

-- Add comments for documentation
COMMENT ON TABLE security_audit_log IS 'Comprehensive audit log for all security-related events';
COMMENT ON TABLE token_blacklist IS 'Blacklisted JWT tokens for enhanced security';
COMMENT ON TABLE email_verification_codes IS '6-digit verification codes for email and password reset';
COMMENT ON TABLE user_sessions IS 'Active user sessions with device tracking';
COMMENT ON TABLE rate_limits IS 'Rate limiting data (use Redis in production)';

COMMENT ON COLUMN core_users.role IS 'User role: user, moderator, or admin';
COMMENT ON COLUMN core_users.permissions IS 'JSON array of specific user permissions';
COMMENT ON COLUMN core_users.failed_login_attempts IS 'Count of consecutive failed login attempts';
COMMENT ON COLUMN core_users.account_locked_until IS 'Account lockout expiration timestamp';
COMMENT ON COLUMN core_users.active_sessions IS 'JSON array of active session tokens';
COMMENT ON COLUMN core_users.trusted_devices IS 'JSON array of trusted device fingerprints';
COMMENT ON COLUMN core_users.security_events IS 'JSON array of recent security events';

-- Create indexes for optimal query performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_verified ON core_users(is_active, is_verified);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_active ON core_users(role, is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_user_event ON security_audit_log(user_id, event_type);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Unified authentication system migration completed successfully!';
    RAISE NOTICE 'New features available:';
    RAISE NOTICE '- Enhanced security with role-based access control';
    RAISE NOTICE '- Comprehensive audit logging';
    RAISE NOTICE '- Token blacklisting and session management';
    RAISE NOTICE '- 6-digit email verification codes';
    RAISE NOTICE '- Advanced rate limiting';
    RAISE NOTICE '- Two-factor authentication support';
END $$;