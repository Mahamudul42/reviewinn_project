import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Mail, X, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useToast } from '../../../shared/design-system/components/Toast';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onVerificationSuccess: () => void;
  onResendSuccess?: () => void;
}

interface VerificationResponse {
  success: boolean;
  message?: string;
  error?: string;
  resend_available_in?: number;
  attempts_remaining?: number;
}

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  email,
  onVerificationSuccess,
  onResendSuccess
}) => {
  const toast = useToast();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownInterval = useRef<NodeJS.Timeout>();

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [isOpen]);

  // Handle resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      cooldownInterval.current = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(cooldownInterval.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (cooldownInterval.current) {
        clearInterval(cooldownInterval.current);
      }
    };
  }, [resendCooldown]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (cooldownInterval.current) {
        clearInterval(cooldownInterval.current);
      }
    };
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Take only the last character
    setCode(newCode);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newCode.every(digit => digit !== '') && value) {
      handleVerification(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      handleVerification(code.join(''));
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length <= 6) {
      const newCode = ['', '', '', '', '', ''];
      for (let i = 0; i < pastedData.length; i++) {
        newCode[i] = pastedData[i];
      }
      setCode(newCode);
      
      // Focus the next empty input or last input
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();

      // Auto-submit if all fields are filled
      if (pastedData.length === 6) {
        handleVerification(pastedData);
      }
    }
  };

  const handleVerification = async (verificationCode: string) => {
    if (verificationCode.length !== 6) {
      setError('Please enter a complete 6-digit code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try backend verification first, then fall back to static code
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/auth-production/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          verification_code: verificationCode
        }),
      });

      if (response.ok) {
        // Backend verification successful
        setIsVerified(true);
        console.log('Email verified successfully via backend');
        
        // Show success state briefly before closing
        setTimeout(() => {
          onVerificationSuccess();
        }, 1500);
      } else if (verificationCode === '123456') {
        // Fall back to static verification code
        setIsVerified(true);
        console.log('Email verified successfully with static code (backend verification failed)');
        
        // Show success state briefly before closing
        setTimeout(() => {
          onVerificationSuccess();
        }, 1500);
      } else {
        // Invalid code
        setAttemptsRemaining(prev => Math.max(0, prev - 1));
        
        if (attemptsRemaining <= 1) {
          setError('Invalid verification code. Too many failed attempts.');
          setCode(['', '', '', '', '', '']);
        } else {
          setError(`Invalid verification code. ${attemptsRemaining - 1} attempt${attemptsRemaining - 1 !== 1 ? 's' : ''} remaining.`);
          setCode(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);
    setError(null);

    try {
      // Static resend functionality for now
      console.log('Resending verification code (static implementation)');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset attempts and set cooldown
      setAttemptsRemaining(5);
      setResendCooldown(120);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      onResendSuccess?.();
      
      console.log('Code resent successfully (use 123456)');
    } catch (error) {
      console.error('Resend error:', error);
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const maskEmail = (email: string) => {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) return email;
    
    const maskedLocal = localPart[0] + '*'.repeat(Math.max(0, localPart.length - 2)) + localPart.slice(-1);
    return `${maskedLocal}@${domain}`;
  };

  const handleClose = () => {
    if (!isLoading) {
      setCode(['', '', '', '', '', '']);
      setError(null);
      setIsVerified(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  // Calculate the current viewport center dynamically (matching AuthModal)
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  const modalHeight = Math.min(600, viewportHeight * 0.9);
  const modalWidth = Math.min(448, viewportWidth * 0.9); // max-w-md equivalent
  
  const centerTop = scrollTop + (viewportHeight / 2) - (modalHeight / 2);
  const centerLeft = scrollLeft + (viewportWidth / 2) - (modalWidth / 2);

  const modalContent = (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: Math.max(document.documentElement.scrollHeight, viewportHeight),
        zIndex: 9999999, // Match AuthModal z-index
        background: 'rgba(0, 0, 0, 0.5)', // Match consistent modal background
        pointerEvents: 'auto',
      }}
      onClick={handleClose}
    >
      {/* Modal */}
      <div 
        style={{
          position: 'absolute',
          top: `${centerTop}px`,
          left: `${centerLeft}px`,
          width: `${modalWidth}px`,
          maxHeight: `${modalHeight}px`,
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          transform: 'scale(1)',
          transition: 'all 0.3s ease',
          overflow: 'auto',
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={isLoading}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            padding: '8px',
            color: '#9CA3AF',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '50%',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.5 : 1,
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            if (!isLoading) {
              e.currentTarget.style.color = '#6B7280';
              e.currentTarget.style.backgroundColor = '#F3F4F6';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = '#9CA3AF';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <X size={20} />
        </button>

        <div style={{ padding: '32px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              margin: '0 auto',
              width: '64px',
              height: '64px',
              backgroundColor: isVerified ? '#dcfce7' : '#dbeafe',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              {isVerified ? (
                <CheckCircle size={32} color="#16a34a" />
              ) : (
                <Mail size={32} color="#2563eb" />
              )}
            </div>
            
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '8px',
              margin: '0 0 8px 0'
            }}>
              {isVerified ? 'Email Verified!' : 'Verify Your Email'}
            </h2>
            
            <p style={{ color: '#4b5563', fontSize: '16px', lineHeight: '1.5' }}>
              {isVerified ? (
                'Your email has been successfully verified.'
              ) : (
                <>
                  We've sent a 6-digit verification code to{' '}
                  <span style={{ fontWeight: '500', color: '#111827' }}>{maskEmail(email)}</span>
                </>
              )}
            </p>
            
            {!isVerified && (
              <p style={{ 
                color: '#6b7280', 
                fontSize: '14px', 
                marginTop: '8px',
                fontStyle: 'italic'
              }}>
                For testing, use code: <strong>123456</strong>
              </p>
            )}
          </div>

          {!isVerified && (
            <>
              {/* Code Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Enter verification code
                </label>
                
                <div className="flex justify-center space-x-3 mb-2">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => inputRefs.current[index] = el}
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={isLoading || isVerified}
                    />
                  ))}
                </div>

                {/* Attempts Remaining */}
                {attemptsRemaining < 5 && attemptsRemaining > 0 && (
                  <div className="flex items-center justify-center text-sm text-amber-600 mt-2">
                    <AlertCircle size={16} className="mr-1" />
                    {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Resend Section */}
              <div className="text-center border-t pt-6">
                <p className="text-sm text-gray-600 mb-4">
                  Didn't receive the code?
                </p>
                
                <button
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || isResending || isLoading}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : resendCooldown > 0 ? (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      Resend in {formatTime(resendCooldown)}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Resend Code
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-2xl">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm text-gray-600">Verifying code...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default EmailVerificationModal;