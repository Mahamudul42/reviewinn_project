import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import ThreePanelLayout from '../../shared/layouts/ThreePanelLayout';
import { entityService } from '../../api/services';
import { enhanceEntityWithVerification } from '../../shared/utils/verificationUtils';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import EntitySearchBar from './components/EntitySearchBar';
import EntityGrid from './components/EntityGrid';
import EntitySearchResults from './components/EntitySearchResults';
import PanelLoadingState from '../../shared/panels/components/PanelLoadingState';
import { EntityCreationProvider } from './contexts/EntityCreationContext';
import AddEntityContent from './components/AddEntityContent';
import type { Entity, SearchResult } from '../../types/index';

type TabType = 'browse' | 'add-entity';


const EntityListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: currentUser, isLoading: authLoading } = useUnifiedAuth();

  // Tab state - check URL params for initial tab
  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams.get('tab') as TabType) || 'browse'
  );

  // State for entities and data
  const [entities, setEntities] = useState<Entity[]>([]);
  const [filteredEntities, setFilteredEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [totalEntities, setTotalEntities] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreEntities, setHasMoreEntities] = useState(true);

  // Simplified state - EntitySearchBar now handles all filtering
  // Remove duplicate filtering state

  // Initial load for entities - EntitySearchBar now handles all filtering
  useEffect(() => {
    loadInitialEntities();
  }, []); // Run only once on mount - EntitySearchBar handles filtering

  const loadInitialEntities = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load initial entities without filters (EntitySearchBar will handle filtering)
      const entityData = await entityService.getEntities({ 
        limit: 20, 
        page: 1,
        sortBy: 'createdAt', 
        sortOrder: 'desc' 
      });
      
      if (entityData && entityData.entities && entityData.entities.length > 0) {
        // Step 1: Show basic entities immediately for fast UI feedback
        const basicEntities = entityData.entities.map(entity => 
          enhanceEntityWithVerification(entity)
        );
        
        setEntities(basicEntities);
        setFilteredEntities(basicEntities);
        setTotalEntities(entityData.total || 0);
        setCurrentPage(1);
        setHasMoreEntities(basicEntities.length < (entityData.total || 0));
        setLoading(false); // Show UI immediately with basic data
      } else {
        // No entities found - this is not an error, just empty state
        setEntities([]);
        setFilteredEntities([]);
        setTotalEntities(0);
        setCurrentPage(1);
        setHasMoreEntities(false);
        setLoading(false);
      }
      
    } catch (err) {
      console.error('Failed to load entities:', err);
      setError('Failed to load entities. Please try again later.');
      setLoading(false);
    }
  };

  // Handle entity click
  const handleEntityClick = async (entityId: string) => {
    try {
      // Record view for analytics if user is authenticated
      if (currentUser && currentUser.id) {
        await entityService.recordEntityView(entityId, currentUser.id.toString());
      }
    } catch (error) {
      console.warn('Failed to record entity view:', error);
      // Don't block navigation if view tracking fails
    }
    
    // Navigate to entity detail page
    navigate(`/entity/${entityId}`);
  };

  // Handle search results
  const handleSearchResults = (results: SearchResult) => {
    setSearchResults(results);
    setFilteredEntities(results.entities);
    setIsSearchMode(results.entities.length > 0 || results.total > 0);
  };

  // Handle entity selection from search
  const handleEntitySelect = (entity: Entity) => {
    handleEntityClick(entity.entity_id);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setIsSearchMode(false);
    setFilteredEntities(entities);
    setSearchResults(null);
  };

  // Load more entities function
  const loadMoreEntities = async () => {
    if (loadingMore || !hasMoreEntities || isSearchMode) return;
    
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const entityData = await entityService.getEntities({ 
        limit: 20, 
        page: nextPage,
        sortBy: 'createdAt', 
        sortOrder: 'desc' 
      });
      
      if (entityData && entityData.entities && entityData.entities.length > 0) {
        const newEntities = entityData.entities.map(entity => 
          enhanceEntityWithVerification(entity)
        );
        
        const updatedEntities = [...entities, ...newEntities];
        setEntities(updatedEntities);
        setFilteredEntities(updatedEntities);
        setCurrentPage(nextPage);
        setHasMoreEntities(updatedEntities.length < (entityData.total || 0));
      } else {
        setHasMoreEntities(false);
      }
    } catch (err) {
      console.error('Failed to load more entities:', err);
      // Don't show error for load more failure, just disable the button
      setHasMoreEntities(false);
    } finally {
      setLoadingMore(false);
    }
  };

  // Get entities to display
  const displayEntities = isSearchMode ? filteredEntities : entities;

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'browse':
        return (
          <div className="w-full space-y-6 px-8">
            {/* Page Title */}
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Browse Entities</h2>
            </div>

            {/* Search Bar */}
            <div className="bg-white border-2 border-gray-800 shadow-lg rounded-xl p-6">
              <EntitySearchBar
                onSearchResults={handleSearchResults}
                onEntitySelect={handleEntitySelect}
                placeholder="Search entities like restaurants, hotels, shops..."
                currentUser={currentUser}
                authState={{ isLoading: authLoading }}
              />
            </div>

            {/* Search Results Info */}
            <EntitySearchResults
              searchResults={searchResults}
              isSearchMode={isSearchMode}
              onClearSearch={handleClearSearch}
            />

            {/* Entity Grid */}
            <div className="bg-white border-2 border-gray-800 shadow-lg rounded-xl p-6">
              <EntityGrid
                entities={displayEntities}
                loading={loading}
                isSearchMode={isSearchMode}
                onEntityClick={handleEntityClick}
                currentUser={currentUser}
                authState={{ isLoading: authLoading }}
                onRequireAuth={() => {
                  if (authLoading) return;
                  if (!currentUser) {
                    navigate('/login', { state: { from: '/entities' } });
                  }
                }}
              />
              
              {/* Load More Button */}
              {!isSearchMode && hasMoreEntities && displayEntities.length > 0 && (
                <div className="mt-8 text-center">
                  <button
                    onClick={loadMoreEntities}
                    disabled={loadingMore}
                    className={`px-8 py-3 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105 ${
                      loadingMore
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl'
                    }`}
                    style={!loadingMore ? { 
                      boxShadow: '0 10px 25px rgba(147, 51, 234, 0.3), 0 4px 12px rgba(99, 102, 241, 0.2)' 
                    } : {}}
                  >
                    {loadingMore ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                        <span>Loading More...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Plus className="w-4 h-4" />
                        <span>Load More Entities</span>
                      </div>
                    )}
                  </button>
                </div>
              )}

              {/* End of Results Message */}
              {!isSearchMode && !hasMoreEntities && displayEntities.length > 0 && (
                <div className="mt-8 text-center">
                  <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg text-gray-600">
                    <span>✅ You've reached the end of all entities!</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'add-entity':
        return (
          <EntityCreationProvider>
            <AddEntityContent />
          </EntityCreationProvider>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <ThreePanelLayout 
        leftPanelTitle="🌟 Community Highlights"
        rightPanelTitle="💡 Insights & New Entities"
      >
        <div className="w-full py-8 h-full">
          <PanelLoadingState
            title="Browse Entities"
            subtitle="Loading businesses, services, and organizations..."
            cardCount={6}
            className=""
          />
        </div>
      </ThreePanelLayout>
    );
  }

  if (error) {
    return (
      <ThreePanelLayout 
        leftPanelTitle="🌟 Community Highlights"
        rightPanelTitle="💡 Insights & New Entities"
      >
        <div className="w-full py-8 h-full">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </ThreePanelLayout>
    );
  }

  return (
    <ThreePanelLayout 
      leftPanelTitle="🌟 Community Highlights"
      rightPanelTitle="💡 Insights & New Entities"
      pageTitle="Entities"
      showPageHeader={true}
      headerGradient="from-indigo-600 via-purple-600 to-blue-800"
      centerPanelClassName="space-y-6"
    >
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
        <nav className="flex space-x-2 p-2 bg-gradient-to-r from-gray-50 via-white to-gray-50">
          {[
            { id: 'browse', label: 'Browse Entities', icon: Search },
            { id: 'add-entity', label: 'Add Entity', icon: Plus },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as TabType)}
              className={`relative flex items-center space-x-3 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105 flex-1 justify-center group ${
                activeTab === id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 border border-gray-100 hover:border-gray-200 hover:shadow-md'
              }`}
              style={activeTab === id ? { 
                boxShadow: '0 10px 25px rgba(147, 51, 234, 0.3), 0 4px 12px rgba(99, 102, 241, 0.2)' 
              } : {}}
            >
              <Icon className={`w-5 h-5 transition-all duration-300 ${activeTab === id ? 'text-white transform rotate-12' : 'group-hover:scale-110'}`} />
              <span className="font-semibold tracking-wide">{label}</span>
              {activeTab === id && (
                <>
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-white/30 rounded-full animate-ping" />
                </>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </ThreePanelLayout>
  );
};

export default EntityListPage;