/**
 * Modal Component - World-class modal implementation
 * Unified modal component with accessibility and animation support
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { colors, spacing, borderRadius, shadows, zIndex, animations } from '../tokens';

// Modal size types
type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'auth' | 'full' | 'top-right';

// Modal props interface
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: ModalSize;
  title?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  preventScroll?: boolean;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

// Size configurations
const sizeConfig: Record<ModalSize, string> = {
  sm: 'w-full max-w-md',
  md: 'w-full max-w-lg',
  lg: 'w-full max-w-2xl',
  xl: 'w-full max-w-4xl',
  auth: 'w-full',
  full: 'w-full h-full max-w-none',
};

// Close button component
const CloseButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
    aria-label="Close modal"
  >
    <svg
      className="w-5 h-5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path d="M6 18L18 6M6 6l12 12"></path>
    </svg>
  </button>
);

// Modal header component
const ModalHeader: React.FC<{ title?: string; children?: React.ReactNode; showCloseButton?: boolean; onClose?: () => void }> = ({ 
  title, 
  children, 
  showCloseButton, 
  onClose 
}) => {
  if (!title && !children) return null;
  
  return (
    <div className="flex items-center justify-between p-6 border-b border-gray-200">
      <div className="flex-1">
        {title ? (
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        ) : children}
      </div>
      {showCloseButton && onClose && <CloseButton onClick={onClose} />}
    </div>
  );
};

// Enterprise-grade modal footer component
const ModalFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    padding: '16px 24px 24px 24px',
    borderTop: '1px solid rgba(0, 0, 0, 0.1)',
    backgroundColor: '#f9fafb',
    borderBottomLeftRadius: '12px',
    borderBottomRightRadius: '12px',
  }}>
    {children}
  </div>
);

// Main Modal component
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  size = 'md',
  title,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  preventScroll = true,
  children,
  className,
  overlayClassName,
  contentClassName,
  header,
  footer,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  
  // Handle escape key
  const handleEscape = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && closeOnEscape) {
      onClose();
    }
  }, [onClose, closeOnEscape]);
  
  // Handle overlay click
  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === overlayRef.current) {
      onClose();
    }
  }, [onClose, closeOnOverlayClick]);
  
  // Focus management
  const focusableElementsString = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
  
  const trapFocus = useCallback((event: KeyboardEvent) => {
    if (!modalRef.current) return;
    
    const focusableElements = modalRef.current.querySelectorAll(focusableElementsString);
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    if (event.key === 'Tab') {
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          event.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          event.preventDefault();
        }
      }
    }
  }, []);
  
  // Effects
  useEffect(() => {
    if (isOpen) {
      // Prevent scroll
      if (preventScroll) {
        document.body.style.overflow = 'hidden';
      }
      
      // Add event listeners
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', trapFocus);
      
      // Focus first focusable element
      setTimeout(() => {
        const firstFocusable = modalRef.current?.querySelector(focusableElementsString) as HTMLElement;
        firstFocusable?.focus();
      }, 100);
      
      return () => {
        // Clean up
        if (preventScroll) {
          document.body.style.overflow = '';
        }
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('keydown', trapFocus);
      };
    }
  }, [isOpen, handleEscape, trapFocus, preventScroll]);
  
  // Add CSS animations - using a single useEffect that always runs
  React.useEffect(() => {
    if (!isOpen) return;
    
    // Check if styles already exist
    const existingStyle = document.getElementById('modal-animations');
    if (existingStyle) return;
    
    const style = document.createElement('style');
    style.id = 'modal-animations';
    style.textContent = `
      @keyframes overlayFadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      
      @keyframes modalSlideIn {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  // Calculate the current viewport center dynamically for enterprise-grade positioning
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  // Enterprise-grade overlay with proper viewport centering
  const overlayStyles = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: Math.max(document.documentElement.scrollHeight, viewportHeight),
    zIndex: 99999,
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    pointerEvents: 'auto' as const,
  };
  
  // Enterprise-grade modal positioning with proper constraints
  const getModalStyles = () => {
    // Responsive width based on size (matching middle panel max-w-2xl = 672px)
    const sizeWidths = {
      sm: 400,
      md: 500, 
      lg: 672, // Match middle panel max-w-2xl
      xl: 672, // Match middle panel max-w-2xl  
      auth: 672, // Match middle panel max-w-2xl for consistency
    };
    
    const modalWidth = Math.min(sizeWidths[size] || sizeWidths.md, viewportWidth * 0.9);
    const modalHeight = Math.min(700, viewportHeight * 0.9);
    
    const centerTop = scrollTop + (viewportHeight / 2) - (modalHeight / 2);
    const centerLeft = scrollLeft + (viewportWidth / 2) - (modalWidth / 2);

    const baseModalStyles = {
      position: 'absolute' as const,
      top: `${centerTop}px`,
      left: `${centerLeft}px`,
      width: `${modalWidth}px`,
      maxHeight: `${modalHeight}px`,
      background: 'white',
      borderRadius: 12,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      border: '1px solid rgba(0, 0, 0, 0.05)',
      padding: 0,
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
    };

    if (size === 'full') {
      return {
        ...baseModalStyles,
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 0,
        width: '100vw',
        maxHeight: '100vh',
        borderRadius: 0,
      };
    }
    
    if (size === 'top-right') {
      return {
        ...baseModalStyles,
        position: 'fixed' as const,
        top: '20px',
        right: '20px',
        margin: 0,
        width: '400px',
      };
    }
    
    return baseModalStyles;
  };
  
  const modalStyles = getModalStyles();
  
  const modalContent = (
    <div
      ref={overlayRef}
      style={overlayStyles}
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        style={modalStyles}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Enterprise-grade header */}
        {(header || title || showCloseButton) && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)', 
            padding: '24px 24px 16px 24px',
            minHeight: '64px'
          }}>
            <div style={{ fontWeight: 600, fontSize: 18, color: '#1f2937', lineHeight: 1.4 }}>
              {header || title}
            </div>
            {showCloseButton && (
              <button
                style={{ 
                  color: '#6b7280', 
                  background: 'none', 
                  border: 'none', 
                  borderRadius: '6px', 
                  width: 32, 
                  height: 32, 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  fontSize: '20px',
                  fontWeight: 400
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.color = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#6b7280';
                }}
                onClick={onClose}
                aria-label="Close modal"
              >
                ×
              </button>
            )}
          </div>
        )}
        
        {/* Enterprise-grade content area */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: footer ? '24px' : '24px 24px 32px 24px',
          minHeight: 0,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 0, 0, 0.2) transparent',
        }}>
          {children}
        </div>
        
        {/* Footer */}
        {footer && <ModalFooter>{footer}</ModalFooter>}
      </div>
    </div>
  );
  
  // Render modal in portal
  return createPortal(modalContent, document.body);
};

// Modal hook for easier state management
export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = React.useState(initialState);
  
  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);
  const toggleModal = useCallback(() => setIsOpen(prev => !prev), []);
  
  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
  };
};

// Confirmation Modal component
export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      header={
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>
      }
      footer={
        <div className="flex justify-end space-x-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 transition-all duration-200"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={clsx(
              'px-4 py-2 text-sm font-semibold text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200 transform hover:scale-105',
              {
                'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:ring-blue-500 shadow-lg hover:shadow-xl': variant === 'default',
                'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 focus:ring-red-500 shadow-lg hover:shadow-xl': variant === 'destructive',
              }
            )}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Loading...
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      }
    >
      <div className="px-6 py-6">
        <p className="text-gray-900 font-medium text-base leading-relaxed">{message}</p>
      </div>
    </Modal>
  );
};

// Alert Modal component
export interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
  actionText?: string;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  variant = 'info',
  actionText = 'OK',
}) => {
  const iconColors = {
    info: 'text-blue-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
  };
  
  const icons = {
    info: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    error: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
      footer={
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {actionText}
          </button>
        </div>
      }
    >
      <div className="flex items-start space-x-4">
        <div className={clsx('flex-shrink-0', iconColors[variant])}>
          {icons[variant]}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    </Modal>
  );
};

export default Modal;