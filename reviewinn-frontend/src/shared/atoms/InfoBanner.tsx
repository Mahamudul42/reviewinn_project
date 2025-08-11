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

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[type]}`}>
      <div className="flex items-start">
        <Info className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${iconColorClasses[type]}`} />
        <div className="flex-1">
          <h3 className="text-sm font-medium mb-1">{title}</h3>
          <p className="text-sm opacity-90">{message}</p>
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`ml-3 flex-shrink-0 ${iconColorClasses[type]} hover:opacity-70 transition-opacity`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default InfoBanner;
