import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Panel data interfaces
export interface PanelDataState {
  leftPanel: {
    data: any;
    loading: boolean;
    error: string | null;
    lastUpdated: number | null;
  };
  rightPanel: {
    data: any;
    loading: boolean;
    error: string | null;
    lastUpdated: number | null;
  };
}

interface PanelDataContextType {
  panelData: PanelDataState;
  updateLeftPanel: (data: any, loading?: boolean, error?: string | null) => void;
  updateRightPanel: (data: any, loading?: boolean, error?: string | null) => void;
  setLeftPanelLoading: (loading: boolean) => void;
  setRightPanelLoading: (loading: boolean) => void;
  isLeftPanelFresh: () => boolean;
  isRightPanelFresh: () => boolean;
  clearPanelData: () => void;
}

const PanelDataContext = createContext<PanelDataContextType | undefined>(undefined);

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

const initialState: PanelDataState = {
  leftPanel: {
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  },
  rightPanel: {
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  }
};

export const PanelDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [panelData, setPanelData] = useState<PanelDataState>(() => {
    // Try to restore from sessionStorage
    try {
      const saved = sessionStorage.getItem('reviewinn_panel_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Check if data is still fresh
        const now = Date.now();
        const leftFresh = parsed.leftPanel?.lastUpdated && (now - parsed.leftPanel.lastUpdated) < CACHE_DURATION;
        const rightFresh = parsed.rightPanel?.lastUpdated && (now - parsed.rightPanel.lastUpdated) < CACHE_DURATION;
        
        return {
          leftPanel: leftFresh ? parsed.leftPanel : initialState.leftPanel,
          rightPanel: rightFresh ? parsed.rightPanel : initialState.rightPanel
        };
      }
    } catch (error) {
      console.warn('Failed to restore panel data from sessionStorage:', error);
    }
    return initialState;
  });

  // Save to sessionStorage whenever data changes
  useEffect(() => {
    try {
      sessionStorage.setItem('reviewinn_panel_data', JSON.stringify(panelData));
    } catch (error) {
      console.warn('Failed to save panel data to sessionStorage:', error);
    }
  }, [panelData]);

  const updateLeftPanel = useCallback((data: any, loading = false, error: string | null = null) => {
    setPanelData(prev => ({
      ...prev,
      leftPanel: {
        data,
        loading,
        error,
        lastUpdated: Date.now()
      }
    }));
  }, []);

  const updateRightPanel = useCallback((data: any, loading = false, error: string | null = null) => {
    setPanelData(prev => ({
      ...prev,
      rightPanel: {
        data,
        loading,
        error,
        lastUpdated: Date.now()
      }
    }));
  }, []);

  const setLeftPanelLoading = useCallback((loading: boolean) => {
    setPanelData(prev => ({
      ...prev,
      leftPanel: {
        ...prev.leftPanel,
        loading
      }
    }));
  }, []);

  const setRightPanelLoading = useCallback((loading: boolean) => {
    setPanelData(prev => ({
      ...prev,
      rightPanel: {
        ...prev.rightPanel,
        loading
      }
    }));
  }, []);

  const isLeftPanelFresh = useCallback((): boolean => {
    if (!panelData.leftPanel.lastUpdated) return false;
    return (Date.now() - panelData.leftPanel.lastUpdated) < CACHE_DURATION;
  }, [panelData.leftPanel.lastUpdated]);

  const isRightPanelFresh = useCallback((): boolean => {
    if (!panelData.rightPanel.lastUpdated) return false;
    return (Date.now() - panelData.rightPanel.lastUpdated) < CACHE_DURATION;
  }, [panelData.rightPanel.lastUpdated]);

  const clearPanelData = useCallback(() => {
    setPanelData(initialState);
    try {
      sessionStorage.removeItem('reviewinn_panel_data');
    } catch (error) {
      console.warn('Failed to clear panel data from sessionStorage:', error);
    }
  }, []);

  return (
    <PanelDataContext.Provider value={{
      panelData,
      updateLeftPanel,
      updateRightPanel,
      setLeftPanelLoading,
      setRightPanelLoading,
      isLeftPanelFresh,
      isRightPanelFresh,
      clearPanelData
    }}>
      {children}
    </PanelDataContext.Provider>
  );
};

export const usePanelData = (): PanelDataContextType => {
  const context = useContext(PanelDataContext);
  if (!context) {
    throw new Error('usePanelData must be used within a PanelDataProvider');
  }
  return context;
};

export default PanelDataContext;