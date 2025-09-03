import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAnnouncement } from '../shared/hooks/useAnnouncement';
import LiveRegion from '../shared/components/accessibility/LiveRegion';

interface AccessibilityContextValue {
  // Announcement system
  announceMessage: (message: string, priority?: 'polite' | 'assertive') => void;
  currentMessage: string;
  
  // User preferences
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  prefersLargeText: boolean;
  
  // Focus management
  focusOnElement: (elementId: string) => boolean;
  
  // Screen reader detection
  isScreenReaderActive: boolean;
  
  // Settings
  updatePreferences: (preferences: Partial<AccessibilityPreferences>) => void;
}

interface AccessibilityPreferences {
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  prefersLargeText: boolean;
  autoplay: boolean;
  showFocusIndicators: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const { message: currentMessage, announce } = useAnnouncement();
  
  // User preferences state
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() => {
    // Load preferences from localStorage
    const saved = localStorage.getItem('reviewinn-accessibility-preferences');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.warn('Failed to parse accessibility preferences:', error);
      }
    }
    
    // Default preferences based on system settings
    return {
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
      prefersLargeText: false,
      autoplay: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      showFocusIndicators: true,
    };
  });
  
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);

  // Detect media query changes
  useEffect(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setPreferences(prev => ({ ...prev, prefersReducedMotion: e.matches }));
    };
    
    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setPreferences(prev => ({ ...prev, prefersHighContrast: e.matches }));
    };

    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    highContrastQuery.addEventListener('change', handleHighContrastChange);

    return () => {
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
    };
  }, []);

  // Basic screen reader detection
  useEffect(() => {
    const detectScreenReader = () => {
      // Check for common screen reader indicators
      const hasScreenReader = (
        'speechSynthesis' in window ||
        navigator.userAgent.includes('NVDA') ||
        navigator.userAgent.includes('JAWS') ||
        navigator.userAgent.includes('VoiceOver') ||
        window.speechSynthesis?.getVoices().length > 0
      );
      
      setIsScreenReaderActive(hasScreenReader);
    };

    detectScreenReader();

    // Check again after a short delay to catch async voice loading
    const timer = setTimeout(detectScreenReader, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Apply preferences to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply CSS custom properties based on preferences
    if (preferences.prefersReducedMotion) {
      root.style.setProperty('--animation-duration', '0.01ms');
      root.style.setProperty('--transition-duration', '0.01ms');
    } else {
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
    }
    
    if (preferences.prefersHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    if (preferences.prefersLargeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
    
    if (preferences.showFocusIndicators) {
      root.classList.add('show-focus-indicators');
    } else {
      root.classList.remove('show-focus-indicators');
    }

    // Save preferences to localStorage
    try {
      localStorage.setItem('reviewinn-accessibility-preferences', JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save accessibility preferences:', error);
    }
  }, [preferences]);

  const announceMessage = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announce(message);
  };

  const focusOnElement = (elementId: string): boolean => {
    try {
      const element = document.getElementById(elementId) as HTMLElement;
      if (element) {
        element.focus();
        return document.activeElement === element;
      }
    } catch (error) {
      console.warn(`Failed to focus on element with id "${elementId}":`, error);
    }
    return false;
  };

  const updatePreferences = (newPreferences: Partial<AccessibilityPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  };

  const value: AccessibilityContextValue = {
    announceMessage,
    currentMessage,
    prefersReducedMotion: preferences.prefersReducedMotion,
    prefersHighContrast: preferences.prefersHighContrast,
    prefersLargeText: preferences.prefersLargeText,
    focusOnElement,
    isScreenReaderActive,
    updatePreferences,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      
      {/* Global live region for announcements */}
      <LiveRegion 
        message={currentMessage} 
        politeness="polite"
        className="sr-only"
      />
      
      {/* Global accessibility CSS */}
      <style>{`
        /* Reduce motion when requested */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        
        /* High contrast mode */
        .high-contrast {
          --tw-bg-opacity: 1;
          --tw-text-opacity: 1;
        }
        
        .high-contrast * {
          border-color: currentColor !important;
        }
        
        .high-contrast button,
        .high-contrast a {
          outline: 2px solid currentColor;
          outline-offset: 2px;
        }
        
        /* Large text mode */
        .large-text {
          font-size: 1.2em;
          line-height: 1.6;
        }
        
        .large-text h1 { font-size: 2.4em; }
        .large-text h2 { font-size: 2em; }
        .large-text h3 { font-size: 1.6em; }
        .large-text h4 { font-size: 1.4em; }
        .large-text h5 { font-size: 1.2em; }
        .large-text h6 { font-size: 1.1em; }
        
        /* Focus indicators */
        .show-focus-indicators *:focus {
          outline: 2px solid #a855f7;
          outline-offset: 2px;
        }
        
        .show-focus-indicators button:focus,
        .show-focus-indicators a:focus,
        .show-focus-indicators input:focus,
        .show-focus-indicators textarea:focus,
        .show-focus-indicators select:focus {
          box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.5);
        }
        
        /* Screen reader only content */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
        
        /* Content becomes visible when focused */
        .sr-only:focus {
          position: static;
          width: auto;
          height: auto;
          padding: 0.5rem;
          margin: 0;
          overflow: visible;
          clip: auto;
          white-space: normal;
        }
      `}</style>
    </AccessibilityContext.Provider>
  );
};