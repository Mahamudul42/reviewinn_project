import React from 'react';
import { BarChart3, TrendingUp, Users, RefreshCw } from 'lucide-react';
import { EmptyState } from '../../../shared/components/EmptyState';
import type { CircleAnalytics } from '../../../types';

interface CircleAnalyticsProps {
  analytics: CircleAnalytics | null;
}

const CircleAnalytics: React.FC<CircleAnalyticsProps> = ({ analytics }) => {
  if (!analytics) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Circle Analytics</h2>
        <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 rounded-xl p-8 shadow-sm">
          <EmptyState
            icon={<BarChart3 className="w-16 h-16 text-blue-500" />}
            title="Analytics Coming Soon"
            description="Your circle analytics will appear here once you have some members and activity. Start building your circle to see meaningful insights!"
            action={
              <div className="flex flex-col space-y-3">
                <button className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:bg-blue-600 hover:scale-105 flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Add Members</span>
                </button>
                <button className="bg-white text-blue-600 border border-blue-200 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-all duration-200 flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh Data</span>
                </button>
              </div>
            }
          />
        </div>
      </div>
    );
  }

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