import React from 'react';
import { BarChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const cardBg = "bg-white bg-gradient-to-br from-yellow-50 to-white border border-yellow-300";

interface WeeklyEngagementData {
  date: string;
  day: string;
  reviews: number;
  reactions: number;
  comments: number;
  points: number;
}

interface ApiWeeklyData {
  day: string;
  value: number;
}

interface WeeklyChartProps {
  weeklyData?: WeeklyEngagementData[] | ApiWeeklyData[];
  showBorder?: boolean;
}

const WeeklyChart: React.FC<WeeklyChartProps> = ({ 
  weeklyData, 
  showBorder = true 
}) => {
  // Default data if no weeklyData provided
  const defaultData = [
    { day: 'Mon', reviews: 2, reactions: 5, comments: 3, points: 40 },
    { day: 'Tue', reviews: 1, reactions: 3, comments: 1, points: 20 },
    { day: 'Wed', reviews: 3, reactions: 6, comments: 4, points: 60 },
    { day: 'Thu', reviews: 2, reactions: 4, comments: 2, points: 40 },
    { day: 'Fri', reviews: 4, reactions: 8, comments: 6, points: 80 },
    { day: 'Sat', reviews: 1, reactions: 2, comments: 1, points: 20 },
    { day: 'Sun', reviews: 0, reactions: 1, comments: 0, points: 0 }
  ];

  // Normalize the data format
  const normalizeData = (data: WeeklyEngagementData[] | ApiWeeklyData[]) => {
    if (!data || data.length === 0) return defaultData;
    
    return data.map((item) => {
      if ('reviews' in item) {
        // Already in correct format
        return item;
      }
      // Convert from API format
      const apiItem = item as ApiWeeklyData;
      return {
        day: apiItem.day,
        reviews: Math.floor(apiItem.value / 4) || 1,
        reactions: Math.floor(apiItem.value / 2) || 2,
        comments: Math.floor(apiItem.value / 6) || 1,
        points: apiItem.value * 2,
        date: apiItem.day
      };
    });
  };

  const chartData = normalizeData(weeklyData || defaultData);

  const content = (
    <>
      <h3 className="text-lg font-semibold mb-3">📈 Weekly Engagement</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="reviews" stackId="interact" fill="#4F46E5" name="Reviews" />
          <Bar dataKey="reactions" stackId="interact" fill="#16A34A" name="Reactions" />
          <Bar dataKey="comments" stackId="interact" fill="#F59E0B" name="Comments" />
          <Line type="monotone" dataKey="points" stroke="#9333EA" name="Points" strokeWidth={2} />
        </BarChart>
      </ResponsiveContainer>
    </>
  );

  return showBorder ? (
    <div className={`p-4 shadow-md rounded-lg ${cardBg}`}>
      {content}
    </div>
  ) : (
    <div>
      {content}
    </div>
  );
};

export default WeeklyChart; 