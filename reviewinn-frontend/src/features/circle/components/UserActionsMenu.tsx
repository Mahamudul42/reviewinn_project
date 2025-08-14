import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, UserMinus, UserPlus, Ban, Shield, Heart, Users } from 'lucide-react';
import '../circle-purple-buttons.css';

interface UserActionsMenuProps {
  userId: string;
  userName: string;
  userType: 'circle_mate' | 'follower' | 'following' | 'blocked' | 'suggestion';
  isBlocked?: boolean;
  onDemoteToFollower?: (userId: string) => void;
  onPromoteToCircleMate?: (userId: string) => void;
  onBlock?: (userId: string, userName: string) => void;
  onUnblock?: (userId: string, userName: string) => void;
  onRemoveFromCircle?: (userId: string) => void;
  onUnfollow?: (userId: string) => void;
}

const UserActionsMenu: React.FC<UserActionsMenuProps> = ({
  userId,
  userName,
  userType,
  isBlocked = false,
  onDemoteToFollower,
  onPromoteToCircleMate,
  onBlock,
  onUnblock,
  onRemoveFromCircle,
  onUnfollow
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const getMenuItems = () => {
    const items = [];

    // Blocked users - only show unblock option
    if (isBlocked || userType === 'blocked') {
      items.push({
        label: 'Unblock User',
        icon: Shield,
        action: () => onUnblock?.(userId, userName),
        className: 'text-green-600 hover:bg-green-50'
      });
      return items;
    }

    // Circle mate actions
    if (userType === 'circle_mate') {
      items.push({
        label: 'Demote to Follower',
        icon: Heart,
        action: () => onDemoteToFollower?.(userId),
        className: 'text-blue-600 hover:bg-blue-50'
      });
      items.push({
        label: 'Remove from Circle',
        icon: UserMinus,
        action: () => onRemoveFromCircle?.(userId),
        className: 'text-orange-600 hover:bg-orange-50'
      });
    }

    // Follower actions
    if (userType === 'follower') {
      items.push({
        label: 'Promote to Circle Mate',
        icon: Users,
        action: () => onPromoteToCircleMate?.(userId),
        className: 'text-purple-600 hover:bg-purple-50'
      });
    }

    // Following actions
    if (userType === 'following') {
      items.push({
        label: 'Unfollow',
        icon: UserMinus,
        action: () => onUnfollow?.(userId),
        className: 'text-orange-600 hover:bg-orange-50'
      });
    }

    // Block option for all non-blocked users
    items.push({
      label: 'Block User',
      icon: Ban,
      action: () => onBlock?.(userId, userName),
      className: 'text-red-600 hover:bg-red-50'
    });

    return items;
  };

  const menuItems = getMenuItems();

  if (menuItems.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full bg-purple-100 hover:bg-purple-200 transition-colors border border-purple-300"
        aria-label="User actions"
        style={{ backgroundColor: '#f3e8ff', borderColor: '#c4b5fd' }}
      >
        <MoreVertical size={16} className="text-purple-600" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[180px] transform -translate-x-full">
          <div className="py-1">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleAction(item.action)}
                className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 transition-colors ${item.className}`}
              >
                <item.icon size={14} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserActionsMenu;