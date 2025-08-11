import React from 'react';
import { Loader2 } from 'lucide-react';

interface AuthLoadingProps {
  message?: string;
  className?: string;
}

const AuthLoading: React.FC<AuthLoadingProps> = ({ 
  message = 'Processing...', 
  className = '' 
}) => {
  return (
    <div className={`flex items-center justify-center space-x-2 text-blue-600 ${className}`}>
      <Loader2 size={16} className="animate-spin" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

export default AuthLoading;
