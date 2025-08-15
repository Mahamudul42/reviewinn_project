import React, { useState, useRef, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Bomb, Heart, PartyPopper, Frown, Eye, Laugh } from 'lucide-react';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';

// Add CSS animations for smooth popup transitions
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

interface SocialReactionButtonProps {
  reactions: Record<string, number>;
  userReaction?: string;
  onReactionChange: (reaction: string | null) => Promise<void>;
  onRequireAuth?: () => void;
}

const SocialReactionButton: React.FC<SocialReactionButtonProps> = ({
  reactions,
  userReaction,
  onReactionChange,
  onRequireAuth
}) => {
  const { isAuthenticated, user } = useUnifiedAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Listen for auth state changes and force re-render
  useEffect(() => {
    const handleAuthChange = () => {
      console.log('🔄 SocialReactionButton: Auth state changed, forcing re-render');
      setForceUpdate(prev => prev + 1);
    };

    // Listen for both login success and general auth state changes
    window.addEventListener('loginSuccess', handleAuthChange);
    window.addEventListener('authStateChanged', handleAuthChange);

    return () => {
      window.removeEventListener('loginSuccess', handleAuthChange);
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, []);

  // Debug authentication state
  console.log('🔐 SocialReactionButton auth state:', { isAuthenticated, hasUser: !!user, forceUpdate });
  const [localReactions, setLocalReactions] = useState(reactions || {});
  const [localUserReaction, setLocalUserReaction] = useState(userReaction);
  const [popupPosition, setPopupPosition] = useState<'left' | 'center' | 'right'>('left');
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<number | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showOnClick, setShowOnClick] = useState(false);

  // Sync local state when props change (important for persistence after refresh)
  useEffect(() => {
    setLocalReactions(reactions || {});
  }, [reactions]);

  useEffect(() => {
    setLocalUserReaction(userReaction);
    console.log('🔄 SocialReactionButton: Updated local user reaction from prop:', userReaction);
  }, [userReaction]);

  // Debug logging
  console.log('SocialReactionButton received:', { reactions, userReaction, hasOnReactionChange: !!onReactionChange });

  // Show popup either on hover OR click
  const shouldShowPopup = isHovered || showOnClick;
  console.log('🔍 shouldShowPopup:', shouldShowPopup, '| isHovered:', isHovered, '| showOnClick:', showOnClick);

  // Calculate optimal popup position to prevent overflow
  const calculatePopupPosition = () => {
    if (!containerRef.current) return 'left';
    
    const rect = containerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const popupWidth = 350; // More accurate popup width
    const padding = 20; // Safe padding from edges
    
    // Check if there's enough space on the right
    if (rect.left + popupWidth > viewportWidth - padding) {
      return 'right';
    }
    
    // Check if there's enough space on the left
    if (rect.left < padding) {
      return 'left';
    }
    
    // Check if centering would cause overflow
    const centerPosition = rect.left + rect.width / 2 - popupWidth / 2;
    if (centerPosition < padding || centerPosition + popupWidth > viewportWidth - padding) {
      // Default to left alignment if centering would overflow
      return 'left';
    }
    
    return 'left'; // Default to left for consistency
  };

  // Update position when showing popup
  useEffect(() => {
    if (shouldShowPopup) {
      setPopupPosition(calculatePopupPosition());
    }
  }, [shouldShowPopup]);
  
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
  
  // Simplified like button click - just toggle thumbs up or remove current reaction
  const handleLikeClick = async () => {
    if (!isAuthenticated) {
      onRequireAuth && onRequireAuth();
      return;
    }
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      if (localUserReaction) {
        // User has any reaction - remove it
        const newReactions = { ...localReactions };
        newReactions[localUserReaction] = Math.max(0, (newReactions[localUserReaction] || 0) - 1);
        setLocalReactions(newReactions);
        setLocalUserReaction(undefined);
        await onReactionChange(null);
      } else {
        // User has no reaction - add thumbs up
        const newReactions = { ...localReactions };
        newReactions.thumbs_up = (newReactions.thumbs_up || 0) + 1;
        setLocalReactions(newReactions);
        setLocalUserReaction('thumbs_up');
        await onReactionChange('thumbs_up');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReactionClick = async (reactionName: string) => {
    if (!isAuthenticated) {
      onRequireAuth && onRequireAuth();
      return;
    }
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      const newReactions = { ...localReactions };
      
      if (localUserReaction === reactionName) {
        // Clicking same reaction - remove it
        newReactions[reactionName] = Math.max(0, (newReactions[reactionName] || 0) - 1);
        setLocalReactions(newReactions);
        setLocalUserReaction(undefined);
        await onReactionChange(null);
      } else {
        // Clicking different reaction - switch to it
        if (localUserReaction && newReactions[localUserReaction]) {
          newReactions[localUserReaction] = Math.max(0, newReactions[localUserReaction] - 1);
        }
        newReactions[reactionName] = (newReactions[reactionName] || 0) + 1;
        setLocalReactions(newReactions);
        setLocalUserReaction(reactionName);
        await onReactionChange(reactionName);
      }
      
      // Hide popup after reaction selection
      setIsHovered(false);
      setShowOnClick(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const getCurrentReaction = () => {
    return REACTIONS.find(r => r.name === localUserReaction) || REACTIONS[0];
  };

  // Handle mouse interactions for popup
  const handleMouseEnter = () => {
    console.log('🐭 Mouse entered reaction button');
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Show popup immediately on hover (industry standard)
    setIsHovered(true);
    console.log('🐭 Set isHovered to true, shouldShowPopup:', isHovered || showOnClick);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Hide popup after short delay (gives user time to move mouse to popup)
    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsHovered(false);
    }, 200);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Toggle popup on click (mobile/accessibility support)
    setShowOnClick((prev) => !prev);
  };

  return (
    <>
      {/* Inject CSS animations */}
      <style>{popupStyles}</style>
      
      <div 
        ref={containerRef}
        className="relative inline-block w-full max-w-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleContainerClick}
      >
      {/* Reaction Picker Popup - Facebook/LinkedIn Style with Smart Positioning */}
      {shouldShowPopup && (
        <div 
          ref={popupRef}
          className="absolute bottom-full mb-3 bg-white border border-gray-300 rounded-lg shadow-lg px-3 py-2 flex gap-2 z-50 left-0"
          style={{ 
            minWidth: 'max-content'
          }}
          onMouseEnter={() => {
            // Keep popup open when mouse enters it
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
            setIsHovered(true);
          }}
          onMouseLeave={() => {
            // Hide popup when mouse leaves it
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
            hoverTimeoutRef.current = window.setTimeout(() => {
              setIsHovered(false);
            }, 200);
          }}
        >
          {/* Smart triangle pointer that aligns with like button */}
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
                  localUserReaction === r.name 
                    ? 'bg-blue-100 border-blue-400 scale-110 shadow-md' 
                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => handleReactionClick(r.name)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') handleReactionClick(r.name);
                }}
                tabIndex={0}
                autoFocus={idx === 0}
                disabled={isUpdating}
              >
                {r.emoji}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Main Like Button - Facebook/LinkedIn Style */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleLikeClick();
        }}
        className={`
          flex items-center justify-center gap-2 h-12 px-3 rounded-md border font-semibold text-sm shadow-sm w-full min-w-0 transition-all duration-200
          ${localUserReaction 
            ? 'text-white bg-blue-600 border-blue-600 hover:bg-blue-700 hover:border-blue-700' 
            : 'text-gray-700 bg-gray-50 border-gray-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'
          }
          ${isUpdating ? 'opacity-75 cursor-wait' : 'cursor-pointer'}
        `}
        type="button"
        disabled={isUpdating}
        title={localUserReaction ? `Remove ${getCurrentReaction().label} reaction` : 'Like this'}
      >
        <span 
          className={`text-lg transition-all duration-200 ${
            localUserReaction ? 'scale-110' : ''
          } ${isUpdating ? 'animate-pulse' : ''}`}
          style={{
            filter: localUserReaction ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' : 'none',
            animation: localUserReaction ? 'reactionBounce 0.6s ease-out' : 'none'
          }}
        >
          {localUserReaction ? getCurrentReaction().emoji : '👍'}
        </span>
        <span className={`font-semibold truncate ${localUserReaction ? 'text-white' : 'text-gray-700'}`}>
          {localUserReaction ? getCurrentReaction().label.charAt(0).toUpperCase() + getCurrentReaction().label.slice(1) : 'Like'}
        </span>
      </button>
      </div>
    </>
  );
};

export default SocialReactionButton;