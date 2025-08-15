import React from 'react';
import AuthFormField from './AuthFormField';
import AuthButton from '../atoms/AuthButton';
import AuthError from '../atoms/AuthError';
import PasswordStrength from './PasswordStrength';
import { Mail, Lock, User, FileText } from 'lucide-react';

interface SignupFormProps {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  agreeToTerms: boolean;
  showPassword: boolean;
  loading: boolean;
  error?: string;
  onFirstNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLastNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAgreeToTermsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const SignupForm: React.FC<SignupFormProps> = ({
  firstName, lastName, email, password, agreeToTerms, showPassword, loading, error,
  onFirstNameChange, onLastNameChange, onEmailChange, onPasswordChange, onAgreeToTermsChange, onTogglePassword, onSubmit
}) => (
  <form onSubmit={onSubmit} className="auth-form">
    <AuthError message={error} />
    <AuthFormField
      id="first-name"
      label="First Name"
      type="text"
      value={firstName}
      onChange={onFirstNameChange}
      icon={<User size={18} className="input-icon" />}
      required
      placeholder="Enter your first name"
    />
    <AuthFormField
      id="last-name"
      label="Last Name"
      type="text"
      value={lastName}
      onChange={onLastNameChange}
      icon={<User size={18} className="input-icon" />}
      required
      placeholder="Enter your last name"
    />
    <AuthFormField
      id="register-email"
      label="Email"
      type="email"
      value={email}
      onChange={onEmailChange}
      icon={<Mail size={18} className="input-icon" />}
      required
      placeholder="Enter your email"
    />
    <div>
      <AuthFormField
        id="register-password"
        label="Password"
        type="password"
        value={password}
        onChange={onPasswordChange}
        icon={<Lock size={18} className="input-icon" />}
        showPassword={showPassword}
        onTogglePassword={onTogglePassword}
        required
        placeholder="Create a password"
      />
      {password && <PasswordStrength password={password} />}
    </div>
    <div className="flex items-start space-x-3 py-3">
      <input
        id="agree-terms"
        type="checkbox"
        checked={agreeToTerms}
        onChange={onAgreeToTermsChange}
        className="mt-1 h-4 w-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
        required
      />
      <label htmlFor="agree-terms" className="text-sm text-gray-700 leading-relaxed">
        I agree to the{' '}
        <button
          type="button"
          onClick={() => window.open('/terms-of-service', '_blank')}
          className="text-blue-600 hover:text-blue-800 underline font-medium"
        >
          Terms of Service
        </button>
        {' '}and{' '}
        <button
          type="button"
          onClick={() => window.open('/privacy-policy', '_blank')}
          className="text-blue-600 hover:text-blue-800 underline font-medium"
        >
          Privacy Policy
        </button>
      </label>
    </div>
    <AuthButton type="submit" disabled={loading}>
      {loading ? 'Creating Account...' : 'Create Account'}
    </AuthButton>
  </form>
);

export default SignupForm; 