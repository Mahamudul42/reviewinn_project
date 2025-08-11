import React, { useState } from 'react';
import {
  Star, Award, TrendingUp, Flame, Globe, Briefcase, Building2, MapPin, Package, Users, Crown, Zap, Shield, Target, ChevronRight, Filter, Eye, Clock, Home, Search, User, Bookmark, BookOpen
} from 'lucide-react';
import NavTabs from './NavTabs';
import CategoryFilterList from './CategoryFilterList';
import TrendingTopicsList from './TrendingTopicsList';
import RecentlyViewedList from './RecentlyViewedList';

interface NavigationLeftPanelProps {
  onCategoryFilter?: (category: string | null) => void;
  selectedCategory?: string | null;
}

const NavigationLeftPanel: React.FC<NavigationLeftPanelProps> = ({
  onCategoryFilter,
  selectedCategory
}) => {
  const [activeSection, setActiveSection] = useState<'navigation' | 'categories' | 'discover'>('navigation');

  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/', active: location.pathname === '/', count: null },
    { id: 'search', label: 'Advanced Search', icon: Search, path: '/search', active: location.pathname === '/search', count: null },
    { id: 'add-entity', label: 'Add Entity', icon: Building2, path: '/add-entity', active: location.pathname === '/add-entity', count: null },
    { id: 'profile', label: 'My Profile', icon: User, path: '/profile', active: location.pathname.startsWith('/profile'), count: null },
    { id: 'bookmarks', label: 'Saved Reviews', icon: Bookmark, path: '/bookmarks', active: location.pathname === '/bookmarks', count: 12 }
  ];

  const categoryFilters = [
    { id: null, label: 'All Reviews', icon: Globe, color: 'text-blue-600', bgColor: 'bg-blue-50', hoverColor: 'hover:bg-blue-100', count: 1247 },
    { id: 'person_professional', label: 'Professionals', icon: Briefcase, color: 'text-indigo-600', bgColor: 'bg-indigo-50', hoverColor: 'hover:bg-indigo-100', count: 486 },
    { id: 'company_institute', label: 'Companies', icon: Building2, color: 'text-green-600', bgColor: 'bg-green-50', hoverColor: 'hover:bg-green-100', count: 352 },
    { id: 'location_place', label: 'Places', icon: MapPin, color: 'text-pink-600', bgColor: 'bg-pink-50', hoverColor: 'hover:bg-pink-100', count: 234 },
    { id: 'product', label: 'Products', icon: Package, color: 'text-yellow-600', bgColor: 'bg-yellow-50', hoverColor: 'hover:bg-yellow-100', count: 175 }
  ];

  const trendingTopics = [
    { label: 'AI & Machine Learning', count: 45, trend: '+12%' },
    { label: 'Remote Work Culture', count: 38, trend: '+8%' },
    { label: 'EdTech Platforms', count: 29, trend: '+15%' },
    { label: 'Startup Reviews', count: 24, trend: '+6%' },
    { label: 'Career Coaching', count: 19, trend: '+20%' }
  ];

  const recentlyViewed = [
    { name: 'Dr. Sarah Johnson', type: 'Professor', rating: 4.8, category: 'person_professional', timestamp: '2 hours ago' },
    { name: 'TechCorp Solutions', type: 'Company', rating: 4.2, category: 'company_institute', timestamp: '5 hours ago' },
    { name: 'Central Library', type: 'Library', rating: 4.5, category: 'location_place', timestamp: '1 day ago' }
  ];

  const handleNavigation = (path: string) => {
    // Implement navigation logic (e.g., using useNavigate from react-router-dom)
  };

  const handleCategoryClick = (categoryId: string | null) => {
    onCategoryFilter?.(categoryId);
  };

  const tabs = [
    { id: 'navigation', label: 'Navigate', icon: Home },
    { id: 'discover', label: 'Discover', icon: TrendingUp },
    { id: 'categories', label: 'Filter', icon: Filter }
  ];

  return (
    <div className="w-80 h-screen sticky top-0 bg-white border-r border-gray-200 overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Star className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-xl text-gray-900">ReviewInn</h2>
            <p className="text-xs text-gray-500">Discover & Share</p>
          </div>
        </div>
        {/* Section Tabs */}
        <NavTabs tabs={tabs} activeTab={activeSection} onTabClick={id => setActiveSection(id as typeof activeSection)} />
      </div>

      {/* Content based on active section */}
      <div className="p-4">
        {activeSection === 'navigation' && (
          <div className="space-y-6">
            {/* Main Navigation */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Navigation</h4>
              <div className="space-y-1">
                {navigationItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all group ${
                      item.active
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className={`w-5 h-5 ${item.active ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {item.count && (
                      <span className="bg-blue-100 text-blue-600 text-xs font-medium px-2 py-1 rounded-full">
                        {item.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
              <h5 className="font-semibold text-gray-900 mb-3">Community Stats</h5>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">12.5K</div>
                  <div className="text-xs text-gray-600">Total Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">3.4K</div>
                  <div className="text-xs text-gray-600">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">856</div>
                  <div className="text-xs text-gray-600">Entities</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">2.1K</div>
                  <div className="text-xs text-gray-600">This Month</div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeSection === 'discover' && (
          <div className="space-y-6">
            {/* Trending Topics */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Trending Now</h4>
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <TrendingTopicsList topics={trendingTopics} />
            </div>
            {/* Recently Viewed */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Recently Viewed</h4>
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
              {recentlyViewed.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No recent activity</p>
                </div>
              ) : (
                <RecentlyViewedList items={recentlyViewed} />
              )}
            </div>
          </div>
        )}
        {activeSection === 'categories' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Filter by Category</h4>
              <button onClick={() => handleCategoryClick(null)} className="text-blue-600 text-sm hover:text-blue-700">Clear All</button>
            </div>
            <CategoryFilterList filters={categoryFilters} selectedCategory={selectedCategory ?? null} onCategoryClick={handleCategoryClick} />
            {/* Popular Tags */}
            <div className="mt-6">
              <h5 className="font-medium text-gray-900 mb-3">Popular Tags</h5>
              <div className="flex flex-wrap gap-2">
                {['excellent', 'recommended', 'value-for-money', 'professional', 'helpful', 'innovative'].map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-blue-100 hover:text-blue-700 cursor-pointer transition-colors">#{tag}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Footer */}
      <div className="p-4 border-t border-gray-100 mt-6">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Award className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-purple-900">Pro Tip</span>
          </div>
          <p className="text-sm text-purple-700">Use specific keywords when searching to find the most relevant reviews!</p>
        </div>
      </div>
    </div>
  );
};

export default NavigationLeftPanel;
