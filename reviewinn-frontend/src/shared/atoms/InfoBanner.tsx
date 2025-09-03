import React, { useState } from 'react';
import { Info, X } from 'lucide-react';

interface InfoBannerProps {
  title: string;
  message: string;
  type?: 'info' | 'tip' | 'warning';
  dismissible?: boolean;
  storageKey?: string; // For persistent dismissal
}

const InfoBanner: React.FC<InfoBannerProps> = ({
  title,
  message,
  type = 'info',
  dismissible = true,
  storageKey
}) => {
  const [isDismissed, setIsDismissed] = useState(() => {
    if (storageKey) {
      return localStorage.getItem(`dismissed_${storageKey}`) === 'true';
    }
    return false;
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    if (storageKey) {
      localStorage.setItem(`dismissed_${storageKey}`, 'true');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleDismiss();
    }
  };

  if (isDismissed) {
    return null;
  }

  const colorClasses = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    tip: 'bg-green-50 border-green-200 text-green-900', 
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900'
  };

  const iconColorClasses = {
    info: 'text-blue-600',
    tip: 'text-green-600',
    warning: 'text-yellow-600'
  };

  const roleMap = {
    info: 'status',
    tip: 'status',
    warning: 'alert'
  };

  return (
    <div 
      className={`border rounded-lg p-4 ${colorClasses[type]}`}
      role={roleMap[type]}
      aria-live={type === 'warning' ? 'assertive' : 'polite'}
      aria-labelledby={`banner-title-${type}`}
      aria-describedby={`banner-message-${type}`}
    >
      <div className="flex items-start">
        <Info 
          className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${iconColorClasses[type]}`} 
          aria-hidden="true"
        />
        <div className="flex-1">
          <h3 
            id={`banner-title-${type}`}
            className="text-sm font-medium mb-1"
          >
            {title}
          </h3>
          <p 
            id={`banner-message-${type}`}
            className="text-sm opacity-90"
          >
            {message}
          </p>
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            onKeyDown={handleKeyDown}
            className={`ml-3 flex-shrink-0 p-1 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${iconColorClasses[type]} hover:opacity-70 transition-all`}
            aria-label={`Dismiss ${type} notification: ${title}`}
            type="button"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};

export default InfoBanner;
