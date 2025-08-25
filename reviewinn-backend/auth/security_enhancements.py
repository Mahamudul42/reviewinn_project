"""
ENTERPRISE SECURITY ENHANCEMENTS
=================================
Additional security features for production authentication system
"""

import re
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Optional, List
from dataclasses import dataclass
import logging
from fastapi import Request, HTTPException, status
import redis.asyncio as redis

logger = logging.getLogger(__name__)

@dataclass
class SecurityConfig:
    """Enhanced security configuration"""
    
    # Password Policy (User Requirements: Min 8 chars, letters + numbers)
    PASSWORD_MIN_LENGTH: int = 8
    PASSWORD_REQUIRE_UPPERCASE: bool = False
    PASSWORD_REQUIRE_LOWERCASE: bool = True  
    PASSWORD_REQUIRE_DIGITS: bool = True
    PASSWORD_REQUIRE_SPECIAL: bool = False
    PASSWORD_MAX_AGE_DAYS: int = 90
    
    # Account Lockout
    MAX_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_DURATION_MINUTES: int = 15
    LOCKOUT_ESCALATION_ENABLED: bool = True
    
    # Session Security
    MAX_CONCURRENT_SESSIONS: int = 3
    SESSION_ABSOLUTE_TIMEOUT_HOURS: int = 8
    SESSION_IDLE_TIMEOUT_MINUTES: int = 30
    
    # CSRF Protection
    CSRF_TOKEN_LENGTH: int = 32
    CSRF_TOKEN_TTL_MINUTES: int = 60
    
    # Rate Limiting (per IP per hour)
    AUTH_RATE_LIMIT_LOGIN: int = 10
    AUTH_RATE_LIMIT_REGISTER: int = 5
    AUTH_RATE_LIMIT_PASSWORD_RESET: int = 3

class PasswordValidator:
    """Enterprise-grade password validation"""
    
    def __init__(self, config: SecurityConfig):
        self.config = config
    
    def validate_password(self, password: str, username: str = None) -> List[str]:
        """
        Validate password against enterprise security policy
        Returns list of validation errors (empty if valid)
        """
        errors = []
        
        # Length check
        if len(password) < self.config.PASSWORD_MIN_LENGTH:
            errors.append(f"Password must be at least {self.config.PASSWORD_MIN_LENGTH} characters long")
        
        # Character requirements (letters + numbers)
        has_letters = re.search(r'[a-zA-Z]', password)
        has_digits = re.search(r'\d', password)
        
        if not has_letters:
            errors.append("Password must contain at least one letter")
            
        if not has_digits:
            errors.append("Password must contain at least one number")
        
        # Username similarity check
        if username and username.lower() in password.lower():
            errors.append("Password cannot contain username")
            
        # Common password patterns
        common_patterns = [
            r'123456', r'password', r'qwerty', r'admin', 
            r'letmein', r'welcome', r'monkey'
        ]
        
        for pattern in common_patterns:
            if re.search(pattern, password, re.IGNORECASE):
                errors.append("Password is too common or predictable")
                break
        
        return errors

class AccountLockoutManager:
    """Manages account lockout and brute force protection"""
    
    def __init__(self, redis_client, config: SecurityConfig):
        self.redis = redis_client
        self.config = config
    
    async def record_failed_attempt(self, identifier: str) -> bool:
        """
        Record failed login attempt
        Returns True if account should be locked
        """
        key = f"failed_attempts:{identifier}"
        
        # Get current attempts
        attempts = await self.redis.get(key)
        attempts = int(attempts or 0) + 1
        
        # Set with expiration
        await self.redis.setex(
            key, 
            self.config.LOCKOUT_DURATION_MINUTES * 60,
            attempts
        )
        
        if attempts >= self.config.MAX_LOGIN_ATTEMPTS:
            await self._lock_account(identifier)
            return True
            
        return False
    
    async def is_account_locked(self, identifier: str) -> bool:
        """Check if account is currently locked"""
        lock_key = f"account_locked:{identifier}"
        return bool(await self.redis.get(lock_key))
    
    async def clear_failed_attempts(self, identifier: str):
        """Clear failed attempts after successful login"""
        key = f"failed_attempts:{identifier}"
        await self.redis.delete(key)
    
    async def _lock_account(self, identifier: str):
        """Lock account due to too many failed attempts"""
        lock_key = f"account_locked:{identifier}"
        await self.redis.setex(
            lock_key,
            self.config.LOCKOUT_DURATION_MINUTES * 60,
            1
        )
        
        logger.warning(f"Account locked due to failed attempts: {identifier}")

class CSRFProtection:
    """CSRF token management for form submissions"""
    
    def __init__(self, redis_client, config: SecurityConfig):
        self.redis = redis_client
        self.config = config
    
    async def generate_token(self, user_id: int) -> str:
        """Generate CSRF token for user session"""
        token = secrets.token_urlsafe(self.config.CSRF_TOKEN_LENGTH)
        key = f"csrf_token:{user_id}:{token}"
        
        await self.redis.setex(
            key,
            self.config.CSRF_TOKEN_TTL_MINUTES * 60,
            1
        )
        
        return token
    
    async def validate_token(self, user_id: int, token: str) -> bool:
        """Validate CSRF token"""
        if not token:
            return False
            
        key = f"csrf_token:{user_id}:{token}"
        exists = await self.redis.get(key)
        
        if exists:
            # Token is valid, delete it (one-time use)
            await self.redis.delete(key)
            return True
            
        return False
    
    async def cleanup_expired_tokens(self, user_id: int):
        """Clean up expired tokens for user"""
        pattern = f"csrf_token:{user_id}:*"
        keys = await self.redis.keys(pattern)
        if keys:
            await self.redis.delete(*keys)

class AuthRateLimiter:
    """Rate limiting specifically for authentication endpoints"""
    
    def __init__(self, redis_client, config: SecurityConfig):
        self.redis = redis_client
        self.config = config
    
    async def check_rate_limit(self, request: Request, endpoint: str) -> bool:
        """
        Check if request exceeds rate limit
        Returns True if allowed, False if rate limited
        """
        client_ip = self._get_client_ip(request)
        key = f"auth_rate_limit:{endpoint}:{client_ip}"
        
        # Get rate limit for this endpoint
        limit = getattr(self.config, f'AUTH_RATE_LIMIT_{endpoint.upper()}', 10)
        
        # Get current count
        current = await self.redis.get(key)
        current = int(current or 0)
        
        if current >= limit:
            logger.warning(f"Rate limit exceeded for {endpoint}: {client_ip}")
            return False
        
        # Increment counter with 1-hour expiration
        pipeline = self.redis.pipeline()
        pipeline.incr(key)
        pipeline.expire(key, 3600)  # 1 hour
        await pipeline.execute()
        
        return True
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP with proxy header support"""
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

class SessionManager:
    """Enhanced session management with security features"""
    
    def __init__(self, redis_client, config: SecurityConfig):
        self.redis = redis_client
        self.config = config
    
    async def create_session(self, user_id: int, request: Request) -> str:
        """Create secure session with metadata"""
        # Check concurrent session limit
        await self._enforce_session_limit(user_id)
        
        session_id = secrets.token_urlsafe(32)
        session_key = f"session:{session_id}"
        
        session_data = {
            "user_id": user_id,
            "created_at": datetime.utcnow().isoformat(),
            "last_activity": datetime.utcnow().isoformat(),
            "client_ip": self._get_client_ip(request),
            "user_agent": request.headers.get("user-agent", "unknown")[:200]
        }
        
        await self.redis.hset(session_key, mapping=session_data)
        await self.redis.expire(session_key, self.config.SESSION_ABSOLUTE_TIMEOUT_HOURS * 3600)
        
        # Track user sessions
        user_sessions_key = f"user_sessions:{user_id}"
        await self.redis.sadd(user_sessions_key, session_id)
        await self.redis.expire(user_sessions_key, self.config.SESSION_ABSOLUTE_TIMEOUT_HOURS * 3600)
        
        return session_id
    
    async def _enforce_session_limit(self, user_id: int):
        """Enforce maximum concurrent sessions"""
        user_sessions_key = f"user_sessions:{user_id}"
        sessions = await self.redis.smembers(user_sessions_key)
        
        if len(sessions) >= self.config.MAX_CONCURRENT_SESSIONS:
            # Remove oldest session
            oldest_session = sessions[0] if sessions else None
            if oldest_session:
                await self._destroy_session(oldest_session)
                await self.redis.srem(user_sessions_key, oldest_session)
    
    async def _destroy_session(self, session_id: str):
        """Destroy session completely"""
        session_key = f"session:{session_id}"
        await self.redis.delete(session_key)
        
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP with proxy header support"""
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"