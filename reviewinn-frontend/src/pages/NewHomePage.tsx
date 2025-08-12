import React from 'react';
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';

// Left Panel Components
import ReviewInnLeftPanel from '../features/common/components/ReviewInnLeftPanel';

// Center Content (Test Home)
import { useTestHomeData } from '../features/common/hooks/useTestHomeData';
import { MiddlePanelPublic, MiddlePanelAuth } from '../shared/panels/MiddlePanel';

// Right Panel Components
import RightPanelReviewinn from '../shared/panels/RightPanel/RightPanelReviewinn';

const NewHomePage: React.FC = () => {
  const { user, isAuthenticated } = useUnifiedAuth();
  
  // Data hooks - using the same pattern as TestHomePage
  const {
    reviews,
    loading: centerLoading,
    error: centerError,
    hasMoreReviews,
    loadingMore,
    handleLoadMore
  } = useTestHomeData();

  // Test Home handlers - same as TestHomePage
  const handleCommentAdd = async (reviewId: string, content: string, parentId?: string) => {
    console.log('Comment add not implemented in test page:', reviewId, content, parentId);
  };

  const handleCommentDelete = async (reviewId: string, commentId: string) => {
    console.log('Comment delete not implemented in test page:', reviewId, commentId);
  };

  const handleCommentReaction = async (reviewId: string, commentId: string, reaction: string | null) => {
    console.log('Comment reaction not implemented in test page:', reviewId, commentId, reaction);
  };

  const handleAddReviewClick = () => {
    console.log('Add review modal would open here');
  };

  const displayUser = user || {
    name: 'Guest',
    avatar: 'https://ui-avatars.com/api/?name=Guest&background=gray&color=ffffff'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-6">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4">
            Welcome to ReviewInn
          </h1>
        </div>

        {/* Three Columns with Proper Alignment - Height Auto */}
        <div style={{ 
          display: 'flex', 
          gap: '24px', 
          maxWidth: '1400px',
          margin: '0 auto',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          
          {/* Left Panel - Auto Height Based on Content */}
          <div style={{ width: '350px', flexShrink: 0 }}>
            <div className="left-panel-container" style={{ 
              background: 'white', 
              borderRadius: '16px', 
              padding: '20px', 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
              border: '1px solid #e5e7eb'
            }}>
              <h2 style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                marginBottom: '16px', 
                color: '#111827',
                wordWrap: 'break-word',
                overflow: 'hidden'
              }}>
                🌟 Community Highlights
              </h2>
              <div style={{ 
                overflow: 'hidden',
                wordWrap: 'break-word',
                wordBreak: 'break-word',
                maxWidth: '100%'
              }}>
                {/* Global CSS for left panel overflow fixes and scrollbar styling */}
                <style>{`
                  /* Custom scrollbar styling for panels */
                  .left-panel-container::-webkit-scrollbar,
                  .right-panel-container::-webkit-scrollbar {
                    width: 6px;
                  }
                  .left-panel-container::-webkit-scrollbar-track,
                  .right-panel-container::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 3px;
                  }
                  .left-panel-container::-webkit-scrollbar-thumb,
                  .right-panel-container::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 3px;
                  }
                  .left-panel-container::-webkit-scrollbar-thumb:hover,
                  .right-panel-container::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                  }
                  
                  .left-panel-container h3,
                  .left-panel-container h4,
                  .left-panel-container h5,
                  .left-panel-container .font-semibold,
                  .left-panel-container .font-medium,
                  .left-panel-container .font-bold {
                    word-wrap: break-word !important;
                    word-break: break-word !important;
                    overflow-wrap: break-word !important;
                    max-width: 100% !important;
                    white-space: normal !important;
                    hyphens: auto !important;
                  }
                  .left-panel-container .flex {
                    min-width: 0 !important;
                    flex-wrap: wrap !important;
                  }
                  .left-panel-container .flex-1 {
                    min-width: 0 !important;
                  }
                  .left-panel-container .truncate {
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                    white-space: nowrap !important;
                    max-width: 200px !important;
                  }
                `}</style>
                {centerLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
                    <div style={{ animation: 'spin 1s linear infinite', borderRadius: '50%', width: '48px', height: '48px', border: '2px solid #e5e7eb', borderTopColor: '#2563eb' }}></div>
                  </div>
                ) : (
                  <ReviewInnLeftPanel />
                )}
              </div>
            </div>
          </div>

          {/* Center Panel - Fixed Width for Perfect Centering */}
          <div style={{ width: '600px', flexShrink: 0 }}>
            {centerError ? (
              <div style={{ textAlign: 'center', padding: '32px', background: 'white', borderRadius: '16px' }}>
                <div style={{ fontSize: '60px', marginBottom: '16px' }}>😔</div>
                <p style={{ color: '#6b7280' }}>Unable to load test home content: {centerError}</p>
              </div>
            ) : (
              <div>
                {isAuthenticated ? (
                  <MiddlePanelAuth
                    userAvatar={displayUser.avatar || ''}
                    userName={displayUser.name || 'Guest'}
                    onAddReviewClick={handleAddReviewClick}
                    reviewBarRef={React.createRef()}
                    reviews={reviews}
                    entities={[]} // No entities for test page
                    hasMoreReviews={hasMoreReviews}
                    loadingMore={loadingMore}
                    loading={centerLoading}
                    onLoadMore={handleLoadMore}
                    onCommentAdd={handleCommentAdd}
                    onCommentDelete={handleCommentDelete}
                    onCommentReaction={handleCommentReaction}
                    onGiveReviewClick={() => console.log('Give review would open here')}
                  />
                ) : (
                  <MiddlePanelPublic
                    userAvatar={displayUser.avatar || ''}
                    userName={displayUser.name || 'Guest'}
                    onAddReviewClick={handleAddReviewClick}
                    reviewBarRef={React.createRef()}
                    reviews={reviews}
                    entities={[]} // No entities for test page
                    hasMoreReviews={hasMoreReviews}
                    loadingMore={loadingMore}
                    loading={centerLoading}
                    onLoadMore={handleLoadMore}
                    onCommentAdd={handleCommentAdd}
                    onCommentDelete={handleCommentDelete}
                    onCommentReaction={handleCommentReaction}
                    onGiveReviewClick={() => console.log('Give review would open here')}
                  />
                )}
              </div>
            )}
          </div>

          {/* Right Panel - Auto Height Based on Content */}
          <div style={{ width: '350px', flexShrink: 0 }}>
            <div className="right-panel-container" style={{ 
              background: 'white', 
              borderRadius: '16px', 
              padding: '20px', 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
              border: '1px solid #e5e7eb'
            }}>
              <h2 style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                marginBottom: '16px', 
                color: '#111827',
                wordWrap: 'break-word',
                overflow: 'hidden'
              }}>
                💡 Insights & New Entities
              </h2>
              <div style={{ 
                overflow: 'hidden',
                wordWrap: 'break-word',
                wordBreak: 'break-word',
                maxWidth: '100%'
              }}>
                {/* Global CSS for right panel overflow fixes */}
                <style>{`
                  .right-panel-container h3,
                  .right-panel-container h4,
                  .right-panel-container .font-semibold,
                  .right-panel-container .font-medium {
                    word-wrap: break-word !important;
                    word-break: break-word !important;
                    overflow-wrap: break-word !important;
                    max-width: 100% !important;
                    white-space: normal !important;
                    hyphens: auto !important;
                  }
                  .right-panel-container .flex {
                    min-width: 0 !important;
                    flex-wrap: wrap !important;
                  }
                  .right-panel-container .flex-1 {
                    min-width: 0 !important;
                  }
                  .right-panel-container .truncate {
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                    white-space: nowrap !important;
                    max-width: 200px !important;
                  }
                `}</style>
                {centerLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
                    <div style={{ animation: 'spin 1s linear infinite', borderRadius: '50%', width: '48px', height: '48px', border: '2px solid #e5e7eb', borderTopColor: '#2563eb' }}></div>
                  </div>
                ) : (
                  <RightPanelReviewinn hideInternalLoading={true} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewHomePage;