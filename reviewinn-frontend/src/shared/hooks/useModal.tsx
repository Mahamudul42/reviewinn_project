import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Custom hook for managing modal behavior including:
 * - Body scroll prevention
 * - Proper z-index stacking
 * - ESC key handling
 * - Click outside to close
 */
export const useModal = (isOpen: boolean, onClose?: () => void) => {
  // Manage body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'relative';
      
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
      };
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen || !onClose) return;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Modal backdrop click handler
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  // Common modal backdrop styles
  const backdropStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    display: 'flex',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.5)',
    pointerEvents: 'auto',
    padding: '20px',
    boxSizing: 'border-box',
  };

  // Common modal content styles
  const getModalContentStyles = (customStyles?: React.CSSProperties): React.CSSProperties => ({
    background: 'white',
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
    width: '100%',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100vh - 40px)',
    overflow: 'hidden',
    position: 'fixed',
    top: '50vh',
    left: '50vw',
    transform: 'translate(-50%, -50%)',
    zIndex: 100000,
    ...customStyles,
  });

  return {
    handleBackdropClick,
    backdropStyles,
    getModalContentStyles,
  };
};

/**
 * Utility function to create a standardized modal portal
 */
export const createModalPortal = (
  content: React.ReactNode,
  isOpen: boolean,
  backdropStyles: React.CSSProperties,
  handleBackdropClick: (e: React.MouseEvent) => void
) => {
  if (!isOpen) return null;


  return createPortal(
    <div style={backdropStyles} onClick={handleBackdropClick}>
      {content}
    </div>,
    document.body
  );
};