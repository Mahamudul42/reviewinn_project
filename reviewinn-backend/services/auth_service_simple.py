"""
Simplified Modern Authentication Service
Optimized for frontend integration and production use
"""
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import jwt
from email_validator import validate_email, EmailNotValidError
from fastapi import HTTPException, status
import logging

from models.user import User, UserRole
from schemas.auth import RegisterRequest
from core.config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class AuthService:
    """
    Simplified Authentication Service optimized for frontend integration
    """
    
    # Token configurations
    ACCESS_TOKEN_EXPIRE_MINUTES = 60  # Extended for better UX
    REFRESH_TOKEN_EXPIRE_DAYS = 30   # Month-long sessions for persistent login
    RESET_TOKEN_EXPIRE_MINUTES = 60  # Password reset tokens
    
    # Enhanced rate limiting configurations
    MAX_LOGIN_ATTEMPTS = 5
    LOCKOUT_DURATION_MINUTES = 15
    MAX_REGISTRATION_ATTEMPTS = 3
    REGISTRATION_COOLDOWN_MINUTES = 30
    
    def __init__(self):
        self.pwd_context = CryptContext(
            schemes=["bcrypt"], 
            deprecated="auto",
            bcrypt__rounds=12
        )
        
        # JWT configuration
        self.secret_key = settings.security.secret_key
        self.algorithm = "HS256"
        
        # In-memory rate limiting for simplicity (use Redis in production)
        self.failed_attempts = {}
    
    # ==================== PASSWORD MANAGEMENT ====================
    
    def hash_password(self, password: str) -> str:
        """Hash password with bcrypt"""
        return self.pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return self.pwd_context.verify(plain_password, hashed_password)
    
    def validate_password_strength(self, password: str, user_data: dict = None) -> bool:
        """
        Industry-standard password validation aligned with frontend requirements
        """
        errors = []
        
        # Length requirements (8-128 characters for balance of security and usability)
        if len(password) < 8:
            errors.append("Password must be at least 8 characters long")
        if len(password) > 128:
            errors.append("Password cannot exceed 128 characters")
        
        # Character complexity requirements
        has_upper = any(c.isupper() for c in password)
        has_lower = any(c.islower() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_special = any(c in "!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?`~" for c in password)
        
        if not has_upper:
            errors.append("Password must contain at least one uppercase letter")
        if not has_lower:
            errors.append("Password must contain at least one lowercase letter")
        if not has_digit:
            errors.append("Password must contain at least one digit")
        if not has_special:
            errors.append("Password must contain at least one special character")
        
        # Enhanced weak password database
        weak_passwords = {
            'password', '123456', 'password123', 'admin', 'welcome', 'login',
            'qwerty', 'letmein', 'monkey', 'dragon', 'master', '12345678',
            'password1', 'welcome123', 'admin123', 'user', 'test', 'guest',
            '1234567890', 'abcdefgh', 'qwertyui', 'asdfghjk', 'zxcvbnm',
            'iloveyou', 'princess', 'rockyou', 'sunshine', 'football'
        }
        
        if password.lower() in weak_passwords:
            errors.append("Password is too common and easily guessable")
        
        # Check for user data in password (if provided)
        if user_data:
            user_strings = [
                (user_data.get('email') or '').split('@')[0].lower(),
                (user_data.get('username') or '').lower(),
                (user_data.get('first_name') or '').lower(),
                (user_data.get('last_name') or '').lower()
            ]
            
            for user_str in user_strings:
                if user_str and len(user_str) > 2 and user_str in password.lower():
                    errors.append("Password must not contain personal information")
                    break
        
        # Enhanced sequential pattern detection
        sequences = [
            # Numeric sequences
            "012", "123", "234", "345", "456", "567", "678", "789", "890",
            # Alphabetic sequences 
            "abc", "bcd", "cde", "def", "efg", "fgh", "ghi", "hij", "ijk",
            "jkl", "klm", "lmn", "mno", "nop", "opq", "pqr", "qrs", "rst",
            "stu", "tuv", "uvw", "vwx", "wxy", "xyz",
            # Keyboard sequences
            "qwe", "wer", "ert", "rty", "tyu", "yui", "uio", "iop",
            "asd", "sdf", "dfg", "fgh", "ghj", "hjk", "jkl",
            "zxc", "xcv", "cvb", "vbn", "bnm"
        ]
        
        for seq in sequences:
            if seq in password.lower():
                errors.append("Password must not contain sequential patterns")
                break
        
        # Check for repeated characters (more than 3 consecutive)
        for i in range(len(password) - 3):
            if password[i] == password[i+1] == password[i+2] == password[i+3]:
                errors.append("Password must not contain more than 3 consecutive identical characters")
                break
        
        if errors:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "Password does not meet security requirements",
                    "errors": errors,
                    "requirements": [
                        "At least 8 characters long",
                        "No more than 128 characters",
                        "Contains uppercase and lowercase letters",
                        "Contains at least one digit", 
                        "Contains at least one special character",
                        "Does not contain personal information",
                        "Is not a common weak password",
                        "Does not contain sequential patterns"
                    ]
                }
            )
        
        return True
    
    # ==================== TOKEN MANAGEMENT ====================
    
    def create_access_token(self, data: dict, request=None) -> str:
        """Create enhanced JWT access token with security improvements"""
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(minutes=self.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        # Enhanced token payload with security claims
        to_encode.update({
            "exp": expire,
            "iat": datetime.now(timezone.utc),
            "iss": "reviewinn-api",           # Issuer
            "aud": "reviewinn-frontend",      # Audience  
            "type": "access",
            "jti": secrets.token_urlsafe(16),  # JWT ID for revocation
        })
        
        # Add client context if available
        if request:
            # Simple device fingerprinting
            user_agent = getattr(request, 'headers', {}).get('user-agent', '')
            accept_lang = getattr(request, 'headers', {}).get('accept-language', '')
            
            # Create simple fingerprint
            fingerprint_data = f"{user_agent[:50]}{accept_lang[:20]}"
            device_hash = hashlib.sha256(fingerprint_data.encode()).hexdigest()[:16]
            to_encode["device_fp"] = device_hash
        
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
    
    def create_refresh_token(self, data: dict, request=None) -> str:
        """Create enhanced JWT refresh token with session tracking"""
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(days=self.REFRESH_TOKEN_EXPIRE_DAYS)
        
        to_encode.update({
            "exp": expire,
            "iat": datetime.now(timezone.utc),
            "iss": "reviewinn-api",
            "aud": "reviewinn-frontend", 
            "type": "refresh",
            "jti": secrets.token_urlsafe(16)
        })
        
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
    
    def verify_token(self, token: str, expected_type: str = "access", request=None) -> dict:
        """Enhanced token verification with additional security checks"""
        try:
            payload = jwt.decode(
                token, 
                self.secret_key, 
                algorithms=[self.algorithm],
                audience="reviewinn-frontend",  # Verify audience
                issuer="reviewinn-api"          # Verify issuer
            )
            
            if payload.get("type") != expected_type:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type"
                )
            
            # Additional security checks for access tokens
            if expected_type == "access" and request:
                # Check device fingerprint if available
                token_fp = payload.get("device_fp")
                if token_fp:
                    user_agent = getattr(request, 'headers', {}).get('user-agent', '')
                    accept_lang = getattr(request, 'headers', {}).get('accept-language', '')
                    fingerprint_data = f"{user_agent[:50]}{accept_lang[:20]}"
                    current_fp = hashlib.sha256(fingerprint_data.encode()).hexdigest()[:16]
                    
                    if current_fp != token_fp:
                        logger.warning(f"Device fingerprint mismatch: {current_fp} vs {token_fp}")
                        # In production, you might want to force re-authentication
                        # For now, just log the warning
            
            return payload
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
    
    # ==================== SIMPLE RATE LIMITING ====================
    
    def check_rate_limit(self, identifier: str, action: str = "login") -> bool:
        """Simple in-memory rate limiting"""
        now = datetime.now(timezone.utc)
        
        # Use a compound key with action for different rate limits
        key = f"{action}:{identifier}"
        
        if key in self.failed_attempts:
            attempts, last_attempt = self.failed_attempts[key]
            
            # Reset if lockout period passed
            if now - last_attempt > timedelta(minutes=self.LOCKOUT_DURATION_MINUTES):
                del self.failed_attempts[key]
                return True
            
            return attempts < self.MAX_LOGIN_ATTEMPTS
        
        return True
    
    def record_failed_attempt(self, identifier: str, action: str = "login"):
        """Record failed authentication attempt"""
        now = datetime.now(timezone.utc)
        
        # Use a compound key with action for different rate limits
        key = f"{action}:{identifier}"
        
        if key in self.failed_attempts:
            attempts, _ = self.failed_attempts[key]
            self.failed_attempts[key] = (attempts + 1, now)
        else:
            self.failed_attempts[key] = (1, now)
    
    def clear_failed_attempts(self, identifier: str, action: str = "login"):
        """Clear failed attempts after successful auth"""
        key = f"{action}:{identifier}"
        if key in self.failed_attempts:
            del self.failed_attempts[key]
    
    # ==================== USER AUTHENTICATION ====================
    
    async def authenticate_user(self, email_or_username: str, password: str, db: Session) -> User:
        """Authenticate user with rate limiting"""
        # Check rate limiting
        if not self.check_rate_limit(email_or_username):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many failed attempts. Try again in {self.LOCKOUT_DURATION_MINUTES} minutes"
            )
        
        # Find user
        user = db.query(User).filter(
            (User.email == email_or_username) | (User.username == email_or_username)
        ).first()
        
        if not user or not self.verify_password(password, user.hashed_password):
            self.record_failed_attempt(email_or_username)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email/username or password"
            )
        
        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is disabled"
            )
        
        # Clear failed attempts on successful auth
        self.clear_failed_attempts(email_or_username)
        
        return user
    
    def validate_name(self, name: str, field_name: str) -> bool:
        """Validate name fields with industry standards"""
        errors = []
        
        if not name or not name.strip():
            errors.append(f"{field_name} is required")
        else:
            name = name.strip()
            
            # Length validation
            if len(name) < 2:
                errors.append(f"{field_name} must be at least 2 characters long")
            if len(name) > 50:
                errors.append(f"{field_name} cannot exceed 50 characters")
            
            # Character validation (allow letters, spaces, hyphens, apostrophes, and basic accented characters)
            if not all(c.isalpha() or c in " '-" or ord(c) > 127 for c in name):
                errors.append(f"{field_name} can only contain letters, spaces, hyphens, and apostrophes")
            
            # Check for suspicious patterns
            if name.lower() in ['admin', 'test', 'user', 'null', 'undefined']:
                errors.append(f"{field_name} cannot be a reserved word")
                
        if errors:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"field": field_name.lower().replace(' ', '_'), "errors": errors}
            )
        
        return True

    async def register_user(self, registration_data: RegisterRequest, db: Session) -> User:
        """Register new user with comprehensive validation"""
        
        logger.info(f"Starting registration for email: {registration_data.email}")
        
        # Validate names
        try:
            logger.info("Validating first name...")
            self.validate_name(registration_data.first_name, "First name")
            logger.info("Validating last name...")
            self.validate_name(registration_data.last_name, "Last name")
        except Exception as e:
            logger.error(f"Name validation failed: {str(e)}")
            raise
        
        # Enhanced email validation
        email = registration_data.email.strip().lower()
        logger.info(f"Processing email: {email}")
        
        # Basic format validation
        if not email:
            logger.error("Email address is empty")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address is required"
            )
        
        # Length check (RFC 5321 compliant)
        if len(email) > 254:
            logger.error(f"Email address too long: {len(email)} characters")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address is too long"
            )
        
        try:
            # Use check_deliverability=False to skip DNS validation in Docker
            logger.info("Validating email format...")
            valid_email = validate_email(email, check_deliverability=False)
            email = valid_email.email  # Get normalized email
            logger.info(f"Email validated successfully: {email}")
        except EmailNotValidError as e:
            logger.error(f"Email validation failed for {email}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid email format"
            )
        except Exception as e:
            logger.error(f"Unexpected email validation error: {str(e)}")
            # Basic fallback validation
            import re
            email_pattern = r'^[a-zA-Z0-9.!#$%&\'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'
            if not re.match(email_pattern, email):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid email format"
                )
        
        # Check if user exists with better error messages
        logger.info(f"Checking if user exists for email: {email}")
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            logger.error(f"User already exists for email: {email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists. Please use a different email or try signing in."
            )
        
        # Generate username from email
        logger.info("Generating username from email...")
        username = self.generate_username_from_email(email, db)
        logger.info(f"Generated username: {username}")
        
        # Check if generated username conflicts (edge case)
        existing_username = db.query(User).filter(User.username == username).first()
        if existing_username:
            logger.warning(f"Username conflict detected: {username}, generating new one...")
            username = self.generate_username_from_email(email, db)  # Try again with counter
            logger.info(f"New username generated: {username}")
        
        # Enhanced password validation with user context
        logger.info("Validating password strength...")
        user_context = {
            'email': email,
            'username': username,
            'first_name': registration_data.first_name.strip(),
            'last_name': registration_data.last_name.strip()
        }
        try:
            self.validate_password_strength(registration_data.password, user_context)
            logger.info("Password validation successful")
        except Exception as e:
            logger.error(f"Password validation failed: {str(e)}")
            raise
        
        # Create user with sanitized data
        logger.info("Creating user object...")
        user = User(
            email=email,
            username=username,
            first_name=registration_data.first_name.strip(),
            last_name=registration_data.last_name.strip(),
            hashed_password=self.hash_password(registration_data.password),
            is_active=True,
            is_verified=False
        )
        
        try:
            logger.info("Adding user to database...")
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"Successfully created user: {email}")
            return user
        except Exception as e:
            db.rollback()
            logger.error(f"Database error during user creation: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user account. Please try again."
            )
    
    def generate_username_from_email(self, email: str, db: Session) -> str:
        """Generate unique username from email"""
        base_username = email.split('@')[0].lower()
        base_username = ''.join(c for c in base_username if c.isalnum())
        
        username = base_username
        counter = 1
        
        while db.query(User).filter(User.username == username).first():
            username = f"{base_username}{counter}"
            counter += 1
        
        return username
    
    # ==================== TOKEN OPERATIONS ====================
    
    async def refresh_access_token(self, refresh_token: str, db: Session) -> dict:
        """Refresh access token"""
        payload = self.verify_token(refresh_token, "refresh")
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Verify user exists and is active
        user = db.query(User).filter(User.user_id == int(user_id)).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Create new access token
        access_token = self.create_access_token(
            data={"sub": str(user.user_id), "email": user.email}
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": self.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
    
    def get_current_user(self, token: str, db: Session) -> User:
        """Get current user from JWT token"""
        payload = self.verify_token(token, "access")
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        user = db.query(User).filter(User.user_id == int(user_id)).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        return user
    
    async def update_last_login(self, user_id: int, db: Session):
        """Update user's last login timestamp"""
        user = db.query(User).filter(User.user_id == user_id).first()
        if user:
            user.last_login = datetime.now(timezone.utc)
            db.commit()
    
    # ==================== PASSWORD RESET (SIMPLIFIED) ====================
    
    async def request_password_reset(self, email: str, db: Session) -> str:
        """Request password reset token"""
        user = db.query(User).filter(User.email == email).first()
        if not user:
            # Don't reveal if email exists for security
            return "If the email exists, reset instructions have been sent"
        
        # Create reset token
        reset_data = {
            "email": email,
            "exp": datetime.now(timezone.utc) + timedelta(minutes=self.RESET_TOKEN_EXPIRE_MINUTES),
            "type": "reset"
        }
        
        reset_token = jwt.encode(reset_data, self.secret_key, algorithm=self.algorithm)
        
        # In production, send email here
        logger.info(f"Password reset requested for {email}")
        
        return reset_token
    
    async def reset_password(self, token: str, new_password: str, db: Session) -> bool:
        """Reset password using token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            
            if payload.get("type") != "reset":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid reset token"
                )
            
            email = payload.get("email")
            user = db.query(User).filter(User.email == email).first()
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            # Validate new password
            self.validate_password_strength(new_password)
            
            # Update password
            user.hashed_password = self.hash_password(new_password)
            db.commit()
            
            return True
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token has expired"
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reset token"
            )

    # ==================== EMAIL VERIFICATION ====================
    
    async def generate_verification_token(self, email: str) -> str:
        """Generate email verification token"""
        import secrets
        # For simplicity, generate a random token
        # In production, you might want to use JWT or store this in database
        token = secrets.token_urlsafe(32)
        logger.info(f"Generated verification token for {email}: {token[:10]}...")
        return token

# Global auth service instance
auth_service = AuthService()
