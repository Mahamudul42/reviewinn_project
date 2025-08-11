import React from 'react';
import AuthLabel from '../atoms/AuthLabel';
import AuthInput from '../atoms/AuthInput';
import PasswordToggleButton from '../atoms/PasswordToggleButton';

interface AuthFormFieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: React.ReactNode;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  required?: boolean;
  placeholder?: string;
}

const AuthFormField: React.FC<AuthFormFieldProps> = ({
  id, label, type, value, onChange, icon, showPassword, onTogglePassword, required, placeholder
}) => (
  <div className="form-group">
    <div className="label-icon-row" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {icon}
      <AuthLabel htmlFor={id}>{label}</AuthLabel>
    </div>
    <div className="input-wrapper">
      <AuthInput
        id={id}
        type={type === 'password' && showPassword ? 'text' : type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
      {type === 'password' && onTogglePassword && (
        <PasswordToggleButton show={!!showPassword} onClick={onTogglePassword} />
      )}
    </div>
  </div>
);

export default AuthFormField; 