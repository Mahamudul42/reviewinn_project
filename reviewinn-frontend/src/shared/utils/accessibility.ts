// Accessibility utility functions and constants

// WCAG 2.1 AA color contrast ratios
export const CONTRAST_RATIOS = {
  AA_NORMAL: 4.5,    // Normal text
  AA_LARGE: 3,       // Large text (18px+ or 14px+ bold)
  AAA_NORMAL: 7,     // Enhanced normal text
  AAA_LARGE: 4.5,    // Enhanced large text
} as const;

// Common ARIA attributes for different UI patterns
export const ARIA_PATTERNS = {
  // Button patterns
  TOGGLE_BUTTON: {
    role: 'button',
    'aria-pressed': 'false', // Should be updated dynamically
  },
  
  // Menu patterns  
  MENU: {
    role: 'menu',
    'aria-orientation': 'vertical',
  },
  MENU_ITEM: {
    role: 'menuitem',
    tabIndex: -1,
  },
  
  // Listbox patterns
  LISTBOX: {
    role: 'listbox',
    'aria-activedescendant': '', // Should be updated dynamically
  },
  OPTION: {
    role: 'option',
    'aria-selected': 'false',
  },
  
  // Tab patterns
  TAB_LIST: {
    role: 'tablist',
  },
  TAB: {
    role: 'tab',
    'aria-selected': 'false',
    'aria-controls': '', // Should reference tabpanel
  },
  TAB_PANEL: {
    role: 'tabpanel',
    'aria-labelledby': '', // Should reference tab
  },
  
  // Alert patterns
  ALERT: {
    role: 'alert',
    'aria-live': 'assertive',
    'aria-atomic': 'true',
  },
  STATUS: {
    role: 'status',
    'aria-live': 'polite',
    'aria-atomic': 'true',
  },
} as const;

// Keyboard event handlers
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  TAB: 'Tab',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const;

// Generate unique IDs for accessibility
export const generateId = (prefix: string = 'a11y'): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
};

// Check if element is visible to screen readers
export const isElementVisible = (element: HTMLElement): boolean => {
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.offsetParent !== null &&
    !element.hasAttribute('aria-hidden') &&
    element.getAttribute('aria-hidden') !== 'true'
  );
};

// Get all focusable elements within a container
export const getFocusableElements = (
  container: HTMLElement,
  includeHidden: boolean = false
): HTMLElement[] => {
  const selectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])', 
    'textarea:not([disabled])',
    'a[href]',
    'area[href]',
    '[tabindex]:not([tabindex="-1"])',
    'summary',
    '[contenteditable="true"]',
    'audio[controls]',
    'video[controls]',
    'iframe',
    'embed',
    'object',
  ];

  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(selectors.join(','))
  );

  if (includeHidden) {
    return elements;
  }

  return elements.filter(isElementVisible);
};

// Focus management utilities
export const focusElement = (element: HTMLElement | null, options?: FocusOptions): boolean => {
  if (!element || !isElementVisible(element)) return false;
  
  try {
    element.focus(options);
    return document.activeElement === element;
  } catch (error) {
    console.warn('Failed to focus element:', error);
    return false;
  }
};

export const focusFirstElement = (container: HTMLElement): boolean => {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length > 0) {
    return focusElement(focusableElements[0]);
  }
  return false;
};

export const focusLastElement = (container: HTMLElement): boolean => {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length > 0) {
    return focusElement(focusableElements[focusableElements.length - 1]);
  }
  return false;
};

// Announce to screen readers
export const announceToScreenReader = (
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Debounced announcements to prevent spam
let announcementTimeout: NodeJS.Timeout;

export const debouncedAnnounce = (
  message: string,
  delay: number = 500,
  priority: 'polite' | 'assertive' = 'polite'
): void => {
  clearTimeout(announcementTimeout);
  announcementTimeout = setTimeout(() => {
    announceToScreenReader(message, priority);
  }, delay);
};

// Roving tabindex management
export class RovingTabIndex {
  private container: HTMLElement;
  private items: HTMLElement[];
  private currentIndex: number = 0;

  constructor(container: HTMLElement, itemSelector: string) {
    this.container = container;
    this.items = Array.from(container.querySelectorAll<HTMLElement>(itemSelector));
    this.init();
  }

  private init(): void {
    this.items.forEach((item, index) => {
      item.setAttribute('tabindex', index === 0 ? '0' : '-1');
      
      item.addEventListener('keydown', (event) => {
        this.handleKeyDown(event as KeyboardEvent, index);
      });
      
      item.addEventListener('focus', () => {
        this.setCurrentIndex(index);
      });
    });
  }

  private handleKeyDown(event: KeyboardEvent, index: number): void {
    let newIndex = index;

    switch (event.key) {
      case KEYBOARD_KEYS.ARROW_RIGHT:
      case KEYBOARD_KEYS.ARROW_DOWN:
        event.preventDefault();
        newIndex = (index + 1) % this.items.length;
        break;
      
      case KEYBOARD_KEYS.ARROW_LEFT:
      case KEYBOARD_KEYS.ARROW_UP:
        event.preventDefault();
        newIndex = (index - 1 + this.items.length) % this.items.length;
        break;
      
      case KEYBOARD_KEYS.HOME:
        event.preventDefault();
        newIndex = 0;
        break;
      
      case KEYBOARD_KEYS.END:
        event.preventDefault();
        newIndex = this.items.length - 1;
        break;
      
      default:
        return;
    }

    this.focusItem(newIndex);
  }

  private setCurrentIndex(index: number): void {
    this.currentIndex = index;
    this.items.forEach((item, i) => {
      item.setAttribute('tabindex', i === index ? '0' : '-1');
    });
  }

  public focusItem(index: number): void {
    if (index >= 0 && index < this.items.length) {
      this.setCurrentIndex(index);
      this.items[index].focus();
    }
  }

  public updateItems(itemSelector: string): void {
    this.items = Array.from(this.container.querySelectorAll<HTMLElement>(itemSelector));
    this.init();
  }
}

// Color contrast calculation (simplified)
export const calculateContrast = (color1: string, color2: string): number => {
  // This is a simplified version. In production, you'd want a more robust implementation
  // that can handle different color formats (hex, rgb, hsl, etc.)
  
  const getLuminance = (color: string): number => {
    // Simplified luminance calculation
    // This should be replaced with a proper implementation
    return 0.5; // Placeholder
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

// Validate color contrast
export const meetsContrastRequirement = (
  foreground: string,
  background: string,
  level: keyof typeof CONTRAST_RATIOS = 'AA_NORMAL'
): boolean => {
  const contrast = calculateContrast(foreground, background);
  return contrast >= CONTRAST_RATIOS[level];
};

// Screen reader detection (basic)
export const isScreenReaderActive = (): boolean => {
  // This is a basic detection and may not work in all cases
  return (
    window.navigator.userAgent.includes('NVDA') ||
    window.navigator.userAgent.includes('JAWS') ||
    window.speechSynthesis?.getVoices().length > 0 ||
    'speechSynthesis' in window
  );
};

// Reduced motion detection
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// High contrast detection
export const prefersHighContrast = (): boolean => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};

// Touch device detection
export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};