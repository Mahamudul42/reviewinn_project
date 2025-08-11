import React from 'react';
import { Flag, Trash2, Edit, Share2 } from 'lucide-react';

interface ReviewCardMenuProps {
  open: boolean;
  onClose: () => void;
}

const ReviewCardMenu: React.FC<ReviewCardMenuProps> = ({ open, onClose }) => {
  if (!open) return null;

  const menuItems = [
    { icon: Edit, label: 'Edit Review', action: () => console.log('Edit review') },
    { icon: Share2, label: 'Share Review', action: () => console.log('Share review') },
    { icon: Flag, label: 'Report Review', action: () => console.log('Report review') },
    { icon: Trash2, label: 'Delete Review', action: () => console.log('Delete review') }
  ];

  return (
    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      <div className="py-1">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => {
              item.action();
              onClose();
            }}
            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <item.icon className="h-4 w-4 mr-3" />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReviewCardMenu; 