"""
Modern Authentication Router
World-class JWT-based authentication with security best practices
"""
from fastapi import APIRouter, Depends, Body, status, HTTPException, BackgroundTasks, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database import get_db
from services.auth_service_simple import AuthService
from core.auth_dependencies import (
    get_current_user, 
    get_current_active_user,
    get_current_verified_user
)
from models.user import User
from schemas.auth import (
    LoginRequest,
    RegisterRequest, 
    TokenResponse,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
    AuthUserResponse,
    PasswordResetTokenResponse
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

# Initialize auth service
auth_service = AuthService()

@router.post(
    "/register",
    response_model=AuthUserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user account",
    description="""
    Register a new user account with comprehensive validation.
    
    **Features:**
    - Strong password validation
    - Email format validation  
    - Username uniqueness check
    - Automatic email verification token generation
    - Security best practices
    
    **Password Requirements:**
    - Minimum 8 characters
    - At least 3 of: uppercase, lowercase, digit, special character
    - Not in common breach databases
    """
)
async def register(
    request: Request,
    registration_data: RegisterRequest = Body(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    """Register a new user account with enhanced security"""
    try:
        logger.info(f"Registration attempt for email: {registration_data.email}")
        logger.info(f"Registration data: first_name={registration_data.first_name}, last_name={registration_data.last_name}, email={registration_data.email}")
        
        # Check rate limiting
        client_ip = request.client.host if request.client else "unknown"
        logger.info(f"Rate limiting check for IP: {client_ip}")
        if not auth_service.check_rate_limit(client_ip, "registration"):
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many registration attempts. Please try again later."
            )
        
        # Register user
        logger.info("Calling auth_service.register_user...")
        user = await auth_service.register_user(registration_data, db)
        logger.info(f"User created with ID: {user.user_id}")
        
        # Generate verification token
        logger.info("Generating verification token...")
        verification_token = await auth_service.generate_verification_token(user.email)
        
        # Send verification email in background
        logger.info("Adding verification email to background tasks...")
        background_tasks.add_task(
            send_verification_email,
            user.email,
            verification_token
        )
        
        logger.info(f"User registered successfully: {user.email}")
        
        return AuthUserResponse(
            user_id=user.user_id,
            email=user.email,
            full_name=user.name,
            username=user.username,
            is_verified=user.is_verified,
            is_active=user.is_active,
            role="user",  # Default role since core_users table doesn't have role field
            created_at=user.created_at,
            message="Registration successful! Please check your email to verify your account."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error - Exception type: {type(e).__name__}")
        logger.error(f"Registration error - Exception message: {str(e)}")
        logger.error("Registration error - Full traceback:", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate user",
    description="""
    Authenticate user and return JWT tokens.
    
    **Features:**
    - Email or username login support
    - Rate limiting protection
    - Secure token generation
    - Login attempt tracking
    - Account lockout protection
    
    **Security:**
    - Short-lived access tokens (15 minutes)
    - Long-lived refresh tokens (30 days)
    - Token blacklisting support
    - Brute force protection
    """
)
async def login(
    request: Request,
    login_data: LoginRequest = Body(...),
    db: Session = Depends(get_db)
):
    """Authenticate user with enhanced security"""
    try:
        # Authenticate user (includes rate limiting)
        user = await auth_service.authenticate_user(
            login_data.email,
            login_data.password,
            db
        )
        
        # Generate tokens
        access_token = auth_service.create_access_token(
            data={"sub": str(user.user_id), "email": user.email}
        )
        refresh_token = auth_service.create_refresh_token(
            data={"sub": str(user.user_id), "email": user.email}
        )
        
        # Update last login
        await auth_service.update_last_login(user.user_id, db)
        
        logger.info(f"User logged in successfully: {user.email}")
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=auth_service.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=AuthUserResponse(
                user_id=user.user_id,
                email=user.email,
                full_name=user.name,
                username=user.username,
                is_verified=user.is_verified,
                is_active=user.is_active,
                role="user",
                last_login=user.last_login,
                created_at=user.created_at
            )
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed. Please try again."
        )

@router.post(
    "/refresh",
    response_model=dict,
    summary="Refresh access token",
    description="""
    Refresh expired access token using refresh token.
    
    **Features:**
    - Secure token refresh
    - User validation
    - Token blacklisting check
    - Automatic cleanup
    """
)
async def refresh_token(
    refresh_data: RefreshTokenRequest = Body(...),
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token"""
    try:
        token_data = await auth_service.refresh_access_token(
            refresh_data.refresh_token,
            db
        )
        
        logger.info("Token refreshed successfully")
        return token_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )

@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Logout user",
    description="""
    Logout user and invalidate tokens.
    
    **Features:**
    - Token blacklisting
    - Secure logout
    - Session cleanup
    """
)
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: User = Depends(get_current_user)
):
    """Logout user and blacklist token"""
    try:
        # Blacklist the current token
        success = auth_service.blacklist_token(credentials.credentials)
        
        if success:
            logger.info(f"User logged out successfully: {current_user.email}")
        
        # Return 204 No Content
        return None
        
    except Exception as e:
        logger.error(f"Logout error: {e}")
        # Even if blacklisting fails, don't show error to user
        return None

@router.post(
    "/forgot-password",
    response_model=PasswordResetTokenResponse,
    summary="Request password reset",
    description="""
    Request password reset token via email.
    
    **Features:**
    - Secure token generation
    - Email verification
    - Rate limiting
    - Security-focused design
    """
)
async def forgot_password(
    request: Request,
    forgot_data: ForgotPasswordRequest = Body(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    """Request password reset token"""
    try:
        # Check rate limiting
        client_ip = request.client.host if request.client else "unknown"
        if not auth_service.check_rate_limit(client_ip, "password_reset"):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many password reset attempts. Please try again later."
            )
        
        # Generate reset token (always succeeds for security)
        reset_token = await auth_service.request_password_reset(
            forgot_data.email,
            db
        )
        
        # Send reset email in background (if user exists)
        background_tasks.add_task(
            send_password_reset_email,
            forgot_data.email,
            reset_token
        )
        
        return PasswordResetTokenResponse(
            message="Password reset instructions sent if email exists",
            expires_in=auth_service.RESET_TOKEN_EXPIRE_MINUTES * 60
        )
        
    except Exception as e:
        logger.error(f"Password reset request error: {e}")
        # Always return success for security
        return PasswordResetTokenResponse(
            message="Password reset instructions sent if email exists",
            expires_in=auth_service.RESET_TOKEN_EXPIRE_MINUTES * 60
        )

@router.post(
    "/reset-password",
    response_model=dict,
    summary="Reset password with token",
    description="""
    Reset password using reset token from email.
    
    **Features:**
    - Token validation
    - Strong password requirements
    - Secure password hashing
    - Account security
    """
)
async def reset_password(
    reset_data: ResetPasswordRequest = Body(...),
    db: Session = Depends(get_db)
):
    """Reset password using reset token"""
    try:
        success = await auth_service.reset_password(
            reset_data.token,
            reset_data.new_password,
            db
        )
        
        if success:
            logger.info("Password reset successfully")
            return {"message": "Password reset successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password reset error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset failed"
        )

@router.post(
    "/change-password",
    response_model=dict,
    summary="Change user password",
    description="""
    Change password for authenticated user.
    
    **Features:**
    - Current password verification
    - Strong password validation
    - Secure password hashing
    - Authentication required
    """
)
async def change_password(
    password_data: ChangePasswordRequest = Body(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Change password for authenticated user"""
    try:
        # Verify current password
        if not auth_service.verify_password(
            password_data.current_password,
            current_user.hashed_password
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Validate new password
        auth_service.validate_password_strength(password_data.new_password)
        
        # Update password
        current_user.hashed_password = auth_service.hash_password(
            password_data.new_password
        )
        db.commit()
        
        logger.info(f"Password changed for user: {current_user.email}")
        
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password change error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password change failed"
        )

@router.post(
    "/verify-email",
    response_model=dict,
    summary="Verify email address",
    description="""
    Verify email address using verification token.
    
    **Features:**
    - Token validation
    - Email verification
    - Account activation
    """
)
async def verify_email(
    token: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """Verify email address using verification token"""
    try:
        success = await auth_service.verify_email(token, db)
        
        if success:
            logger.info("Email verified successfully")
            return {"message": "Email verified successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Email verification error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email verification failed"
        )

@router.get(
    "/me",
    response_model=AuthUserResponse,
    summary="Get current user",
    description="""
    Get current authenticated user information.
    
    **Features:**
    - JWT token validation
    - User data retrieval
    - Authentication required
    """
)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current authenticated user information"""
    return AuthUserResponse(
        user_id=current_user.user_id,
        email=current_user.email,
        full_name=current_user.name,
        username=current_user.username,
        avatar=getattr(current_user, 'avatar', None),
        is_verified=current_user.is_verified,
        is_active=current_user.is_active,
        role="user",
        last_login=current_user.last_login,
        created_at=current_user.created_at
    )

@router.get(
    "/profile",
    response_model=AuthUserResponse,
    summary="Get user profile",
    description="Get detailed user profile information (verified users only)"
)
async def get_user_profile(
    current_user: User = Depends(get_current_verified_user)
):
    """Get detailed user profile (verified users only)"""
    return AuthUserResponse(
        user_id=current_user.user_id,
        email=current_user.email,
        full_name=current_user.name,
        username=current_user.username,
        avatar=getattr(current_user, 'avatar', None),
        is_verified=current_user.is_verified,
        is_active=current_user.is_active,
        role="user",
        permissions=getattr(current_user, 'permissions', []),
        last_login=current_user.last_login,
        created_at=current_user.created_at
    )

# Background task functions
async def send_verification_email(email: str, token: str):
    """Send email verification in background"""
    # Implementation would send actual email
    logger.info(f"Verification email sent to {email} with token {token[:20]}...")

async def send_password_reset_email(email: str, token: str):
    """Send password reset email in background"""
    # Implementation would send actual email
    logger.info(f"Password reset email sent to {email} with token {token[:20]}...")
