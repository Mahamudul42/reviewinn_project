import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Bell, 
  Check, 
  User, 
  MessageCircle, 
  Award, 
  RotateCcw,
  CheckCircle,
  Filter,
  Clock,
  Users
} from 'lucide-react';
import { useModal } from '../../../shared/hooks/useModal';

interface NotificationFilters {
  readStatus?: 'all' | 'unread' | 'read';
  notificationType?: 'all' | 'circle' | 'review' | 'gamification' | 'social';
}

interface NotificationFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: NotificationFilters;
  onFiltersChange: (filters: NotificationFilters) => void;
  onApplyFilters: () => void;
  filterStats: {
    all: number;
    unread: number;
    read: number;
    circle: number;
    review: number;
    gamification: number;
    social: number;
  };
}

const NotificationFilterModal: React.FC<NotificationFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onApplyFilters,
  filterStats
}) => {
  const [localFilters, setLocalFilters] = useState<NotificationFilters>(filters);

  const { handleBackdropClick, backdropStyles, getModalContentStyles } = useModal(isOpen, onClose);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof NotificationFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApplyFilters();
    onClose();
  };

  const handleClear = () => {
    const clearedFilters: NotificationFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    return Object.values(localFilters).filter(value => 
      value !== undefined && value !== null && value !== '' && value !== 'all'
    ).length;
  };

  const getReadStatusOptions = () => {
    return [
      { value: 'all', label: 'All', count: filterStats.all, icon: <Bell style={{ width: '16px', height: '16px' }} /> },
      { value: 'unread', label: 'Unread', count: filterStats.unread, icon: <div className="w-2 h-2 bg-blue-600 rounded-full"></div> },
      { value: 'read', label: 'Read', count: filterStats.read, icon: <Check style={{ width: '16px', height: '16px' }} /> },
    ];
  };

  const getNotificationTypeOptions = () => {
    return [
      { value: 'all', label: 'All Types', count: filterStats.all, icon: <Bell style={{ width: '16px', height: '16px' }} /> },
      { value: 'circle', label: 'Circle', count: filterStats.circle, icon: <Users style={{ width: '16px', height: '16px' }} /> },
      { value: 'review', label: 'Reviews', count: filterStats.review, icon: <MessageCircle style={{ width: '16px', height: '16px' }} /> },
      { value: 'gamification', label: 'Achievements', count: filterStats.gamification, icon: <Award style={{ width: '16px', height: '16px' }} /> },
      { value: 'social', label: 'Social', count: filterStats.social, icon: <User style={{ width: '16px', height: '16px' }} /> },
    ];
  };

  if (!isOpen) return null;

  const contentStyles = getModalContentStyles({
    maxWidth: 500,
    minWidth: 400,
    minHeight: 300,
  });

  return createPortal(
    <div
      style={backdropStyles}
      onClick={handleBackdropClick}
    >
      <div 
        style={{
          ...contentStyles,
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 40px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Simple Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          borderBottom: '1px solid #eee', 
          padding: '20px 24px 12px 24px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Filter style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
            <span style={{ fontWeight: 700, fontSize: 18, color: '#222' }}>Filter Notifications</span>
          </div>
          <button
            style={{ 
              color: '#888', 
              fontSize: 28, 
              fontWeight: 700, 
              background: 'none', 
              border: 'none', 
              borderRadius: 999, 
              width: 36, 
              height: 36, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '0 24px 24px 24px' 
        }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <p style={{ color: '#666', fontSize: 14, margin: '8px 0' }}>
              Filter your notifications by status and type
            </p>
          </div>

          {/* Read Status Filter */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: 600, 
              color: '#374151', 
              margin: '0 0 12px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Clock style={{ width: '16px', height: '16px' }} />
              Read Status
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {getReadStatusOptions().map(option => (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange('readStatus', 
                    localFilters.readStatus === option.value ? 'all' : option.value
                  )}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: localFilters.readStatus === option.value ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    background: localFilters.readStatus === option.value ? '#eff6ff' : '#fff',
                    color: localFilters.readStatus === option.value ? '#1d4ed8' : '#374151',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '14px',
                    fontWeight: localFilters.readStatus === option.value ? 600 : 400
                  }}
                  onMouseOver={e => {
                    if (localFilters.readStatus !== option.value) {
                      e.currentTarget.style.background = '#f9fafb';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                  onMouseOut={e => {
                    if (localFilters.readStatus !== option.value) {
                      e.currentTarget.style.background = '#fff';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {option.icon}
                    <span>{option.label}</span>
                  </div>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#6b7280', 
                    background: '#f3f4f6', 
                    padding: '2px 6px', 
                    borderRadius: '12px' 
                  }}>
                    {option.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Notification Type Filter */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: 600, 
              color: '#374151', 
              margin: '0 0 12px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Bell style={{ width: '16px', height: '16px' }} />
              Notification Type
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {getNotificationTypeOptions().map(option => (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange('notificationType', 
                    localFilters.notificationType === option.value ? 'all' : option.value
                  )}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: localFilters.notificationType === option.value ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    background: localFilters.notificationType === option.value ? '#eff6ff' : '#fff',
                    color: localFilters.notificationType === option.value ? '#1d4ed8' : '#374151',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '14px',
                    fontWeight: localFilters.notificationType === option.value ? 600 : 400
                  }}
                  onMouseOver={e => {
                    if (localFilters.notificationType !== option.value) {
                      e.currentTarget.style.background = '#f9fafb';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                  onMouseOut={e => {
                    if (localFilters.notificationType !== option.value) {
                      e.currentTarget.style.background = '#fff';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {option.icon}
                    <span>{option.label}</span>
                  </div>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#6b7280', 
                    background: '#f3f4f6', 
                    padding: '2px 6px', 
                    borderRadius: '12px' 
                  }}>
                    {option.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Simple Footer */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '16px 24px', 
          borderTop: '1px solid #eee',
          background: '#f9fafb'
        }}>
          <button
            onClick={handleClear}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              color: '#6b7280',
              background: '#fff',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '14px',
              fontWeight: '500'
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.borderColor = '#9ca3af';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            <RotateCcw style={{ width: '14px', height: '14px' }} />
            Clear
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                color: '#6b7280',
                background: '#fff',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '14px',
                fontWeight: '500'
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.borderColor = '#9ca3af';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontWeight: '600',
                fontSize: '14px'
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = '#2563eb';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <CheckCircle style={{ width: '14px', height: '14px' }} />
              Apply {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NotificationFilterModal;