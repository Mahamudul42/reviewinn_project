import React from 'react';

interface MissionItemProps {
  label: string;
  complete: boolean;
  className?: string;
}

const MissionItem: React.FC<MissionItemProps> = ({ label, complete, className = '' }) => (
  <div className={`flex items-center justify-between px-4 py-2 rounded-lg shadow-sm transition-all duration-300 ${complete ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-200'} ${className}`}>
    <span className={`text-sm font-medium ${complete ? 'text-green-700 line-through' : 'text-gray-800'}`}>{label}</span>
    <div className="w-2/5 ml-4 h-2 rounded-full bg-gray-200">
      <div className={`h-2 rounded-full transition-all duration-300 ${complete ? 'bg-green-400' : 'bg-yellow-300'}`} style={{ width: complete ? '100%' : '0%' }}></div>
    </div>
  </div>
);

export default MissionItem; 