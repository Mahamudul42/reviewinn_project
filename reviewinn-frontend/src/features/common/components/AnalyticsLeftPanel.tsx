import React, { useState } from 'react';
import { useAnalyticsLeftPanel } from '../hooks/useAnalyticsLeftPanel';

/**
 * Analytics Left Panel Component
 * Uses the exact same double card system as existing left panel
 * Displays analytics-based data in the same styled cards
 */
const AnalyticsLeftPanel: React.FC = () => {
  const { data, loading, error, refetch } = useAnalyticsLeftPanel();
  const [showContactModal, setShowContactModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Consistent styling from existing Sidebar component
  const cardBg = "bg-white bg-gradient-to-br from-yellow-50 to-white border border-yellow-300 w-full max-w-full overflow-hidden";
  const cardWrapper = "p-4 shadow-md rounded-lg bg-white w-full max-w-full overflow-hidden";

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className={`${cardWrapper}`}>
          <div className={`${cardBg} rounded-lg p-5`}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading analytics data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <div className={`${cardWrapper}`}>
          <div className={`${cardBg} rounded-lg p-5`}>
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={refetch}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-4">
        <div className={`${cardWrapper}`}>
          <div className={`${cardBg} rounded-lg p-5`}>
            <p className="text-gray-600 text-center">No data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top Reviews Section - Double Card System */}
      <div className={`${cardWrapper} hover:shadow-xl transition-all duration-300`}>
        <div className={`${cardBg} rounded-lg p-5`}>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">🔥</span>
            Top Reviews
          </h3>
          <div className="space-y-3">
            {data.top_reviews.map((review) => (
              <div
                key={review.review_id}
                className={`${cardBg} rounded-lg p-4 hover:shadow-lg transition-all duration-300 cursor-pointer group`}
              >
                <div className="flex items-center gap-3 mb-3 w-full max-w-full overflow-hidden">
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <span className="font-medium text-gray-900 truncate min-w-0">
                        {review.user.name}
                      </span>
                      {review.user.is_verified && (
                        <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                    
                    {/* Entity Card */}
                    <div className="w-full mt-3 mb-2 p-3 bg-gradient-to-r from-blue-50 to-white border border-blue-200 rounded-xl flex items-center gap-4">
                      <img
                        src={review.entity.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.entity.name)}&background=random`}
                        alt={review.entity.name}
                        className="w-12 h-12 rounded-xl object-cover border border-blue-300 shadow-sm flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <span className="text-base font-bold text-blue-900 truncate block">
                          {review.entity.name}
                        </span>
                        {(review.entity.root_category || review.entity.final_category) && (
                          <span className="text-xs text-gray-500 capitalize truncate block mt-0.5">
                            {review.entity.final_category?.name || review.entity.root_category?.name}
                          </span>
                        )}
                        <div className="flex items-center gap-1 mt-2">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`text-xs ${i < Math.floor(review.entity.average_rating) ? "text-yellow-400" : "text-gray-300"}`}>
                                ⭐
                              </span>
                            ))}
                          </div>
                          <span className="text-xs text-gray-600 ml-1">
                            {review.entity.average_rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review Title and Rating */}
                {review.title && (
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-white border border-blue-200 rounded-lg px-3 py-1 shadow-sm flex-1">
                      <h5 className="font-semibold text-blue-900 text-sm line-clamp-1">
                        {review.title}
                      </h5>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 rounded-lg px-2 py-1 shadow-sm">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-xs ${i < Math.floor(review.overall_rating) ? "text-yellow-400" : "text-gray-300"}`}>
                            ⭐
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-700 ml-1">
                        {review.overall_rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Review Content */}
                <div className="mb-3">
                  <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                    {review.content}
                  </p>
                </div>

                {/* Analytics Metrics */}
                <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                  <span className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                    <span>🎯</span>
                    <span className="font-medium">{review.engagement_score}</span>
                  </span>
                  <span className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full">
                    <span>👁️</span>
                    <span className="font-medium">{review.view_count}</span>
                  </span>
                  <span className="flex items-center gap-1 bg-red-50 px-2 py-1 rounded-full">
                    <span>❤️</span>
                    <span className="font-medium">{review.reaction_count}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Categories Section */}
      <div className={`${cardWrapper} hover:shadow-xl transition-all duration-300`}>
        <div className={`${cardBg} rounded-lg p-5`}>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">📊</span>
            Top Categories
          </h3>
          <div className="space-y-3">
            {data.top_categories.map((categoryData, index) => (
              <div key={categoryData.category.id} className={`${cardWrapper} hover:shadow-sm transition-all duration-200 group`}>
                <div className={`${cardBg} rounded-lg p-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{categoryData.category.icon}</span>
                      <div>
                        <span className="font-semibold text-gray-900 text-sm capitalize block">
                          {categoryData.category.name}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`text-xs ${i < Math.floor(categoryData.avg_rating) ? "text-yellow-400" : "text-gray-300"}`}>
                                ⭐
                              </span>
                            ))}
                          </div>
                          <span>{categoryData.avg_rating.toFixed(1)} avg</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-600 font-medium">
                        {categoryData.review_count} reviews
                      </div>
                      <div className="text-xs text-gray-500">
                        #{index + 1}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Reviewers Section */}
      <div className={`${cardWrapper} hover:shadow-xl transition-all duration-300`}>
        <div className={`${cardBg} rounded-lg p-5`}>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">👑</span>
            Top Reviewers
          </h3>
          <div className="space-y-3">
            {data.top_reviewers.map((reviewer, index) => (
              <div
                key={reviewer.user_id}
                className={`${cardBg} rounded-lg p-4 hover:shadow-lg transition-all duration-300 cursor-pointer group`}
              >
                <div className="flex items-center gap-3 mb-3 w-full max-w-full overflow-hidden">
                  <div className="relative flex-shrink-0">
                    <img
                      src={reviewer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(reviewer.name)}&background=8b5cf6&color=ffffff&size=48&rounded=true`}
                      alt={reviewer.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {reviewer.review_count >= 5 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h4 className="font-medium text-gray-900 truncate">
                      {reviewer.name}
                    </h4>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-gray-500 truncate min-w-0">
                        @{reviewer.username} • Level {reviewer.level}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {reviewer.review_count}
                    </div>
                    <div className="text-xs text-gray-500">
                      reviews
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ReviewInn Info Card */}
      <div className={`${cardWrapper} hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]`}>
        <div className={`${cardBg} rounded-xl p-4`}>
          <div className="text-center mb-3">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 text-white p-2.5 rounded-full shadow-lg">
                <span className="text-xl font-bold">🌟</span>
              </div>
            </div>
            <h3 className="text-lg font-black bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mt-3">
              ReviewInn
            </h3>
            <div className="w-10 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mx-auto mt-2"></div>
          </div>

          <p className="text-gray-700 leading-relaxed mb-4 text-center text-sm font-medium">
            Your trusted platform for <span className="text-blue-600 font-bold">authentic reviews</span> and comparisons. 
            Share your experiences and help others make <span className="text-purple-600 font-bold">informed decisions</span>.
          </p>

          <div className="space-y-2">
            <div className="flex items-center p-2.5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 hover:from-blue-100 hover:to-blue-200 transition-all duration-300 group">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-sm">🌟</span>
              </div>
              <div className="ml-2.5">
                <span className="text-blue-800 font-bold text-sm">Trusted by thousands</span>
                <p className="text-blue-600 text-xs">Growing community of reviewers</p>
              </div>
            </div>

            <div className="flex items-center p-2.5 bg-gradient-to-r from-green-50 to-emerald-100 rounded-lg border border-green-200 hover:from-green-100 hover:to-emerald-200 transition-all duration-300 group">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-sm">🔒</span>
              </div>
              <div className="ml-2.5">
                <span className="text-green-800 font-bold text-sm">Secure & Private</span>
                <p className="text-green-600 text-xs">Your data is protected</p>
              </div>
            </div>

            <div className="flex items-center p-2.5 bg-gradient-to-r from-purple-50 to-violet-100 rounded-lg border border-purple-200 hover:from-purple-100 hover:to-violet-200 transition-all duration-300 group">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-400 to-violet-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-sm">⚡</span>
              </div>
              <div className="ml-2.5">
                <span className="text-purple-800 font-bold text-sm">Fast & Reliable</span>
                <p className="text-purple-600 text-xs">Lightning fast performance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Support Center Card */}
      <div className={`${cardWrapper} hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]`}>
        <div className={`${cardBg} rounded-xl p-4`}>
          <div className="text-center mb-3">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-purple-500 to-pink-600 text-white p-2.5 rounded-full shadow-lg">
                <span className="text-xl font-bold">🆘</span>
              </div>
            </div>
            <h3 className="text-lg font-black bg-gradient-to-r from-purple-600 via-pink-600 to-purple-800 bg-clip-text text-transparent mt-3">
              Support Center
            </h3>
            <div className="w-10 h-0.5 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mx-auto mt-2"></div>
          </div>

          <div className="space-y-2">
            <button 
              onClick={() => setShowContactModal(true)}
              className="w-full flex items-center p-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200 hover:from-blue-100 hover:to-cyan-100 hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-sm">📞</span>
              </div>
              <div className="ml-2.5 flex-1">
                <span className="text-blue-800 font-bold text-sm block group-hover:translate-x-1 transition-transform duration-300">Contact Us</span>
                <span className="text-blue-600 text-xs">Get in touch with our team</span>
              </div>
            </button>

            <button 
              onClick={() => setShowHelpModal(true)}
              className="w-full flex items-center p-2.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:from-green-100 hover:to-emerald-100 hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-sm">❓</span>
              </div>
              <div className="ml-2.5 flex-1">
                <span className="text-green-800 font-bold text-sm block group-hover:translate-x-1 transition-transform duration-300">Help Center</span>
                <span className="text-green-600 text-xs">Find answers and guides</span>
              </div>
            </button>

            <button 
              onClick={() => setShowReportModal(true)}
              className="w-full flex items-center p-2.5 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg border border-red-200 hover:from-red-100 hover:to-rose-100 hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-red-500 to-rose-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-sm">⚠️</span>
              </div>
              <div className="ml-2.5 flex-1">
                <span className="text-red-800 font-bold text-sm block group-hover:translate-x-1 transition-transform duration-300">Report Abuse</span>
                <span className="text-red-600 text-xs">Report inappropriate content</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsLeftPanel;