import React from "react";
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { day: "Mon", engagement: 120 },
  { day: "Tue", engagement: 210 },
  { day: "Wed", engagement: 160 },
  { day: "Thu", engagement: 290 },
  { day: "Fri", engagement: 200 },
  { day: "Sat", engagement: 350 },
  { day: "Sun", engagement: 180 },
];

const WeeklyEngagementChart: React.FC = () => {
  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2 text-gray-800">Weekly User Engagement</h2>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="engagement" barSize={32} fill="#f472b6" radius={[8,8,0,0]} />
          <Line type="monotone" dataKey="engagement" stroke="#6366f1" strokeWidth={3} dot={{ r: 5, fill: '#fff', stroke: '#6366f1', strokeWidth: 2 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklyEngagementChart;
