import React from 'react';
import { Mail, Lock } from 'lucide-react';
import AuthFormField from './AuthFormField';
import AuthButton from '../atoms/AuthButton';
import AuthError from '../atoms/AuthError';

interface LoginFormProps {
  email: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  error?: string;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  email, password, showPassword, loading, error,
  onEmailChange, onPasswordChange, onTogglePassword, onSubmit
}) => (
  <form onSubmit={onSubmit} className="auth-form">
    <AuthError message={error} />
    <AuthFormField
      id="email"
      label="Email"
      type="email"
      value={email}
      onChange={onEmailChange}
      icon={<Mail size={18} className="input-icon" />}
      required
      placeholder="Enter your email"
    />
    <AuthFormField
      id="password"
      label="Password"
      type="password"
      value={password}
      onChange={onPasswordChange}
      icon={<Lock size={18} className="input-icon" />}
      showPassword={showPassword}
      onTogglePassword={onTogglePassword}
      required
      placeholder="Enter your password"
    />
    <AuthButton type="submit" disabled={loading}>
      {loading ? 'Signing In...' : 'Sign In'}
    </AuthButton>
  </form>
);

export default LoginForm; 