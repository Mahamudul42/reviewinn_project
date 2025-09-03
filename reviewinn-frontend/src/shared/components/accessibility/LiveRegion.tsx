import React, { useEffect, useState } from 'react';

interface LiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  clearOnUnmount?: boolean;
  className?: string;
}

const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  politeness = 'polite',
  atomic = true,
  clearOnUnmount = true,
  className = ''
}) => {
  const [announcements, setAnnouncements] = useState<string[]>([]);

  useEffect(() => {
    if (message) {
      setAnnouncements(prev => [...prev, message]);
      
      // Clear message after a delay to prevent screen reader repetition
      const timer = setTimeout(() => {
        setAnnouncements(prev => prev.slice(1));
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    return () => {
      if (clearOnUnmount) {
        setAnnouncements([]);
      }
    };
  }, [clearOnUnmount]);

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className={`sr-only ${className}`}
    >
      {announcements.map((announcement, index) => (
        <div key={`${announcement}-${index}`}>
          {announcement}
        </div>
      ))}
    </div>
  );
};

export default LiveRegion;