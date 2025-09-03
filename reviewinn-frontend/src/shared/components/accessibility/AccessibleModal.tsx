import React, { useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import FocusTrap from './FocusTrap';
import ScreenReaderOnly from './ScreenReaderOnly';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  overlayClassName?: string;
  preventScroll?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement>;
  finalFocusRef?: React.RefObject<HTMLElement>;
}

const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
  overlayClassName = '',
  preventScroll = true,
  initialFocusRef,
  finalFocusRef
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = React.useId();

  // Size classes
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg', 
    xl: 'max-w-xl',
    full: 'max-w-full mx-4'
  };

  // Handle body scroll lock
  useEffect(() => {
    if (!preventScroll) return;

    if (isOpen) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen, preventScroll]);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  // Focus management
  useEffect(() => {
    if (!isOpen) return;

    let elementToFocus: HTMLElement | null = null;

    // Focus initial element if provided
    if (initialFocusRef?.current) {
      elementToFocus = initialFocusRef.current;
    } else if (modalRef.current) {
      // Focus first focusable element in modal
      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        elementToFocus = focusableElements[0];
      }
    }

    if (elementToFocus) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        elementToFocus?.focus();
      }, 100);
    }

    return () => {
      // Return focus to final focus ref or triggering element
      if (finalFocusRef?.current) {
        finalFocusRef.current.focus();
      }
    };
  }, [isOpen, initialFocusRef, finalFocusRef]);

  if (!isOpen) {
    return null;
  }

  const modalContent = (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        bg-black bg-opacity-50 backdrop-blur-sm
        ${overlayClassName}
      `}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={handleBackdropClick}
    >
      <FocusTrap isActive={isOpen}>
        <div
          ref={modalRef}
          className={`
            relative bg-white rounded-lg shadow-xl w-full
            transform transition-all duration-200 ease-out
            ${sizeClasses[size]}
            ${className}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Screen reader announcement */}
          <ScreenReaderOnly>
            Dialog opened. {title}. To close this dialog, press Escape.
          </ScreenReaderOnly>

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 id={titleId} className="text-xl font-semibold text-gray-900">
              {title}
            </h2>
            
            <button
              type="button"
              onClick={onClose}
              className="
                p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100
                rounded-full transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
              "
              aria-label="Close dialog"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </FocusTrap>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AccessibleModal;