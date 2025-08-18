/**
 * UI Store - Global state management for UI components and interactions
 * Manages modals, toasts, loading states, and other UI elements
 */

import { create } from 'zustand';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Modal types
export interface ModalState {
  isOpen: boolean;
  component?: React.ComponentType<any>;
  props?: any;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Sidebar types
export interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
  variant: 'default' | 'compact';
}

// UI state interface
interface UIState {
  // Theme
  theme: Theme;
  
  // Loading states
  globalLoading: boolean;
  loadingStates: Record<string, boolean>;
  
  // Toasts
  toasts: Toast[];
  
  // Modal
  modal: ModalState;
  
  // Sidebar
  sidebar: SidebarState;
  
  // Search
  searchQuery: string;
  searchResults: any[];
  isSearching: boolean;
  
  // Navigation
  currentPage: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
  
  // Responsive
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

// UI actions interface
interface UIActions {
  // Theme actions
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  
  // Loading actions
  setGlobalLoading: (loading: boolean) => void;
  setLoading: (key: string, loading: boolean) => void;
  getLoading: (key: string) => boolean;
  
  // Toast actions
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // Modal actions
  openModal: (component: React.ComponentType<any>, props?: any, size?: ModalState['size']) => void;
  closeModal: () => void;
  
  // Sidebar actions
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarVariant: (variant: SidebarState['variant']) => void;
  toggleSidebar: () => void;
  
  // Search actions
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: any[]) => void;
  setSearching: (searching: boolean) => void;
  clearSearch: () => void;
  
  // Navigation actions
  setCurrentPage: (page: string) => void;
  setBreadcrumbs: (breadcrumbs: Array<{ label: string; href?: string }>) => void;
  
  // Responsive actions
  setViewport: (isMobile: boolean, isTablet: boolean, isDesktop: boolean) => void;
}

// Combined UI store interface
export interface UIStore extends UIState, UIActions {}

// Initial state
const initialState: UIState = {
  theme: 'system',
  globalLoading: false,
  loadingStates: {},
  toasts: [],
  modal: {
    isOpen: false,
  },
  sidebar: {
    isOpen: false,
    isCollapsed: false,
    variant: 'default',
  },
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  currentPage: '',
  breadcrumbs: [],
  isMobile: false,
  isTablet: false,
  isDesktop: true,
};

// Generate unique ID for toasts
const generateId = () => Math.random().toString(36).substr(2, 9);

// Create UI store
export const useUIStore = create<UIStore>((set, get) => ({
  ...initialState,
  
  // Theme actions
  setTheme: (theme: Theme) => set(() => ({ theme })),
  
  toggleTheme: () => set((state) => ({
    theme: state.theme === 'light' ? 'dark' : 'light'
  })),
  
  // Loading actions
  setGlobalLoading: (globalLoading: boolean) => set(() => ({ globalLoading })),
  
  setLoading: (key: string, loading: boolean) => set((state) => ({
    loadingStates: {
      ...state.loadingStates,
      [key]: loading,
    },
  })),
  
  getLoading: (key: string) => get().loadingStates[key] || false,
  
  // Toast actions
  addToast: (toast: Omit<Toast, 'id'>) => set((state) => {
    const newToast: Toast = {
      id: generateId(),
      duration: 5000,
      ...toast,
    };
    
    return {
      toasts: [...state.toasts, newToast],
    };
  }),
  
  removeToast: (id: string) => set((state) => ({
    toasts: state.toasts.filter(toast => toast.id !== id),
  })),
  
  clearToasts: () => set(() => ({ toasts: [] })),
  
  // Modal actions
  openModal: (component: React.ComponentType<any>, props?: any, size: ModalState['size'] = 'md') => set(() => ({
    modal: {
      isOpen: true,
      component,
      props,
      size,
    },
  })),
  
  closeModal: () => set(() => ({
    modal: {
      isOpen: false,
      component: undefined,
      props: undefined,
    },
  })),
  
  // Sidebar actions
  setSidebarOpen: (isOpen: boolean) => set((state) => ({
    sidebar: { ...state.sidebar, isOpen },
  })),
  
  setSidebarCollapsed: (isCollapsed: boolean) => set((state) => ({
    sidebar: { ...state.sidebar, isCollapsed },
  })),
  
  setSidebarVariant: (variant: SidebarState['variant']) => set((state) => ({
    sidebar: { ...state.sidebar, variant },
  })),
  
  toggleSidebar: () => set((state) => ({
    sidebar: { ...state.sidebar, isOpen: !state.sidebar.isOpen },
  })),
  
  // Search actions
  setSearchQuery: (searchQuery: string) => set(() => ({ searchQuery })),
  
  setSearchResults: (searchResults: any[]) => set(() => ({ searchResults })),
  
  setSearching: (isSearching: boolean) => set(() => ({ isSearching })),
  
  clearSearch: () => set(() => ({
    searchQuery: '',
    searchResults: [],
    isSearching: false,
  })),
  
  // Navigation actions
  setCurrentPage: (currentPage: string) => set(() => ({ currentPage })),
  
  setBreadcrumbs: (breadcrumbs: Array<{ label: string; href?: string }>) => set(() => ({ breadcrumbs })),
  
  // Responsive actions
  setViewport: (isMobile: boolean, isTablet: boolean, isDesktop: boolean) => set(() => ({
    isMobile,
    isTablet,
    isDesktop,
  })),
}));

// Selector hooks for better performance
export const useTheme = () => useUIStore(state => state.theme);
export const useGlobalLoading = () => useUIStore(state => state.globalLoading);
export const useToasts = () => useUIStore(state => state.toasts);
export const useModal = () => useUIStore(state => state.modal);
export const useSidebar = () => useUIStore(state => state.sidebar);
export const useSearch = () => useUIStore(state => ({
  query: state.searchQuery,
  results: state.searchResults,
  isSearching: state.isSearching,
}));
export const useNavigation = () => useUIStore(state => ({
  currentPage: state.currentPage,
  breadcrumbs: state.breadcrumbs,
}));
export const useViewport = () => useUIStore(state => ({
  isMobile: state.isMobile,
  isTablet: state.isTablet,
  isDesktop: state.isDesktop,
}));

// Action hooks
export const useThemeActions = () => useUIStore(state => ({
  setTheme: state.setTheme,
  toggleTheme: state.toggleTheme,
}));

export const useLoadingActions = () => useUIStore(state => ({
  setGlobalLoading: state.setGlobalLoading,
  setLoading: state.setLoading,
  getLoading: state.getLoading,
}));

export const useToastActions = () => useUIStore(state => ({
  addToast: state.addToast,
  removeToast: state.removeToast,
  clearToasts: state.clearToasts,
}));

export const useModalActions = () => useUIStore(state => ({
  openModal: state.openModal,
  closeModal: state.closeModal,
}));

export const useSidebarActions = () => useUIStore(state => ({
  setSidebarOpen: state.setSidebarOpen,
  setSidebarCollapsed: state.setSidebarCollapsed,
  setSidebarVariant: state.setSidebarVariant,
  toggleSidebar: state.toggleSidebar,
}));

export const useSearchActions = () => useUIStore(state => ({
  setSearchQuery: state.setSearchQuery,
  setSearchResults: state.setSearchResults,
  setSearching: state.setSearching,
  clearSearch: state.clearSearch,
}));

export const useNavigationActions = () => useUIStore(state => ({
  setCurrentPage: state.setCurrentPage,
  setBreadcrumbs: state.setBreadcrumbs,
}));

// Helper hooks
export const useIsLoading = (key: string) => {
  return useUIStore(state => state.loadingStates[key] || false);
};

export const useShowToast = () => {
  const addToast = useUIStore(state => state.addToast);
  
  return {
    showSuccess: (title: string, message?: string) => addToast({ type: 'success', title, message }),
    showError: (title: string, message?: string) => addToast({ type: 'error', title, message }),
    showWarning: (title: string, message?: string) => addToast({ type: 'warning', title, message }),
    showInfo: (title: string, message?: string) => addToast({ type: 'info', title, message }),
  };
};

export default useUIStore;