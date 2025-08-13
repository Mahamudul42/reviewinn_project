import React, { useEffect, ReactNode } from 'react';
import { usePanelData } from '../../contexts/PanelDataContext';
import { useReviewInnLeftPanel } from '../../features/common/hooks/useReviewInnLeftPanel';
import ReviewInnLeftPanel from '../../features/common/components/ReviewInnLeftPanel';
import RightPanelReviewinn from '../panels/RightPanel/RightPanelReviewinn';
import PanelLoadingState from '../panels/components/PanelLoadingState';

interface ThreePanelLayoutProps {
  children: ReactNode;
  leftPanelTitle?: string;
  rightPanelTitle?: string;
  centerPanelWidth?: string;
  className?: string;
}

const ThreePanelLayout: React.FC<ThreePanelLayoutProps> = ({
  children,
  leftPanelTitle = "🌟 Community Highlights",
  rightPanelTitle = "💡 Insights & New Entities",
  centerPanelWidth = "600px",
  className = ""
}) => {
  const {
    panelData,
    updateLeftPanel,
    setLeftPanelLoading,
    isLeftPanelFresh
  } = usePanelData();

  // Load left panel data
  const { data: leftPanelData, loading: leftLoading, error: leftError } = useReviewInnLeftPanel();

  // Update left panel data when loaded
  useEffect(() => {
    if (!isLeftPanelFresh() && leftPanelData) {
      console.log('🔄 ThreePanelLayout: Updating left panel data in context');
      updateLeftPanel(leftPanelData, leftLoading, leftError);
    }
  }, [leftPanelData, leftLoading, leftError, isLeftPanelFresh, updateLeftPanel]);

  // Update loading state in context
  useEffect(() => {
    setLeftPanelLoading(leftLoading);
  }, [leftLoading, setLeftPanelLoading]);

  // Determine which data to use
  const shouldUseLeftCache = isLeftPanelFresh() && panelData.leftPanel.data;
  const displayLeftLoading = shouldUseLeftCache ? false : (panelData.leftPanel.loading || leftLoading);
  const displayLeftError = shouldUseLeftCache ? null : (panelData.leftPanel.error || leftError);

  console.log('🎨 ThreePanelLayout: Panel state', {
    shouldUseLeftCache,
    hasLeftData: !!panelData.leftPanel.data,
    leftLoading,
    displayLeftLoading,
    leftPanelFresh: isLeftPanelFresh()
  });

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 ${className}`}>
      <div className="container mx-auto px-4 py-6">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4">
            Welcome to ReviewInn
          </h1>
        </div>

        {/* Three Columns with Facebook-Style Independent Scrolling */}
        <div style={{ 
          display: 'flex', 
          gap: '24px', 
          maxWidth: '1400px',
          margin: '0 auto',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          minHeight: 'calc(100vh - 200px)',
          maxHeight: 'calc(100vh - 200px)',
          position: 'relative'
        }}>
          
          {/* Left Panel - Facebook-Style Infinite Scrolling */}
          <div style={{ 
            width: '350px', 
            flexShrink: 0, 
            height: 'calc(100vh - 200px)',
            position: 'sticky',
            top: '0'
          }}>
            <div className="left-panel-container" style={{ 
              background: 'white', 
              borderRadius: '16px', 
              padding: '16px', 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
              border: '1px solid #e5e7eb',
              height: '100%',
              overflowY: 'auto',
              overflowX: 'hidden',
              scrollBehavior: 'smooth',
              position: 'relative'
            }}>
              <h2 style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                marginBottom: '16px', 
                color: '#111827',
                wordWrap: 'break-word',
                overflow: 'hidden'
              }}>
                {leftPanelTitle}
              </h2>
              <div style={{ 
                overflow: 'hidden',
                wordWrap: 'break-word',
                wordBreak: 'break-word',
                maxWidth: '100%'
              }}>
                {/* Global CSS for left panel overflow fixes and scrollbar styling */}
                <style>{`
                  /* Facebook-style scrollbar styling for infinite content */
                  .left-panel-container,
                  .right-panel-container,
                  .center-panel-container {
                    /* Firefox scrollbar styling */
                    scrollbar-width: thin;
                    scrollbar-color: transparent transparent;
                    transition: scrollbar-color 0.2s ease;
                  }
                  
                  .left-panel-container:hover,
                  .right-panel-container:hover,
                  .center-panel-container:hover {
                    scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
                  }
                  
                  /* Webkit scrollbar styling (Chrome, Safari, Edge) */
                  .left-panel-container::-webkit-scrollbar,
                  .right-panel-container::-webkit-scrollbar,
                  .center-panel-container::-webkit-scrollbar {
                    width: 6px;
                    background: transparent;
                  }
                  
                  .left-panel-container::-webkit-scrollbar-track,
                  .right-panel-container::-webkit-scrollbar-track,
                  .center-panel-container::-webkit-scrollbar-track {
                    background: transparent;
                    margin: 2px;
                  }
                  
                  .left-panel-container::-webkit-scrollbar-thumb,
                  .right-panel-container::-webkit-scrollbar-thumb,
                  .center-panel-container::-webkit-scrollbar-thumb {
                    background: transparent;
                    border-radius: 10px;
                    border: 1px solid transparent;
                    background-clip: content-box;
                    transition: all 0.2s ease;
                    min-height: 20px;
                  }
                  
                  /* Show scrollbar on hover (Facebook-style) */
                  .left-panel-container:hover::-webkit-scrollbar-thumb,
                  .right-panel-container:hover::-webkit-scrollbar-thumb,
                  .center-panel-container:hover::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.15);
                    background-clip: content-box;
                  }
                  
                  /* Darker on thumb hover */
                  .left-panel-container::-webkit-scrollbar-thumb:hover,
                  .right-panel-container::-webkit-scrollbar-thumb:hover,
                  .center-panel-container::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 0, 0, 0.25) !important;
                    background-clip: content-box;
                  }
                  
                  /* Active state */
                  .left-panel-container::-webkit-scrollbar-thumb:active,
                  .right-panel-container::-webkit-scrollbar-thumb:active,
                  .center-panel-container::-webkit-scrollbar-thumb:active {
                    background: rgba(0, 0, 0, 0.4) !important;
                    background-clip: content-box;
                  }
                  
                  /* Smooth transitions for infinite content */
                  .left-panel-container,
                  .right-panel-container,
                  .center-panel-container {
                    -webkit-overflow-scrolling: touch;
                    scroll-behavior: smooth;
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
                {displayLeftLoading ? (
                  <PanelLoadingState
                    title=""
                    subtitle="Loading community engagement data..."
                    cardCount={3}
                  />
                ) : (
                  <ReviewInnLeftPanel />
                )}
              </div>
            </div>
          </div>

          {/* Center Panel - Dynamic Content */}
          <div className="center-panel-container" style={{ 
            width: centerPanelWidth, 
            flexShrink: 0, 
            height: 'calc(100vh - 200px)',
            overflowY: 'auto', 
            overflowX: 'hidden',
            scrollBehavior: 'smooth',
            position: 'relative',
            minHeight: 'calc(100vh - 200px)'
          }}>
            {children}
          </div>

          {/* Right Panel - Facebook-Style Infinite Scrolling */}
          <div style={{ 
            width: '350px', 
            flexShrink: 0, 
            height: 'calc(100vh - 200px)',
            position: 'sticky',
            top: '0'
          }}>
            <div className="right-panel-container" style={{ 
              background: 'white', 
              borderRadius: '16px', 
              padding: '16px', 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
              border: '1px solid #e5e7eb',
              height: '100%',
              overflowY: 'auto',
              overflowX: 'hidden',
              scrollBehavior: 'smooth',
              position: 'relative'
            }}>
              <h2 style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                marginBottom: '16px', 
                color: '#111827',
                wordWrap: 'break-word',
                overflow: 'hidden'
              }}>
                {rightPanelTitle}
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
                <RightPanelReviewinn />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreePanelLayout;