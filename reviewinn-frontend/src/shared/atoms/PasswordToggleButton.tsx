import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordToggleButtonProps {
  show: boolean;
  onClick: () => void;
  className?: string;
}

const PasswordToggleButton: React.FC<PasswordToggleButtonProps> = ({ show, onClick, className = '' }) => (
  <button
    type="button"
    className={`password-toggle ${className}`}
    onClick={onClick}
    aria-label={show ? 'Hide password' : 'Show password'}
  >
    {show ? <EyeOff size={18} /> : <Eye size={18} />}
  </button>
);

export default PasswordToggleButton; 