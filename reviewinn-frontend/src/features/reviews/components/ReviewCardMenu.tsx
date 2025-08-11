import React, { useRef, useState, useEffect } from 'react';
import type { Review } from '../../../types';
import { useUnifiedAuth } from '../../../hooks/useUnifiedAuth';

interface ReviewCardMenuProps {
  open: boolean;
  onClose: () => void;
  onAction?: (action: string) => void;
  menuButtonRef?: React.RefObject<HTMLButtonElement>;
  review?: Review; // Add review prop to check permissions
}

const getMenuOptions = (review?: Review, currentUser?: any, isAuthenticated?: boolean) => {
  const baseOptions = [
    { key: 'interested', icon: '➕', label: 'Interested' },
    { key: 'not_interested', icon: '➖', label: 'Not Interested' },
    { key: 'save', icon: '🔖', label: 'Save Review' },
    { key: 'notify', icon: '🔔', label: 'Turn on Notification' },
    { key: 'block', icon: '🚫', label: 'Block User' },
    { key: 'unfollow', icon: '👋', label: 'Unfollow Entity' },
    { key: 'report', icon: '🚩', label: 'Report Review' }
  ];

  // Check if user can manage this review
  
  if (review && isAuthenticated && currentUser) {
    // Admin users can manage any review
    const isAdmin = currentUser.level >= 50;
    
    // Review creators can manage their own reviews
    const isCreator = (
      review.reviewerId === currentUser.id || 
      String(review.reviewerId) === String(currentUser.id) ||
      review.userId === currentUser.id ||
      String(review.userId) === String(currentUser.id)
    );
    
    // High-level users can manage reviews
    const isHighLevel = currentUser.level >= 10;
    
    if (isAdmin || isCreator || isHighLevel) {
      // Add edit and delete options at the beginning
      return [
        { key: 'edit_review', icon: '✏️', label: 'Edit Review' },
        { key: 'delete_review', icon: '🗑️', label: 'Delete Review' },
        { key: 'divider', icon: '', label: '---' }, // Visual separator
        ...baseOptions
      ];
    }
  }

  return baseOptions;
};

const MENU_WIDTH = 192; // w-48 in px
const MENU_HEIGHT = 7 * 40; // 7 items * ~40px each

const ReviewCardMenu: React.FC<ReviewCardMenuProps> = ({ open, onClose, onAction, menuButtonRef, review }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [show, setShow] = useState(false);
  const { user: currentUser, isAuthenticated } = useUnifiedAuth();
  
  const options = getMenuOptions(review, currentUser, isAuthenticated);

  useEffect(() => {
    if (!open) return;
    setShow(false);
    setTimeout(() => setShow(true), 10); // allow for transition
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && menuButtonRef?.current && !menuButtonRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose, menuButtonRef]);

  // Position the menu anchored to the button
  useEffect(() => {
    if (!open || !menuButtonRef?.current) return;
    const btn = menuButtonRef.current;
    const card = btn.closest('.relative');
    if (!card) return;
    const btnRect = btn.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    // Position absolutely to the right, just below the button
    const top = btn.offsetTop + btn.offsetHeight + 8; // 8px gap below button
    const right = 0;
    setMenuStyle({
      position: 'absolute',
      top,
      right,
      width: MENU_WIDTH,
      zIndex: 50
    });
  }, [open, menuButtonRef]);

  if (!open) return null;
  return (
    <div
      ref={ref}
      className="absolute right-0 mt-2 w-48 z-50"
      style={menuStyle}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-2 animate-fade-in">
        {options.map(opt => {
          if (opt.key === 'divider') {
            return (
              <div
                key={opt.key}
                className="border-t border-gray-200 my-1"
              />
            );
          }
          
          return (
            <button
              key={opt.key}
              className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left transition-colors duration-150 ease-in-out border-b border-gray-100 last:border-b-0 font-medium text-gray-800 truncate ${
                opt.key === 'edit_review' ? 'text-blue-700 hover:bg-blue-50' :
                opt.key === 'delete_review' ? 'text-red-700 hover:bg-red-50' : ''
              }`}
              onClick={() => {
                onAction?.(opt.key);
                onClose();
              }}
            >
              <span className="text-base w-5 flex-shrink-0 text-center">{opt.icon}</span>
              <span className="truncate">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ReviewCardMenu; 