import React, { useState, useEffect } from 'react';
import confetti from "canvas-confetti";
import ProgressBar from '../atoms/ProgressBar';

interface ProgressSectionProps {
  points: number;
  level: number;
  dailyStreak: number;
  progressToNextLevel: number;
  handleReview: () => void;
}

const cardBg = "bg-white bg-gradient-to-br from-yellow-50 to-white border border-yellow-300";

const ProgressSection: React.FC<ProgressSectionProps> = ({ points, level, dailyStreak, progressToNextLevel, handleReview }) => {
  const [celebrated, setCelebrated] = useState(false);
  useEffect(() => {
    if (progressToNextLevel === 100 && !celebrated) {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
      setCelebrated(true);
    } else if (progressToNextLevel < 100 && celebrated) {
      setCelebrated(false);
    }
  }, [progressToNextLevel]);

  return (
    <div className={`p-4 shadow-md rounded-lg ${cardBg}`}>
      <h2 className="font-semibold text-lg mb-2">Your Progress</h2>
      <div className="flex justify-between">
        <span>Points:</span>
        <span className="font-bold">{points}</span>
      </div>
      <div className="flex justify-between">
        <span>Level:</span>
        <span className="text-green-600 font-semibold">{level}</span>
      </div>
      <div className="flex justify-between">
        <span>Daily Streak:</span>
        <span className="text-orange-500 font-semibold">{dailyStreak} 🔥</span>
      </div>
      <ProgressBar value={progressToNextLevel} className="my-2" />
      <button onClick={handleReview} className="w-full mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all text-base active:scale-95">Leave a Review</button>
    </div>
  );
};

export default ProgressSection; 