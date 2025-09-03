import { useCallback, useState } from 'react';

interface UseAnnouncementOptions {
  politeness?: 'polite' | 'assertive' | 'off';
  clearDelay?: number;
}

interface UseAnnouncementReturn {
  message: string;
  announce: (message: string) => void;
  clearMessage: () => void;
}

export const useAnnouncement = (
  options: UseAnnouncementOptions = {}
): UseAnnouncementReturn => {
  const { clearDelay = 5000 } = options;
  const [message, setMessage] = useState('');

  const announce = useCallback((newMessage: string) => {
    setMessage(newMessage);
    
    if (clearDelay > 0) {
      setTimeout(() => {
        setMessage('');
      }, clearDelay);
    }
  }, [clearDelay]);

  const clearMessage = useCallback(() => {
    setMessage('');
  }, []);

  return {
    message,
    announce,
    clearMessage,
  };
};