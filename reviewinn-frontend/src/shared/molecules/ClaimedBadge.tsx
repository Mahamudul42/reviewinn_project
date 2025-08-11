import React from 'react';
import { CheckCircle } from 'lucide-react';

const ClaimedBadge: React.FC = () => {
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2">
      <CheckCircle className="h-3 w-3 mr-1" />
      Claimed
    </span>
  );
};

export default ClaimedBadge; 