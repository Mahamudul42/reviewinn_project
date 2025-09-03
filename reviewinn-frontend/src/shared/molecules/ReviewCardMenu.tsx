import React, { useEffect, useRef } from 'react';
import { Flag, Trash2, Edit, Share2 } from 'lucide-react';

interface ReviewCardMenuProps {
  open: boolean;
  onClose: () => void;
  triggerId?: string;
}

const ReviewCardMenu: React.FC<ReviewCardMenuProps> = ({ open, onClose, triggerId }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    } else if (event.key === 'Tab') {
      // Keep focus within menu
      const focusableElements = menuRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled])'
      );
      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  };
  // Focus management
  useEffect(() => {
    if (open && menuRef.current) {
      const firstButton = menuRef.current.querySelector('button');
      if (firstButton) {
        (firstButton as HTMLElement).focus();
      }
    }
  }, [open]);

  // Return focus to trigger when closed
  useEffect(() => {
    return () => {
      if (!open && triggerId) {
        const trigger = document.getElementById(triggerId);
        if (trigger) {
          trigger.focus();
        }
      }
    };
  }, [open, triggerId]);

  if (!open) return null;

  const menuItems = [
    { icon: Edit, label: 'Edit Review', action: () => console.log('Edit review') },
    { icon: Share2, label: 'Share Review', action: () => console.log('Share review') },
    { icon: Flag, label: 'Report Review', action: () => console.log('Report review') },
    { icon: Trash2, label: 'Delete Review', action: () => console.log('Delete review') }
  ];

  return (
    <>
      {/* Backdrop for closing menu */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      <div 
        ref={menuRef}
        className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
        role="menu"
        aria-label="Review actions menu"
        onKeyDown={handleKeyDown}
      >
        <div className="py-1">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.action();
                onClose();
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
              role="menuitem"
              tabIndex={0}
            >
              <item.icon className="h-4 w-4 mr-3" aria-hidden="true" />
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default ReviewCardMenu; 