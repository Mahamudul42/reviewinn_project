/**
 * Enterprise Notification Bell Component
 * Shows in header with real-time unread count
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { enterpriseNotificationService, type NotificationSummary } from '../../api/services/enterpriseNotificationService';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import NotificationDropdown from './NotificationDropdown';

interface NotificationBellProps {
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const { user: currentUser, isAuthenticated } = useUnifiedAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notificationSummary, setNotificationSummary] = useState<NotificationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);

  // Auto-refresh notifications every 60 seconds
  const loadNotificationSummary = useCallback(async () => {
    if (!isAuthenticated || !currentUser) {
      setNotificationSummary(null);
      return;
    }

    try {
      setLoading(true);
      const summary = await enterpriseNotificationService.getNotificationSummary();
      setNotificationSummary(summary);
    } catch (error) {
      console.error('Failed to load notification summary:', error);
      // Don't clear existing data on error to avoid flickering
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentUser]);

  // Load notifications on mount and auth change
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      loadNotificationSummary();
    } else {
      setNotificationSummary(null);
    }
  }, [isAuthenticated, currentUser, loadNotificationSummary]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    const interval = setInterval(loadNotificationSummary, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, currentUser, loadNotificationSummary]);

  // Refresh when dropdown closes (in case notifications were marked as read)
  const handleDropdownClose = useCallback(() => {
    setIsDropdownOpen(false);
    loadNotificationSummary();
  }, [loadNotificationSummary]);

  const handleBellClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Don't render if user is not authenticated
  if (!isAuthenticated || !currentUser) {
    return null;
  }

  const unreadCount = notificationSummary?.total_unread || 0;
  const urgentCount = notificationSummary?.total_urgent || 0;
  const criticalCount = notificationSummary?.total_critical || 0;

  return (
    <>
      <button
        ref={bellRef}
        onClick={handleBellClick}
        className={`relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors ${className}`}
        title={`${unreadCount} unread notifications`}
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />
        
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span 
            className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-xs font-bold text-white rounded-full ${
              criticalCount > 0 
                ? 'bg-red-500 animate-pulse' 
                : urgentCount > 0 
                ? 'bg-orange-500' 
                : 'bg-blue-500'
            }`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* Pulse animation for critical notifications */}
        {criticalCount > 0 && (
          <span className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-red-500 rounded-full animate-ping opacity-75"></span>
        )}
        
        {/* Loading indicator */}
        {loading && unreadCount === 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
        )}
      </button>

      {/* Notification Dropdown */}
      <NotificationDropdown
        isOpen={isDropdownOpen}
        onClose={handleDropdownClose}
        triggerRef={bellRef}
      />
    </>
  );
};

export default NotificationBell;