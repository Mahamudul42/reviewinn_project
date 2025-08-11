import React, { useState, useCallback, createContext, useContext } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info, X, MessageSquare } from 'lucide-react';

export type ConfirmationType = 'confirm' | 'warning' | 'error' | 'success' | 'info';
export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ConfirmationOptions {
  title: string;
  message: string;
  type?: ConfirmationType;
  confirmText?: string;
  cancelText?: string;
  confirmButtonVariant?: 'danger' | 'primary' | 'success';
}

interface PromptOptions {
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  required?: boolean;
}

interface ToastState {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  isVisible: boolean;
}

interface ConfirmationContextType {
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const ConfirmationContext = createContext<ConfirmationContextType | null>(null);

const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: ConfirmationType;
  confirmText?: string;
  cancelText?: string;
  confirmButtonVariant?: 'danger' | 'primary' | 'success';
}> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'confirm',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonVariant = 'primary'
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return React.createElement(AlertTriangle, { className: "w-6 h-6 text-amber-500" });
      case 'error':
        return React.createElement(XCircle, { className: "w-6 h-6 text-red-500" });
      case 'success':
        return React.createElement(CheckCircle, { className: "w-6 h-6 text-green-500" });
      case 'info':
        return React.createElement(Info, { className: "w-6 h-6 text-blue-500" });
      default:
        return React.createElement(AlertTriangle, { className: "w-6 h-6 text-gray-500" });
    }
  };

  const getConfirmButtonClasses = () => {
    switch (confirmButtonVariant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white';
      default:
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white';
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return React.createElement('div', 
    {
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.5)',
        pointerEvents: 'auto',
      },
      onClick: handleBackdropClick
    },
    React.createElement('div', 
      {
        style: {
          background: 'white',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '500px',
          width: '90%',
          maxHeight: 'calc(100vh - 40px)',
          overflow: 'auto',
          position: 'relative',
          zIndex: 100000,
        },
        onClick: (e: React.MouseEvent) => e.stopPropagation()
      },
      React.createElement('div', { className: "sm:flex sm:items-start" },
        React.createElement('div', 
          { className: "mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 sm:mx-0 sm:h-10 sm:w-10" },
          getIcon()
        ),
        React.createElement('div', { className: "mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full" },
          React.createElement('div', { className: "flex items-center justify-between" },
            React.createElement('h3', { className: "text-lg leading-6 font-medium text-gray-900" }, title),
            React.createElement('button', 
              {
                onClick: onClose,
                className: "text-gray-400 hover:text-gray-600 transition-colors"
              },
              React.createElement(X, { className: "w-5 h-5" })
            )
          ),
          React.createElement('div', { className: "mt-2" },
            React.createElement('p', { className: "text-sm text-gray-500" }, message)
          )
        )
      ),
      React.createElement('div', { className: "mt-5 sm:mt-4 sm:flex sm:flex-row-reverse" },
        React.createElement('button', 
          {
            type: "button",
            className: `w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${getConfirmButtonClasses()}`,
            onClick: onConfirm
          },
          confirmText
        ),
        React.createElement('button', 
          {
            type: "button",
            className: "mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm",
            onClick: onClose
          },
          cancelText
        )
      )
    )
  );
};

const PromptModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  required?: boolean;
}> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  placeholder = 'Enter text...',
  defaultValue = '',
  confirmText = 'Submit',
  cancelText = 'Cancel',
  required = false
}) => {
  const [value, setValue] = useState(defaultValue);

  React.useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (required && !value.trim()) return;
    onConfirm(value);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return React.createElement('div', 
    {
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.5)',
        pointerEvents: 'auto',
      },
      onClick: handleBackdropClick
    },
    React.createElement('div', 
      {
        style: {
          background: 'white',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '500px',
          width: '90%',
          maxHeight: 'calc(100vh - 40px)',
          overflow: 'auto',
          position: 'relative',
          zIndex: 100000,
        },
        onClick: (e: React.MouseEvent) => e.stopPropagation()
      },
      React.createElement('form', { onSubmit: handleSubmit },
        React.createElement('div', { className: "sm:flex sm:items-start" },
          React.createElement('div', 
            { className: "mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10" },
            React.createElement(MessageSquare, { className: "w-6 h-6 text-blue-600" })
          ),
          React.createElement('div', { className: "mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full" },
            React.createElement('div', { className: "flex items-center justify-between" },
              React.createElement('h3', { className: "text-lg leading-6 font-medium text-gray-900" }, title),
              React.createElement('button', 
                {
                  type: "button",
                  onClick: onClose,
                  className: "text-gray-400 hover:text-gray-600 transition-colors"
                },
                React.createElement(X, { className: "w-5 h-5" })
              )
            ),
            React.createElement('div', { className: "mt-2" },
              React.createElement('p', { className: "text-sm text-gray-500 mb-4" }, message),
              React.createElement('textarea', {
                value: value,
                onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setValue(e.target.value),
                placeholder: placeholder,
                className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-none",
                rows: 3,
                autoFocus: true
              }),
              required && React.createElement('p', { className: "text-xs text-gray-500 mt-1" }, "* This field is required")
            )
          )
        ),
        React.createElement('div', { className: "mt-5 sm:mt-4 sm:flex sm:flex-row-reverse" },
          React.createElement('button', 
            {
              type: "submit",
              disabled: required && !value.trim(),
              className: "w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            },
            confirmText
          ),
          React.createElement('button', 
            {
              type: "button",
              className: "mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm",
              onClick: onClose
            },
            cancelText
          )
        )
      )
    )
  );
};

const NotificationToast: React.FC<{
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
  isVisible: boolean;
}> = ({
  message,
  type,
  duration = 4000,
  onClose,
  isVisible
}) => {
  const [shouldRender, setShouldRender] = useState(isVisible);

  React.useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!shouldRender) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return React.createElement(CheckCircle, { className: "w-5 h-5 text-green-500" });
      case 'error':
        return React.createElement(XCircle, { className: "w-5 h-5 text-red-500" });
      case 'warning':
        return React.createElement(AlertTriangle, { className: "w-5 h-5 text-amber-500" });
      case 'info':
        return React.createElement(Info, { className: "w-5 h-5 text-blue-500" });
      default:
        return React.createElement(Info, { className: "w-5 h-5 text-blue-500" });
    }
  };

  const getBackgroundClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextClasses = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-amber-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  return React.createElement('div', 
    {
      style: {
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 100001,
      }
    },
    React.createElement('div', 
      {
        className: `max-w-sm w-full border rounded-lg shadow-lg p-4 transform transition-all duration-300 ease-in-out ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} ${getBackgroundClasses()}`
      },
      React.createElement('div', { className: "flex items-start" },
        React.createElement('div', { className: "flex-shrink-0" }, getIcon()),
        React.createElement('div', { className: "ml-3 w-0 flex-1" },
          React.createElement('p', { className: `text-sm font-medium ${getTextClasses()}` }, message)
        ),
        React.createElement('div', { className: "ml-4 flex-shrink-0 flex" },
          React.createElement('button', 
            {
              className: "rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
              onClick: onClose
            },
            React.createElement('span', { className: "sr-only" }, "Close"),
            React.createElement(X, { className: "w-4 h-4" })
          )
        )
      )
    )
  );
};

export const ConfirmationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    options: ConfirmationOptions;
    resolve: ((confirmed: boolean) => void) | null;
  }>({
    isOpen: false,
    options: { title: '', message: '' },
    resolve: null
  });

  const [promptState, setPromptState] = useState<{
    isOpen: boolean;
    options: PromptOptions;
    resolve: ((value: string | null) => void) | null;
  }>({
    isOpen: false,
    options: { title: '', message: '' },
    resolve: null
  });

  const [toasts, setToasts] = useState<ToastState[]>([]);

  const confirm = useCallback((options: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmationState({
        isOpen: true,
        options,
        resolve
      });
    });
  }, []);

  const handleConfirmationClose = useCallback(() => {
    if (confirmationState.resolve) {
      confirmationState.resolve(false);
    }
    setConfirmationState(prev => ({ ...prev, isOpen: false, resolve: null }));
  }, [confirmationState.resolve]);

  const handleConfirmationConfirm = useCallback(() => {
    if (confirmationState.resolve) {
      confirmationState.resolve(true);
    }
    setConfirmationState(prev => ({ ...prev, isOpen: false, resolve: null }));
  }, [confirmationState.resolve]);

  const prompt = useCallback((options: PromptOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      setPromptState({
        isOpen: true,
        options,
        resolve
      });
    });
  }, []);

  const handlePromptClose = useCallback(() => {
    if (promptState.resolve) {
      promptState.resolve(null);
    }
    setPromptState(prev => ({ ...prev, isOpen: false, resolve: null }));
  }, [promptState.resolve]);

  const handlePromptConfirm = useCallback((value: string) => {
    if (promptState.resolve) {
      promptState.resolve(value);
    }
    setPromptState(prev => ({ ...prev, isOpen: false, resolve: null }));
  }, [promptState.resolve]);

  const showToast = useCallback((message: string, type: ToastType, duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastState = {
      id,
      message,
      type,
      duration,
      isVisible: true
    };

    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      setToasts(prev => prev.map(toast => 
        toast.id === id ? { ...toast, isVisible: false } : toast
      ));
      
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, 300);
    }, newToast.duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, isVisible: false } : toast
    ));
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 300);
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  const contextValue: ConfirmationContextType = {
    confirm,
    prompt,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return React.createElement(ConfirmationContext.Provider, { value: contextValue },
    React.createElement(React.Fragment, {},
      children,
      React.createElement(ConfirmationModal, {
        isOpen: confirmationState.isOpen,
        onClose: handleConfirmationClose,
        onConfirm: handleConfirmationConfirm,
        ...confirmationState.options
      }),
      React.createElement(PromptModal, {
        isOpen: promptState.isOpen,
        onClose: handlePromptClose,
        onConfirm: handlePromptConfirm,
        ...promptState.options
      }),
      React.createElement('div', 
        {
          style: {
            position: 'fixed',
            top: '16px',
            right: '16px',
            zIndex: 100001,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }
        },
        toasts.map((toast) => 
          React.createElement(NotificationToast, {
            key: toast.id,
            message: toast.message,
            type: toast.type,
            duration: toast.duration,
            isVisible: toast.isVisible,
            onClose: () => removeToast(toast.id)
          })
        )
      )
    )
  );
};

export const useConfirmation = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
};