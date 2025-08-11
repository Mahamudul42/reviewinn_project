import React from 'react';
import { AlertCircle, XCircle } from 'lucide-react';

interface AuthErrorProps {
  message?: string;
  className?: string;
  variant?: 'simple' | 'detailed';
}

const AuthError: React.FC<AuthErrorProps> = ({ 
  message, 
  className = '', 
  variant = 'detailed' 
}) => {
  if (!message) return null;

  const isServerError = message.toLowerCase().includes('server') || 
                       message.toLowerCase().includes('internal') ||
                       message.toLowerCase().includes('500');
  
  const isNetworkError = message.toLowerCase().includes('network') ||
                        message.toLowerCase().includes('connection') ||
                        message.toLowerCase().includes('timeout');

  const getIcon = () => {
    if (isServerError || isNetworkError) {
      return <XCircle size={16} className="text-red-500 flex-shrink-0" />;
    }
    return <AlertCircle size={16} className="text-red-500 flex-shrink-0" />;
  };

  const getHelpText = () => {
    if (isServerError) {
      return "Our servers are temporarily unavailable. Please try again in a few moments.";
    }
    if (isNetworkError) {
      return "Please check your internet connection and try again.";
    }
    return null;
  };

  if (variant === 'simple') {
    return (
      <div className={`text-sm text-red-600 mt-2 ${className}`}>
        {message}
      </div>
    );
  }

  return (
    <div className={`mt-3 p-3 bg-red-50 border border-red-200 rounded-lg ${className}`}>
      <div className="flex items-start space-x-2">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-800">
            {message}
          </p>
          {getHelpText() && (
            <p className="text-xs text-red-600 mt-1">
              {getHelpText()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthError; 