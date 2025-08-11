import React from 'react';

interface UserProfileCardProps {
  name: string;
  username: string;
  level: number;
  dailyStreak: number;
  getSessionDuration: () => string;
  badges: string[];
  points: number;
}

const cardBg = "bg-white bg-gradient-to-br from-yellow-50 to-white border border-yellow-300";

const UserProfileCard: React.FC<UserProfileCardProps> = ({ name, username, level, dailyStreak, getSessionDuration, badges, points }) => (
  <div className={`p-4 sm:p-6 shadow-lg rounded-2xl ${cardBg} flex flex-col sm:flex-row items-center gap-4 sm:gap-6`}>
    <img
      src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&h=100"
      alt="User Profile"
      className="w-20 h-20 rounded-full object-cover border-4 border-yellow-200 shadow-sm"
    />
    <div className="flex-1 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="text-xl font-bold text-gray-800">{name}</h3>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Level {level}</span>
        </div>
        <p className="text-sm text-gray-600 italic">"Night Owl"</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm text-gray-700 mt-3">
        <p>🔥 Daily Streak: <span className="text-orange-600 font-medium">{dailyStreak}</span></p>
        <p>⏱️ Session: <span className="font-medium">{getSessionDuration()}</span></p>
        <p>🏅 Last Badge: <span className="font-medium">{badges.length > 0 ? badges[badges.length - 1] : 'None'}</span></p>
        <p>✨ Points: <span className="font-medium text-purple-600">{points}</span></p>
        <p>👥 Followers: <span className="font-semibold">128</span></p>
        <p>📌 Following: <span className="font-semibold">204</span></p>
      </div>
    </div>
  </div>
);

export default UserProfileCard; 