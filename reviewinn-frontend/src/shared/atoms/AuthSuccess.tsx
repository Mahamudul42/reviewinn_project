import React from 'react';
import { CheckCircle } from 'lucide-react';

interface AuthSuccessProps {
  message?: string;
  className?: string;
}

const AuthSuccess: React.FC<AuthSuccessProps> = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <div className={`mt-3 p-3 bg-green-50 border border-green-200 rounded-lg ${className}`}>
      <div className="flex items-start space-x-2">
        <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
        <p className="text-sm font-medium text-green-800 flex-1">
          {message}
        </p>
      </div>
    </div>
  );
};

export default AuthSuccess;
