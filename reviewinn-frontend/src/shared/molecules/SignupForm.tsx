import React from 'react';
import AuthFormField from './AuthFormField';
import AuthButton from '../atoms/AuthButton';
import AuthError from '../atoms/AuthError';
import PasswordStrength from './PasswordStrength';
import { Mail, Lock, User } from 'lucide-react';

interface SignupFormProps {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  loading: boolean;
  error?: string;
  onFirstNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLastNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onConfirmPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const SignupForm: React.FC<SignupFormProps> = ({
  firstName, lastName, email, password, confirmPassword, showPassword, loading, error,
  onFirstNameChange, onLastNameChange, onEmailChange, onPasswordChange, onConfirmPasswordChange, onTogglePassword, onSubmit
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
    <AuthFormField
      id="confirm-password"
      label="Confirm Password"
      type="password"
      value={confirmPassword}
      onChange={onConfirmPasswordChange}
      icon={<Lock size={18} className="input-icon" />}
      showPassword={showPassword}
      onTogglePassword={onTogglePassword}
      required
      placeholder="Confirm your password"
    />
    <AuthButton type="submit" disabled={loading}>
      {loading ? 'Creating Account...' : 'Create Account'}
    </AuthButton>
  </form>
);

export default SignupForm; 