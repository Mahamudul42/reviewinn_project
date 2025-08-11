import React from 'react';

interface RecentInteraction {
  type: string;
  user: string;
  action: string;
  time: string;
  icon: string;
  color: string;
  bgColor: string;
}

interface RecentActivityDropdownProps {
  open: boolean;
  onClose: () => void;
  interactions: RecentInteraction[];
}

const RecentActivityDropdown: React.FC<RecentActivityDropdownProps> = ({ open, onClose, interactions }) => {
  if (!open) return null;
  return (
    <div className="absolute right-0 mt-2 w-96 z-50" style={{right: '12px'}}>
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-lg text-blue-800">Recent Activity</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold" aria-label="Close">×</button>
        </div>
        <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
          {interactions.length === 0 && (
            <div className="text-gray-500 text-center py-8">No recent activity.</div>
          )}
          {interactions.map((interaction, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 p-3 ${interaction.bgColor} rounded-xl shadow-sm`}
            >
              <span className="text-xl" role="img" aria-label={interaction.type}>{interaction.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 text-sm">{interaction.user}</div>
                <div className="text-gray-600 text-xs truncate">{interaction.action}</div>
              </div>
              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">{interaction.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentActivityDropdown;
