import React, { useState, useEffect, useRef } from 'react';

interface LoadingProgressBarProps {
  isLoading: boolean;
  onComplete?: () => void;
  duration?: number; // Duration in milliseconds
  title?: string;
  subtitle?: string;
  showPercentage?: boolean;
  className?: string;
}

const LoadingProgressBar: React.FC<LoadingProgressBarProps> = ({
  isLoading,
  onComplete,
  duration = 30000, // 30 seconds default
  title = "Loading",
  subtitle,
  showPercentage = true,
  className = ""
}) => {
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);

  // Number of dots to display
  const numberOfDots = 5;

  useEffect(() => {
    if (isLoading) {
      startTimeRef.current = Date.now();
      setProgress(0);

      const intervalTime = 50; // Update progress every 50ms

      progressIntervalRef.current = window.setInterval(() => {
        if (!startTimeRef.current) return;

        const elapsedTime = Date.now() - startTimeRef.current;
        let newProgress = (elapsedTime / duration) * 100;

        if (newProgress >= 100) {
          newProgress = 100;
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          if (onComplete) {
            onComplete();
          }
        }
        setProgress(newProgress);
      }, intervalTime);
    } else {
      // Reset when loading stops
      setProgress(0);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isLoading, duration, onComplete]);

  if (!isLoading) {
    return null;
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 font-sans text-gray-800 bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden ${className}`}>
      <style>{`
        /* Import Google Font - Inter */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        
        /* Basic fade-in animation for content */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }

        /* Dot animation with trailing effect */
        @keyframes dot-trail-progress {
          0% {
            transform: translateX(-40px);
            opacity: 0;
            filter: blur(5px);
          }
          20% {
            opacity: 1;
            transform: translateX(0px);
            filter: blur(0px);
          }
          80% {
            opacity: 1;
            transform: translateX(40px);
            filter: blur(0px);
          }
          100% {
            opacity: 0;
            transform: translateX(80px);
            filter: blur(5px);
          }
        }
      `}</style>

      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md text-center flex flex-col items-center justify-center border border-gray-300 animate-fade-in">
        <h2 className="text-2xl font-semibold text-gray-800 mb-8">{title}</h2>
        
        <div className="flex justify-center items-center h-10 w-full mb-4 overflow-hidden relative">
          {/* This container ensures dots don't overflow during their animation */}
          <div className="relative w-40 flex justify-between items-center">
            {Array.from({ length: numberOfDots }).map((_, index) => (
              <div
                key={index}
                className="w-4 h-4 bg-blue-500 rounded-full"
                style={{
                  animation: `dot-trail-progress 2.5s infinite ease-in-out`,
                  animationDelay: `${index * 0.2}s`, // Stagger the animation of each dot
                }}
              ></div>
            ))}
          </div>
        </div>
        
        {showPercentage && (
          <p className="text-lg font-semibold text-gray-700 mb-6">
            {Math.floor(progress)}%
          </p>
        )}
        
        {subtitle && (
          <p className="text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingProgressBar; 