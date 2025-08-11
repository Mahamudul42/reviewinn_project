/**
 * Toast Component - World-class notification system
 * Integrated with global UI store for seamless state management
 */

import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { useToasts, useToastActions, useUIStore } from '../../../stores/uiStore';

// Local Toast type definition to avoid import issues
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface LocalToast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Toast component props
interface ToastProps {
  toast: LocalToast;
  onRemove: (id: string) => void;
}

// Toast icons
const ToastIcons = {
  success: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  ),
};

// Toast color variants
const toastVariants = {
  success: {
    container: 'bg-green-50 border-green-200',
    icon: 'text-green-400',
    title: 'text-green-800',
    message: 'text-green-700',
    button: 'text-green-500 hover:text-green-600',
  },
  error: {
    container: 'bg-red-50 border-red-200',
    icon: 'text-red-400',
    title: 'text-red-800',
    message: 'text-red-700',
    button: 'text-red-500 hover:text-red-600',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200',
    icon: 'text-yellow-400',
    title: 'text-yellow-800',
    message: 'text-yellow-700',
    button: 'text-yellow-500 hover:text-yellow-600',
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-400',
    title: 'text-blue-800',
    message: 'text-blue-700',
    button: 'text-blue-500 hover:text-blue-600',
  },
};

// Individual toast component
const ToastItem: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const variant = toastVariants[toast.type];
  
  // Auto-remove toast after duration
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, toast.duration);
      
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onRemove]);
  
  const handleClose = () => {
    onRemove(toast.id);
  };
  
  const handleAction = () => {
    toast.action?.onClick();
    onRemove(toast.id);
  };
  
  return (
    <div className={clsx(
      'relative w-full max-w-sm overflow-hidden rounded-lg border shadow-lg pointer-events-auto',
      'animate-in slide-in-from-top-2 fade-in duration-300',
      variant.container
    )}>
      <div className="p-4">
        <div className="flex items-start">
          {/* Icon */}
          <div className={clsx('flex-shrink-0', variant.icon)}>
            {ToastIcons[toast.type]}
          </div>
          
          {/* Content */}
          <div className="ml-3 w-0 flex-1">
            <p className={clsx('text-sm font-medium', variant.title)}>
              {toast.title}
            </p>
            {toast.message && (
              <p className={clsx('mt-1 text-sm', variant.message)}>
                {toast.message}
              </p>
            )}
            
            {/* Action button */}
            {toast.action && (
              <div className="mt-3">
                <button
                  onClick={handleAction}
                  className={clsx(
                    'text-sm font-medium underline transition-colors duration-200',
                    variant.button
                  )}
                >
                  {toast.action.label}
                </button>
              </div>
            )}
          </div>
          
          {/* Close button */}
          <div className="ml-4 flex flex-shrink-0">
            <button
              onClick={handleClose}
              className={clsx(
                'inline-flex rounded-md p-1.5 transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                variant.button,
                {
                  'focus:ring-green-500': toast.type === 'success',
                  'focus:ring-red-500': toast.type === 'error',
                  'focus:ring-yellow-500': toast.type === 'warning',
                  'focus:ring-blue-500': toast.type === 'info',
                }
              )}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Toast container component
export const ToastContainer: React.FC = () => {
  const toasts = useToasts();
  const removeToast = useUIStore(state => state.removeToast);
  
  if (toasts.length === 0) {
    return null;
  }
  
  return createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast as LocalToast}
          onRemove={removeToast}
        />
      ))}
    </div>,
    document.body
  );
};

// Toast hook for easier usage
export const useToast = () => {
  const addToast = useUIStore(state => state.addToast);
  const removeToast = useUIStore(state => state.removeToast);
  const clearToasts = useUIStore(state => state.clearToasts);
  
  const success = useCallback((title: string, message?: string, options?: Partial<LocalToast>) => {
    addToast({ type: 'success', title, message, ...options });
  }, [addToast]);
  
  const error = useCallback((title: string, message?: string, options?: Partial<LocalToast>) => {
    addToast({ type: 'error', title, message, ...options });
  }, [addToast]);
  
  const warning = useCallback((title: string, message?: string, options?: Partial<LocalToast>) => {
    addToast({ type: 'warning', title, message, ...options });
  }, [addToast]);
  
  const info = useCallback((title: string, message?: string, options?: Partial<LocalToast>) => {
    addToast({ type: 'info', title, message, ...options });
  }, [addToast]);
  
  const custom = useCallback((toast: Omit<LocalToast, 'id'>) => {
    addToast(toast);
  }, [addToast]);
  
  return {
    success,
    error,
    warning,
    info,
    custom,
    remove: removeToast,
    clear: clearToasts,
  };
};

// Progress toast with auto-remove based on promise
export const usePromiseToast = () => {
  const addToast = useUIStore(state => state.addToast);
  const removeToast = useUIStore(state => state.removeToast);
  
  return {
    promise: async <T,>(
      promise: Promise<T>,
      {
        loading = 'Loading...',
        success = 'Success!',
        error = 'Something went wrong',
      }: {
        loading?: string;
        success?: string | ((data: T) => string);
        error?: string | ((error: any) => string);
      } = {}
    ): Promise<T> => {
      const loadingToast = Math.random().toString(36).substr(2, 9);
      
      // Show loading toast
      addToast({
        type: 'info',
        title: loading,
        id: loadingToast,
        duration: 0, // Don't auto-remove
      });
      
      try {
        const result = await promise;
        
        // Remove loading toast
        removeToast(loadingToast);
        
        // Show success toast
        const successMessage = typeof success === 'function' ? success(result) : success;
        addToast({ type: 'success', title: successMessage });
        
        return result;
      } catch (err) {
        // Remove loading toast
        removeToast(loadingToast);
        
        // Show error toast
        const errorMessage = typeof error === 'function' ? error(err) : error;
        addToast({ type: 'error', title: errorMessage });
        
        throw err;
      }
    },
  };
};

export default ToastContainer;