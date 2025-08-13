import React from 'react';
import type { CircleAnalytics } from '../../../types';

interface CircleAnalyticsProps {
  analytics: CircleAnalytics | null;
}

const CircleAnalytics: React.FC<CircleAnalyticsProps> = ({ analytics }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Circle Analytics</h2>
      
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-white to-purple-50 border border-purple-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{analytics.total_connections}</div>
            <div className="text-sm text-purple-600">Total Connections</div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-purple-50 border border-purple-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{analytics.recent_connections}</div>
            <div className="text-sm text-purple-600">Recent Connections</div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-purple-50 border border-purple-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{analytics.average_taste_match.toFixed(1)}%</div>
            <div className="text-sm text-purple-600">Average Taste Match</div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-purple-50 border border-purple-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{analytics.circle_growth.this_month}</div>
            <div className="text-sm text-purple-600">Growth This Month</div>
          </div>
        </div>
      )}
      
      {analytics && (
        <div className="bg-gradient-to-br from-white to-purple-50 border border-purple-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">Trust Level Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(analytics.trust_level_breakdown).map(([level, count]) => (
              <div key={level} className="text-center">
                <div className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{count}</div>
                <div className="text-sm text-purple-600 capitalize">{level.replace('_', ' ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CircleAnalytics;