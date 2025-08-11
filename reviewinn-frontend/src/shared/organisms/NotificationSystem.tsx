import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number; // in milliseconds, 0 means persistent
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationSystemProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ 
  notifications, 
  onDismiss 
}) => {
  useEffect(() => {
    notifications.forEach(notification => {
      if (notification.duration && notification.duration > 0) {
        const timer = setTimeout(() => {
          onDismiss(notification.id);
        }, notification.duration);

        return () => clearTimeout(timer);
      }
    });
  }, [notifications, onDismiss]);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'info':
      default:
        return <Info size={20} />;
    }
  };

  const getTypeClass = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'notification-success';
      case 'error':
        return 'notification-error';
      case 'warning':
        return 'notification-warning';
      case 'info':
      default:
        return 'notification-info';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification ${getTypeClass(notification.type)}`}
        >
          <div className="notification-icon">
            {getIcon(notification.type)}
          </div>
          
          <div className="notification-content">
            <h4 className="notification-title">{notification.title}</h4>
            <p className="notification-message">{notification.message}</p>
            
            {notification.action && (
              <button
                onClick={notification.action.onClick}
                className="notification-action"
              >
                {notification.action.label}
              </button>
            )}
          </div>

          <button
            onClick={() => onDismiss(notification.id)}
            className="notification-dismiss"
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      ))}

      <style>{`
        .notification-container {
          position: fixed;
          top: 1rem;
          right: 1rem;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-width: 400px;
          width: 100%;
        }

        .notification {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
          background: var(--card-bg);
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          border-left: 4px solid;
          animation: slideIn 0.3s ease-out;
        }

        .notification-success {
          border-left-color: var(--success-color);
        }

        .notification-error {
          border-left-color: var(--error-color);
        }

        .notification-warning {
          border-left-color: #f59e0b;
        }

        .notification-info {
          border-left-color: var(--primary-color);
        }

        .notification-icon {
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .notification-success .notification-icon {
          color: var(--success-color);
        }

        .notification-error .notification-icon {
          color: var(--error-color);
        }

        .notification-warning .notification-icon {
          color: #f59e0b;
        }

        .notification-info .notification-icon {
          color: var(--primary-color);
        }

        .notification-content {
          flex: 1;
          min-width: 0;
        }

        .notification-title {
          margin: 0 0 0.25rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .notification-message {
          margin: 0;
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .notification-action {
          margin-top: 0.5rem;
          padding: 0.25rem 0.75rem;
          background: none;
          border: 1px solid var(--primary-color);
          border-radius: 4px;
          color: var(--primary-color);
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .notification-action:hover {
          background: var(--primary-color);
          color: white;
        }

        .notification-dismiss {
          flex-shrink: 0;
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .notification-dismiss:hover {
          background: var(--border-color);
          color: var(--text-primary);
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @media (max-width: 480px) {
          .notification-container {
            top: 0.5rem;
            right: 0.5rem;
            left: 0.5rem;
            max-width: none;
          }

          .notification {
            padding: 0.75rem;
          }

          .notification-title {
            font-size: 0.8rem;
          }

          .notification-message {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

// Hook for managing notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000 // Default 5 seconds
    };
    
    setNotifications(prev => [...prev, newNotification]);
    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Convenience methods
  const showSuccess = (title: string, message: string, duration?: number) => {
    return addNotification({ type: 'success', title, message, duration });
  };

  const showError = (title: string, message: string, duration?: number) => {
    return addNotification({ type: 'error', title, message, duration });
  };

  const showInfo = (title: string, message: string, duration?: number) => {
    return addNotification({ type: 'info', title, message, duration });
  };

  const showWarning = (title: string, message: string, duration?: number) => {
    return addNotification({ type: 'warning', title, message, duration });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showInfo,
    showWarning
  };
};

export default NotificationSystem;
