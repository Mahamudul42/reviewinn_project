import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EntityListPageLayout from './components/EntityListPageLayout';
import { entityService, reviewService } from '../../api/services';
import { enhanceEntityWithVerification } from '../../shared/utils/verificationUtils';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import EntitySearchBar from './components/EntitySearchBar';
import EntityGrid from './components/EntityGrid';
import EntitySearchResults from './components/EntitySearchResults';
import type { Entity, SearchResult } from '../../types';

const EntityListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();

  // State for entities and data
  const [entities, setEntities] = useState<Entity[]>([]);
  const [filteredEntities, setFilteredEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [totalEntities, setTotalEntities] = useState(0);

  // Initial load for entities using independent service with efficient enhancement
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Load entities from enhanced entity service (with review stats and engagement metrics)
        const entityData = await entityService.getEntities({
          limit: 20,
          sortBy: 'name',
          sortOrder: 'asc'
        });
        
        if (entityData && entityData.entities && entityData.entities.length > 0) {
          // Step 1: Show basic entities immediately for fast UI feedback
          const basicEntities = entityData.entities.map(entity => 
            enhanceEntityWithVerification(entity)
          );
          
          console.log('📊 Enhanced entities loaded:', basicEntities.length, 'entities');
          console.log('📊 Sample entity data (all fields):', JSON.stringify(basicEntities[0], null, 2));
          console.log('📊 Sample entity keys:', Object.keys(basicEntities[0]));
          console.log('📊 Raw entityData:', entityData);
          
          setEntities(basicEntities);
          setFilteredEntities(basicEntities);
          setTotalEntities(entityData.total || 0);
          setLoading(false); // Show UI immediately with basic data
          
          // The unified backend service should provide all aggregated data directly
          console.log('✅ Using unified backend data directly - no client-side enhancement needed');
        } else {
          // No entities found - this is not an error, just empty state
          setEntities([]);
          setFilteredEntities([]);
          setTotalEntities(0);
          setLoading(false);
        }
        
      } catch (err) {
        console.error('Failed to load entities:', err);
        setError('Failed to load entities. Please try again later.');
        setLoading(false);
      }
    })();
  }, []); // Empty dependency array

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
    console.log('Search results received:', results);
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

  // Get entities to display
  const displayEntities = isSearchMode ? filteredEntities : entities;

  console.log('EntityListPage render - entities:', entities.length, 'filtered:', filteredEntities.length, 'display:', displayEntities.length);

  if (loading) {
    return (
      <EntityListPageLayout>
        <div className="w-full max-w-2xl py-8 h-full">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading entities...</p>
            </div>
          </div>
        </div>
      </EntityListPageLayout>
    );
  }

  if (error) {
    return (
      <EntityListPageLayout>
        <div className="w-full max-w-2xl py-8 h-full">
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
      </EntityListPageLayout>
    );
  }

  return (
    <EntityListPageLayout>
      {/* Entity List Middle Panel Content */}
      <div className="w-full space-y-6 px-8">
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
        </div>
      </div>
    </EntityListPageLayout>
  );
};

export default EntityListPage;