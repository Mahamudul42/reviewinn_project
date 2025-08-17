import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUnifiedAuth } from '../../../hooks/useUnifiedAuth';
import type { LoginCredentials, RegisterData } from '../../../api/auth';
import LoginForm from '../../../shared/molecules/LoginForm';
import SignupForm from '../../../shared/molecules/SignupForm';
import { useToast } from '../../../shared/design-system/components/Toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
  onRegisterSuccess?: () => void;
  onSuccess?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onRegisterSuccess,
  onSuccess
}) => {
  const toast = useToast();
  const { login, register, clearError } = useUnifiedAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastErrorStatus, setLastErrorStatus] = useState<number | null>(null);

  // Manage body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'relative';
      
      // Clear any previous errors when modal opens
      clearError();
      setLastErrorStatus(null);
      setAgreeToTerms(false);
      
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
      };
    }
  }, [isOpen]);

  const [loginForm, setLoginForm] = useState<LoginCredentials>({
    email: '',
    password: ''
  });

  const [registerForm, setRegisterForm] = useState<RegisterData>({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const [agreeToTerms, setAgreeToTerms] = useState<boolean>(false);

  // Industry-standard email validation with additional checks
  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email) && email.length <= 254; // RFC 5321 limit
  };

  // Industry-standard password validation
  const validatePassword = (password: string) => {
    const checks = {
      minLength: password.length >= 8,
      maxLength: password.length <= 128,
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      noCommonPatterns: !/^(password|123456|qwerty|admin|user|test)$/i.test(password),
      noSequential: !/(?:012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)
    };
    
    const strength = Object.values(checks).filter(Boolean).length;
    return { checks, strength, isValid: strength >= 6 };
  };

  // Name validation
  const validateName = (name: string, fieldName: string) => {
    const trimmed = name.trim();
    if (!trimmed) return `${fieldName} is required`;
    if (trimmed.length < 2) return `${fieldName} must be at least 2 characters long`;
    if (trimmed.length > 50) return `${fieldName} cannot exceed 50 characters`;
    if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
    return null;
  };

  const getDetailedErrorMessage = (error: any): string => {
    if (!error) return 'An unexpected error occurred';

    // Handle HTTPException with detail
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }

    // Handle API error responses
    if (error.response?.status) {
      switch (error.response.status) {
        case 400:
          return 'Invalid request. Please check your information and try again.';
        case 401:
          return isLogin 
            ? 'Invalid email or password. Please check your credentials and try again.'
            : 'Authentication failed. Please try again.';
        case 422:
          return 'Please check your input and try again.';
        case 429:
          return 'Too many attempts. Please wait a moment before trying again.';
        case 500:
          return 'Server error. Please try again later.';
        default:
          return error.response.data?.message || 'Something went wrong. Please try again.';
      }
    }

    // Handle string errors
    if (typeof error === 'string') {
      return error;
    }

    // Handle Error objects
    if (error instanceof Error) {
      return error.message;
    }

    // Handle detailed error objects
    if (error.detail) {
      return error.detail;
    }

    if (error.message) {
      return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Enhanced login validation
    if (!loginForm.email.trim()) {
      setError('Email address is required');
      setIsLoading(false);
      return;
    }
    if (!validateEmail(loginForm.email.trim())) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }
    if (!loginForm.password) {
      setError('Password is required');
      setIsLoading(false);
      return;
    }
    if (loginForm.password.length < 4) {
      setError('Password is too short');
      setIsLoading(false);
      return;
    }

    try {
      // Sanitize login data
      const sanitizedCredentials = {
        email: loginForm.email.trim().toLowerCase(),
        password: loginForm.password
      };

      await login(sanitizedCredentials);
      toast.success('Successfully signed in! Welcome back.');
      
      // Emit auth success events for reactive state management
      window.dispatchEvent(new CustomEvent('loginSuccess'));
      window.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { isAuthenticated: true } 
      }));
      
      console.log('AuthModal: Login successful, calling callbacks');
      onLoginSuccess?.();
      onSuccess?.();
      
      // Small delay to ensure auth state is fully propagated before closing modal
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = getDetailedErrorMessage(err);
      const errorStatus = (err as any)?.response?.status;
      
      setError(errorMessage);
      setLastErrorStatus(errorStatus);
      
      // Enhanced error handling with user guidance
      if (errorStatus === 429) {
        toast.error('Too many login attempts. Please wait before trying again.');
      } else if (errorStatus === 401) {
        // Provide helpful guidance for login failures
        toast.error('Login failed: Invalid email or password');
        
        // Show additional guidance after 2 seconds
        setTimeout(() => {
          toast.info("Don't have an account? Click 'Sign Up' to create one!");
        }, 2000);
        
        // Additional helpful message for common issues
        setTimeout(() => {
          toast.warning('Tip: Make sure your email is correct and check your password carefully');
        }, 4000);
      } else {
        toast.error(`Sign in failed: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Industry-standard comprehensive validation
    
    // Name validation
    const firstNameError = validateName(registerForm.firstName, 'First name');
    if (firstNameError) {
      setError(firstNameError);
      setIsLoading(false);
      return;
    }
    
    const lastNameError = validateName(registerForm.lastName, 'Last name');
    if (lastNameError) {
      setError(lastNameError);
      setIsLoading(false);
      return;
    }

    // Email validation
    if (!registerForm.email.trim()) {
      setError('Email address is required');
      setIsLoading(false);
      return;
    }
    if (!validateEmail(registerForm.email.trim())) {
      setError('Please enter a valid email address (e.g., user@example.com)');
      setIsLoading(false);
      return;
    }

    // Password validation
    if (!registerForm.password) {
      setError('Password is required');
      setIsLoading(false);
      return;
    }
    
    const passwordValidation = validatePassword(registerForm.password);
    if (!passwordValidation.isValid) {
      const { checks } = passwordValidation;
      let errorMsg = 'Password must meet the following requirements:\n';
      if (!checks.minLength) errorMsg += '• At least 8 characters\n';
      if (!checks.maxLength) errorMsg += '• No more than 128 characters\n';
      if (!checks.hasLowercase) errorMsg += '• At least one lowercase letter\n';
      if (!checks.hasUppercase) errorMsg += '• At least one uppercase letter\n';
      if (!checks.hasNumber) errorMsg += '• At least one number\n';
      if (!checks.hasSpecialChar) errorMsg += '• At least one special character (!@#$%^&*)\n';
      if (!checks.noCommonPatterns) errorMsg += '• Cannot be a common password\n';
      if (!checks.noSequential) errorMsg += '• Cannot contain sequential characters\n';
      
      setError(errorMsg.trim());
      setIsLoading(false);
      return;
    }

    // Terms of service validation
    if (!agreeToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy to continue');
      setIsLoading(false);
      return;
    }

    // Additional security checks
    if (registerForm.email.toLowerCase().includes(registerForm.password.toLowerCase()) || 
        registerForm.password.toLowerCase().includes(registerForm.email.split('@')[0].toLowerCase())) {
      setError('Password cannot contain your email address or username');
      setIsLoading(false);
      return;
    }

    try {
      // Sanitize form data before sending
      const sanitizedData = {
        firstName: registerForm.firstName.trim(),
        lastName: registerForm.lastName.trim(),
        email: registerForm.email.trim().toLowerCase(),
        password: registerForm.password
      };

      await register(sanitizedData);
      toast.success('Account created successfully! Welcome to ReviewInn!');
      
      // Emit auth success events for reactive state management
      window.dispatchEvent(new CustomEvent('loginSuccess'));
      window.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { isAuthenticated: true } 
      }));
      window.dispatchEvent(new CustomEvent('userRegistered', { 
        detail: { userId: sanitizedData.email, isNewUser: true } 
      }));
      
      console.log('AuthModal: Registration successful, calling callbacks');
      onRegisterSuccess?.();
      onSuccess?.();
      
      // Small delay to ensure auth state is fully propagated before closing modal
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = getDetailedErrorMessage(err);
      const errorStatus = (err as any)?.response?.status;
      
      setError(errorMessage);
      setLastErrorStatus(errorStatus);
      
      // Enhanced error handling for registration
      if (errorStatus === 400) {
        toast.error('Please check your information and try again.');
      } else if (errorStatus === 409) {
        toast.error('Email already exists. Please use a different email or sign in.');
        setTimeout(() => {
          toast.info('Already have an account? Try signing in instead!');
        }, 2000);
      } else if (errorStatus === 422) {
        toast.error('Please check all fields and try again.');
      } else {
        toast.error(`Registration failed: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Calculate the current viewport center dynamically
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  const modalHeight = Math.min(600, viewportHeight * 0.9);
  const modalWidth = Math.min(672, viewportWidth * 0.9); // Match middle panel max-w-2xl
  
  const centerTop = scrollTop + (viewportHeight / 2) - (modalHeight / 2);
  const centerLeft = scrollLeft + (viewportWidth / 2) - (modalWidth / 2);

  // JavaScript-calculated positioning
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: Math.max(document.documentElement.scrollHeight, viewportHeight),
        zIndex: 9999999,
        background: 'rgba(255, 0, 0, 0.8)',
        pointerEvents: 'auto',
      }}
      onClick={onClose}
    >
      <div 
        style={{
          position: 'absolute',
          top: `${centerTop}px`,
          left: `${centerLeft}px`,
          width: `${modalWidth}px`,
          maxHeight: `${modalHeight}px`,
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)', 
          padding: '24px 24px 16px 24px',
          minHeight: '64px'
        }}>
          <div style={{ fontWeight: 600, fontSize: 18, color: '#1f2937', lineHeight: 1.4 }}>
            {isLogin ? 'Sign In' : 'Sign Up'}
          </div>
          <button
            style={{ 
              color: '#6b7280', 
              background: 'none', 
              border: 'none', 
              borderRadius: '6px', 
              width: 32, 
              height: 32, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              fontSize: '20px',
              fontWeight: 400
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#6b7280';
            }}
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        {/* Content */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '24px 24px 32px 24px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 0, 0, 0.2) transparent',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <p style={{ color: '#666', fontSize: 14, margin: '8px 0' }}>
              {isLogin ? 'Welcome back! Please sign in to your account.' : 'Create a new account to get started.'}
            </p>
          </div>
          
          {isLogin ? (
            <LoginForm
              email={loginForm.email}
              password={loginForm.password}
              showPassword={showPassword}
              loading={isLoading}
              error={error || undefined}
              onEmailChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginForm((prev: LoginCredentials) => ({ ...prev, email: e.target.value }))}
              onPasswordChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginForm((prev: LoginCredentials) => ({ ...prev, password: e.target.value }))}
              onTogglePassword={() => setShowPassword(!showPassword)}
              onSubmit={handleLogin}
            />
          ) : (
            <SignupForm
              firstName={registerForm.firstName}
              lastName={registerForm.lastName}
              email={registerForm.email}
              password={registerForm.password}
              agreeToTerms={agreeToTerms}
              showPassword={showPassword}
              loading={isLoading}
              error={error || undefined}
              onFirstNameChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegisterForm((prev: RegisterData) => ({ ...prev, firstName: e.target.value }))}
              onLastNameChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegisterForm((prev: RegisterData) => ({ ...prev, lastName: e.target.value }))}
              onEmailChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegisterForm((prev: RegisterData) => ({ ...prev, email: e.target.value }))}
              onPasswordChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegisterForm((prev: RegisterData) => ({ ...prev, password: e.target.value }))}
              onAgreeToTermsChange={(e: React.ChangeEvent<HTMLInputElement>) => setAgreeToTerms(e.target.checked)}
              onTogglePassword={() => setShowPassword(!showPassword)}
              onSubmit={handleRegister}
            />
          )}
          
          {/* Switch between login and register */}
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            {isLogin ? (
              <p style={{ fontSize: 14, color: '#666' }}>
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setIsLogin(false);
                    clearError();
                    setLastErrorStatus(null);
                    setAgreeToTerms(false);
                  }}
                  style={{ color: '#a855f7', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p style={{ fontSize: 14, color: '#666' }}>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setIsLogin(true);
                    clearError();
                    setLastErrorStatus(null);
                    setAgreeToTerms(false);
                  }}
                  style={{ color: '#a855f7', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;