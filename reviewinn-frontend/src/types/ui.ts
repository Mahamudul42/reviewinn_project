// Enhanced UI Types
// Comprehensive type definitions for UI components and interactions

import { EntityCategory } from './index';

// Base component props that most UI components should have
export interface BaseComponentProps {
  className?: string;
  testId?: string;
  'data-testid'?: string;
}

// Loading states for async operations
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Generic async state
export interface AsyncState<T = any> {
  data?: T;
  loading: boolean;
  error?: string | Error;
  lastFetched?: Date;
}

// Pagination types
export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// Search and filter types
export interface SearchState {
  query: string;
  filters: Record<string, any>;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
}

// Category related types
export interface CategoryDisplayInfo {
  id: number;
  name: string;
  entityCategory: EntityCategory;
  icon: React.ComponentType<any>;
  gradientClasses: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    text: string;
  };
}

// Form types
export type FormFieldType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'time';

export interface FormField {
  id: string;
  name: string;
  type: FormFieldType;
  label?: string;
  placeholder?: string;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  options?: string[] | Array<{ value: string; label: string }>;
}

export interface FormState<T = Record<string, any>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
}

// Modal and dialog types
export interface ModalState {
  isOpen: boolean;
  title?: string;
  content?: React.ReactNode;
  actions?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
}

// Notification/Toast types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationState {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary';
  }>;
}

// Theme types
export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeState {
  mode: ThemeMode;
  primaryColor: string;
  radius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  animations: boolean;
}

// Layout types
export type LayoutVariant = 'default' | 'sidebar' | 'full-width' | 'centered';

export interface LayoutState {
  variant: LayoutVariant;
  sidebarOpen: boolean;
  headerVisible: boolean;
  footerVisible: boolean;
}

// Animation types
export type AnimationType = 'fade' | 'slide' | 'scale' | 'rotate' | 'bounce';

export interface AnimationConfig {
  type: AnimationType;
  duration: number;
  delay?: number;
  easing?: string;
}

// Keyboard shortcuts
export interface KeyboardShortcut {
  key: string;
  modifiers?: Array<'ctrl' | 'alt' | 'shift' | 'meta'>;
  action: () => void;
  description: string;
}

// Accessibility types
export interface A11yProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-selected'?: boolean;
  'aria-disabled'?: boolean;
  role?: string;
  tabIndex?: number;
}

// Event handler types
export type ClickHandler = (event: React.MouseEvent) => void;
export type ChangeHandler<T = string> = (value: T) => void;
export type SubmitHandler<T = any> = (data: T) => void | Promise<void>;

// Generic props for interactive components
export interface InteractiveProps extends BaseComponentProps, A11yProps {
  disabled?: boolean;
  loading?: boolean;
  onClick?: ClickHandler;
  onFocus?: (event: React.FocusEvent) => void;
  onBlur?: (event: React.FocusEvent) => void;
}

// Props for components that can be polymorphic (rendered as different elements)
export interface PolymorphicProps<T extends React.ElementType = 'div'> {
  as?: T;
}

// Responsive prop types
export type ResponsiveValue<T> = T | {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  wide?: T;
};

// Data table types
export interface TableColumn<T = any> {
  key: keyof T;
  title: string;
  render?: (value: T[keyof T], record: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
}

export interface TableState<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading: boolean;
  pagination: PaginationState;
  selection: {
    selectedRowKeys: string[];
    selectedRows: T[];
  };
  sorting: {
    column?: keyof T;
    direction: 'asc' | 'desc';
  };
}

// File upload types
export interface FileUploadState {
  files: File[];
  uploading: boolean;
  progress: number;
  error?: string;
  urls?: string[];
}

// Color scheme types for consistent theming
export interface ColorScheme {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

// Utility types for component props
export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Performance monitoring types
export interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  props: Record<string, any>;
  timestamp: Date;
}

// Error handling types
export interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  errorBoundary?: string;
  errorId: string;
  timestamp: Date;
  userAgent?: string;
  url?: string;
}

// Feature flag types
export interface FeatureFlags {
  [key: string]: boolean | string | number;
}

// Analytics event types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp?: Date;
}

// Export types are already exported above individually
// No need for default export with type exports