import React from 'react';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, className = '' }) => (
  <div className={`flex flex-col items-center p-2 bg-white rounded-lg shadow text-sm ${className}`}>
    <span className="font-bold text-lg">{value}</span>
    <span className="text-gray-500">{label}</span>
  </div>
);

export default StatCard; 