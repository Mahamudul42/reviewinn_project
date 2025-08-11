import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  colorFrom?: string;
  colorTo?: string;
  height?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, className = '', colorFrom = 'from-yellow-400', colorTo = 'to-yellow-300', height = 'h-3' }) => (
  <div className={`w-full bg-yellow-100 rounded-full ${height} overflow-hidden ${className}`}>
    <div
      className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${colorFrom} ${colorTo}`}
      style={{ width: `${value}%` }}
    />
  </div>
);

export default ProgressBar; 