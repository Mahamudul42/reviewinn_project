import React from 'react';

const cardBg = "bg-white bg-gradient-to-br from-yellow-50 to-white border border-yellow-300";

const WhatsNext: React.FC = () => (
  <div className={`p-4 shadow-md rounded-lg ${cardBg}`}>
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-indigo-700">
      <span className="text-2xl">🔮</span> What's Next?
    </h3>
    <ul className="space-y-3 text-sm text-gray-800">
      <li className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded shadow-sm hover:bg-indigo-50">
        <span className="text-xl">🏵️</span>
        <span>Earn <strong>100 points</strong> to unlock the <strong>Reviewer</strong> badge</span>
      </li>
      <li className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded shadow-sm hover:bg-indigo-50">
        <span className="text-xl">🎁</span>
        <span>Reach <strong>Level 5</strong> to receive a special gift</span>
      </li>
      <li className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded shadow-sm hover:bg-indigo-50">
        <span className="text-xl">🔥</span>
        <span>Maintain a <strong>3-day streak</strong> to complete the streak milestone</span>
      </li>
    </ul>
  </div>
);

export default WhatsNext; 