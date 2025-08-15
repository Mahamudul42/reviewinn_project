import React, { useRef, useState, useEffect } from 'react';
import type { Review } from '../../../types';
import { useUnifiedAuth } from '../../../hooks/useUnifiedAuth';
import { userInteractionService } from '../../../api/services';

interface ReviewCardMenuProps {
  open: boolean;
  onClose: () => void;
  onAction?: (action: string) => void;
  menuButtonRef?: React.RefObject<HTMLButtonElement>;
  review?: Review; // Add review prop to check permissions
}

const getMenuOptions = (review?: Review, currentUser?: any, isAuthenticated?: boolean, userInteractionService?: any) => {
  // Check if review is bookmarked
  const isBookmarked = review && userInteractionService ? 
    userInteractionService.getUserInteraction(review.id)?.isBookmarked : false;
  
  const baseOptions = [
    { key: 'interested', icon: '➕', label: 'Interested' },
    { key: 'not_interested', icon: '➖', label: 'Not Interested' },
    { key: 'save', icon: isBookmarked ? '🔖' : '📖', label: isBookmarked ? 'Unsave Review' : 'Save Review' },
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
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const { user: currentUser, isAuthenticated } = useUnifiedAuth();
  
  const options = getMenuOptions(review, currentUser, isAuthenticated, userInteractionService);

  const handleActionClick = async (actionKey: string) => {
    console.log('🔍 ReviewCardMenu: handleActionClick called with:', actionKey);
    setLoadingAction(actionKey);
    
    // Close menu immediately for modal actions to avoid conflicts
    const modalActions = ['save', 'report', 'notify', 'block', 'unfollow', 'edit_review', 'delete_review'];
    if (modalActions.includes(actionKey)) {
      console.log('🔍 ReviewCardMenu: Closing menu for modal action');
      onClose();
    }
    
    try {
      console.log('🔍 ReviewCardMenu: About to call onAction with:', actionKey);
      if (onAction) {
        await onAction(actionKey);
        console.log('🔍 ReviewCardMenu: onAction completed successfully');
      } else {
        console.log('🔍 ReviewCardMenu: No onAction provided!');
      }
    } catch (error) {
      console.error('ReviewCardMenu: Error in action:', error);
    } finally {
      setLoadingAction(null);
    }
    
    // Close menu for non-modal actions
    if (!modalActions.includes(actionKey)) {
      console.log('🔍 ReviewCardMenu: Closing menu for non-modal action');
      onClose();
    }
  };

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
    const card = btn.closest('[data-review-card="true"]');
    if (!card) return;
    
    // Get button position relative to the card
    const btnRect = btn.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    
    // Calculate position
    const top = btn.offsetTop + btn.offsetHeight + 8; // 8px gap below button
    const right = 0; // Align to right edge of card
    
    // Check if menu would go off-screen and adjust
    const viewportHeight = window.innerHeight;
    const menuBottom = btnRect.bottom + 8 + MENU_HEIGHT;
    const adjustedTop = menuBottom > viewportHeight ? 
      btn.offsetTop - MENU_HEIGHT - 8 : // Show above button if not enough space below
      top;
    
    setMenuStyle({
      position: 'absolute',
      top: adjustedTop,
      right,
      width: MENU_WIDTH,
      zIndex: 999 // Higher z-index to ensure it's above other elements
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
              disabled={loadingAction === opt.key}
              className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left transition-colors duration-150 ease-in-out border-b border-gray-100 last:border-b-0 font-medium text-gray-800 truncate disabled:opacity-50 ${
                opt.key === 'edit_review' ? 'text-blue-700 hover:bg-blue-50' :
                opt.key === 'delete_review' ? 'text-red-700 hover:bg-red-50' :
                opt.key === 'report' ? 'text-red-600 hover:bg-red-50' : ''
              }`}
              onClick={() => handleActionClick(opt.key)}
            >
              <span className="text-base w-5 flex-shrink-0 text-center">
                {loadingAction === opt.key ? '⏳' : opt.icon}
              </span>
              <span className="truncate">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ReviewCardMenu; 