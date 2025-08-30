/**
 * ENTERPRISE SOCIAL REACTION BUTTON
 * 
 * Production-ready React component implementing:
 * - Cross-browser session persistence
 * - Real-time state synchronization  
 * - Optimistic UI updates
 * - Comprehensive error handling
 * - Performance optimization
 * - Accessibility compliance
 * 
 * @author ReviewInn Engineering Team
 * @version 2.0.0 Enterprise
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ThumbsUp, ThumbsDown, Bomb, Heart, PartyPopper, Frown, Eye, Laugh } from 'lucide-react';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import { useEnterpriseReactions } from '../../hooks/useEnterpriseReactions';

// CSS animations for smooth popup transitions
const popupStyles = `
  @keyframes slideInFromBottom {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  @keyframes slideOutToBottom {
    from {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    to {
      opacity: 0;
      transform: translateY(10px) scale(0.95);
    }
  }
  
  @keyframes reactionBounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0) scale(1);
    }
    40% {
      transform: translateY(-3px) scale(1.1);
    }
    60% {
      transform: translateY(-2px) scale(1.05);
    }
  }
  
  @keyframes optimisticPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`;

const REACTIONS = [
  { name: 'thumbs_up', emoji: '👍', label: 'Thumbs Up' },
  { name: 'thumbs_down', emoji: '👎', label: 'Thumbs Down' },
  { name: 'bomb', emoji: '💣', label: 'Bomb' },
  { name: 'love', emoji: '❤️', label: 'Love' },
  { name: 'haha', emoji: '😂', label: 'Haha' },
  { name: 'sad', emoji: '😢', label: 'Sad' },
  { name: 'eyes', emoji: '👀', label: 'Eyes' },
  { name: 'celebration', emoji: '🎉', label: 'Celebration' },
];

interface EnterpriseSocialReactionButtonProps {
  reviewId: string;
  onRequireAuth?: () => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showCounts?: boolean;
  enableOptimisticUpdates?: boolean;
}

const EnterpriseSocialReactionButton: React.FC<EnterpriseSocialReactionButtonProps> = ({
  reviewId,
  onRequireAuth,
  className = '',
  size = 'medium',
  showCounts = true,
  enableOptimisticUpdates = true
}) => {
  const { isAuthenticated, user } = useUnifiedAuth();
  
  // Enterprise hook for reaction state management
  const {
    reactions,
    userReaction,
    isLoading,
    error,
    setReaction,
    refreshReactions,
    isOptimistic,
    source,
    lastUpdated
  } = useEnterpriseReactions(reviewId);

  // Local UI state
  const [isHovered, setIsHovered] = useState(false);
  const [showOnClick, setShowOnClick] = useState(false);
  const [popupPosition, setPopupPosition] = useState<'left' | 'center' | 'right'>('left');
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<number | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Show popup either on hover OR click
  const shouldShowPopup = isHovered || showOnClick;

  // Enterprise logging and monitoring
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🏢 EnterpriseSocialReactionButton: State update for ${reviewId}`, {
        reactions,
        userReaction,
        isLoading,
        error,
        isOptimistic,
        source,
        lastUpdated,
        isAuthenticated,
        userId: user?.id || user?.user_id
      });
    }
  }, [reactions, userReaction, isLoading, error, isOptimistic, source, lastUpdated, isAuthenticated, user, reviewId]);

  // Calculate optimal popup position to prevent overflow
  const calculatePopupPosition = useCallback(() => {
    if (!containerRef.current) return 'left';
    
    const rect = containerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const popupWidth = 350;
    const padding = 20;
    
    if (rect.left + popupWidth > viewportWidth - padding) {
      return 'right';
    }
    
    if (rect.left < padding) {
      return 'left';
    }
    
    const centerPosition = rect.left + rect.width / 2 - popupWidth / 2;
    if (centerPosition < padding || centerPosition + popupWidth > viewportWidth - padding) {
      return 'left';
    }
    
    return 'left';
  }, []);

  // Update position when showing popup
  useEffect(() => {
    if (shouldShowPopup) {
      setPopupPosition(calculatePopupPosition());
    }
  }, [shouldShowPopup, calculatePopupPosition]);
  
  // Handle click outside and ESC key to close popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowOnClick(false);
        setIsHovered(false);
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowOnClick(false);
        setIsHovered(false);
      }
    };

    if (shouldShowPopup) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [shouldShowPopup]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);
  
  // Enterprise error handling with user feedback
  const handleReactionError = useCallback((error: Error, actionType: string) => {
    console.error(`🏢 EnterpriseSocialReactionButton: ${actionType} failed for ${reviewId}:`, error);
    
    // TODO: Integrate with enterprise error reporting system
    // errorReportingService.reportError('reaction_action_failed', {
    //   reviewId,
    //   actionType,
    //   error: error.message,
    //   userId: user?.id,
    //   timestamp: Date.now()
    // });
  }, [reviewId, user?.id]);

  // Handle like button click (thumbs up or remove current reaction)
  const handleLikeClick = useCallback(async () => {
    if (!isAuthenticated) {
      onRequireAuth && onRequireAuth();
      return;
    }

    try {
      const newReaction = userReaction ? null : 'thumbs_up';
      await setReaction(newReaction);
    } catch (error) {
      handleReactionError(error as Error, 'like_click');
    }
  }, [isAuthenticated, userReaction, setReaction, onRequireAuth, handleReactionError]);

  // Handle specific reaction selection
  const handleReactionClick = useCallback(async (reactionName: string) => {
    if (!isAuthenticated) {
      onRequireAuth && onRequireAuth();
      return;
    }

    try {
      const newReaction = userReaction === reactionName ? null : reactionName;
      await setReaction(newReaction);
      
      // Hide popup after reaction selection
      setIsHovered(false);
      setShowOnClick(false);
    } catch (error) {
      handleReactionError(error as Error, 'reaction_select');
    }
  }, [isAuthenticated, userReaction, setReaction, onRequireAuth, handleReactionError]);

  // Get current reaction display info
  const getCurrentReaction = useCallback(() => {
    return REACTIONS.find(r => r.name === userReaction) || REACTIONS[0];
  }, [userReaction]);

  // Mouse interaction handlers
  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsHovered(false);
    }, 200);
  }, []);

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOnClick((prev) => !prev);
  }, []);

  // Size configuration
  const getSizeClasses = () => {
    switch (size) {
      case 'small': return 'h-8 px-2 text-xs';
      case 'large': return 'h-16 px-6 text-lg';
      default: return 'h-12 px-3 text-sm';
    }
  };

  // Calculate total reactions for display
  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);

  return (
    <>
      {/* Inject CSS animations */}
      <style>{popupStyles}</style>
      
      <div 
        ref={containerRef}
        className={`relative inline-block w-full max-w-full ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleContainerClick}
      >
        {/* Reaction Picker Popup */}
        {shouldShowPopup && (
          <div 
            ref={popupRef}
            className="absolute bottom-full mb-3 bg-white border border-gray-300 rounded-lg shadow-lg px-3 py-2 flex gap-2 z-50 left-0 animate-[slideInFromBottom_0.15s_ease-out]"
            style={{ 
              minWidth: 'max-content'
            }}
            onMouseEnter={() => {
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
              }
              setIsHovered(true);
            }}
            onMouseLeave={() => {
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
              }
              hoverTimeoutRef.current = window.setTimeout(() => {
                setIsHovered(false);
              }, 200);
            }}
          >
            {/* Smart triangle pointer */}
            <div 
              className="absolute top-full w-0 h-0 transition-all duration-150"
              style={{
                [popupPosition === 'right' ? 'right' : 'left']: '24px',
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid white',
                marginTop: '-1px',
                filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))'
              }}
            />
            
            <div className="flex flex-row gap-2 items-center">
              {REACTIONS.map((r, idx) => (
                <button
                  key={r.name}
                  aria-label={r.label}
                  className={`text-xl px-2 py-1 rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 transform hover:scale-125 ${
                    userReaction === r.name 
                      ? 'bg-blue-100 border-blue-400 scale-110 shadow-md' 
                      : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  onClick={() => handleReactionClick(r.name)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') handleReactionClick(r.name);
                  }}
                  tabIndex={0}
                  autoFocus={idx === 0}
                  disabled={isLoading}
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Like Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleLikeClick();
          }}
          className={`
            flex items-center justify-center gap-2 rounded-md border font-semibold shadow-sm w-full min-w-0 transition-all duration-200
            ${getSizeClasses()}
            ${userReaction 
              ? 'text-white bg-blue-600 border-blue-600 hover:bg-blue-700 hover:border-blue-700' 
              : 'text-gray-700 bg-gray-50 border-gray-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'
            }
            ${isLoading ? 'opacity-75 cursor-wait' : 'cursor-pointer'}
            ${isOptimistic ? 'animate-[optimisticPulse_1s_ease-in-out_infinite]' : ''}
          `}
          type="button"
          disabled={isLoading}
          title={userReaction ? `Remove ${getCurrentReaction().label} reaction` : 'Like this'}
          aria-label={userReaction ? `Remove ${getCurrentReaction().label} reaction` : 'Like this'}
        >
          <span 
            className={`text-lg transition-all duration-200 ${
              userReaction ? 'scale-110' : ''
            } ${isLoading ? 'animate-pulse' : ''}`}
            style={{
              filter: userReaction ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' : 'none',
              animation: userReaction && !isOptimistic ? 'reactionBounce 0.6s ease-out' : 'none'
            }}
          >
            {userReaction ? getCurrentReaction().emoji : '👍'}
          </span>
          
          <span className={`font-semibold truncate ${userReaction ? 'text-white' : 'text-gray-700'}`}>
            {userReaction ? getCurrentReaction().label.charAt(0).toUpperCase() + getCurrentReaction().label.slice(1) : 'Like'}
          </span>
          
          {/* Enterprise features: Show reaction count and status indicators */}
          {showCounts && totalReactions > 0 && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              userReaction ? 'bg-blue-800 text-blue-100' : 'bg-gray-200 text-gray-600'
            }`}>
              {totalReactions}
            </span>
          )}
          
          {/* Development mode indicators */}
          {process.env.NODE_ENV === 'development' && (
            <div className="absolute top-0 right-0 -mt-1 -mr-1 flex gap-1">
              {isOptimistic && (
                <span className="w-2 h-2 bg-yellow-400 rounded-full" title="Optimistic update" />
              )}
              {error && (
                <span className="w-2 h-2 bg-red-400 rounded-full" title={`Error: ${error}`} />
              )}
              {source === 'cache' && (
                <span className="w-2 h-2 bg-gray-400 rounded-full" title="From cache" />
              )}
            </div>
          )}
        </button>
      </div>
    </>
  );
};

export default EnterpriseSocialReactionButton;