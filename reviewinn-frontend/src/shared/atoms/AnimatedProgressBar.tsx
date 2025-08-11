import React from 'react';

const AnimatedProgressBar: React.FC<{ text?: string }> = ({ text }) => (
  <div className="flex flex-col items-center justify-center py-8 w-full">
    <div className="w-64 h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
      <div
        className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-progress"
        style={{
          width: '50%',
          animation: 'progressBarMove 1.2s linear infinite',
        }}
      />
    </div>
    {text && <p className="mt-4 text-gray-600 text-base animate-pulse">{text}</p>}
    <style>
      {`
        @keyframes progressBarMove {
          0% { margin-left: -50%; width: 50%; }
          50% { margin-left: 50%; width: 60%; }
          100% { margin-left: 100%; width: 50%; }
        }
      `}
    </style>
  </div>
);

export default AnimatedProgressBar; 