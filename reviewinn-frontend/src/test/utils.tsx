/**
 * Test Utilities - Comprehensive testing helpers
 * Provides utilities for testing React components with proper context
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { User } from '../stores/authStore';

// Mock data factories
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  user_id: 1,
  username: 'testuser',
  email: 'test@example.com',
  name: 'Test User',
  avatar: 'https://example.com/avatar.jpg',
  bio: 'Test user bio',
  level: 1,
  points: 100,
  is_verified: false,
  preferences: {},
  stats: {},
  ...overrides,
});

export const createMockEntity = (overrides: any = {}) => ({
  entity_id: 1,
  name: 'Test Entity',
  description: 'Test entity description',
  category: 'professionals',
  subcategory: 'developer',
  location: 'Test Location',
  website: 'https://example.com',
  verified: false,
  claimed: false,
  view_count: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  review_stats: {
    total_reviews: 0,
    average_rating: 0,
    latest_review_date: null,
  },
  contact_info: {},
  metadata: {},
  ...overrides,
});

export const createMockReview = (overrides: any = {}) => ({
  review_id: 1,
  entity_id: 1,
  user_id: 1,
  overall_rating: 5,
  content: 'Great experience!',
  pros: 'Very professional',
  cons: 'Nothing negative',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_anonymous: false,
  helpful_count: 0,
  user: createMockUser(),
  entity: createMockEntity(),
  ...overrides,
});

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  user?: User | null;
  preloadedState?: any;
}

export const renderWithProviders = (
  ui: ReactElement,
  {
    initialEntries = ['/'],
    user = null,
    preloadedState = {},
    ...renderOptions
  }: CustomRenderOptions = {}
): RenderResult => {
  // Wrapper component with all necessary providers
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    );
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Custom render for testing with authentication
export const renderWithAuth = (
  ui: ReactElement,
  { user = createMockUser(), ...options }: CustomRenderOptions & { user?: User } = {}
) => {
  return renderWithProviders(ui, { user, ...options });
};

// Mock API responses
export const mockApiResponse = <T,>(data: T, delay = 0) => {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

export const mockApiError = (message = 'API Error', status = 500, delay = 0) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error(message));
    }, delay);
  });
};

// Mock fetch implementation
export const createMockFetch = (responses: Record<string, any>) => {
  return vi.fn().mockImplementation((url: string, options?: RequestInit) => {
    const method = options?.method || 'GET';
    const key = `${method} ${url}`;
    
    if (responses[key]) {
      const response = responses[key];
      return Promise.resolve({
        ok: response.status < 400,
        status: response.status || 200,
        json: () => Promise.resolve(response.data),
        text: () => Promise.resolve(JSON.stringify(response.data)),
      });
    }
    
    return Promise.reject(new Error(`No mock response for ${key}`));
  });
};

// Event helpers
export const createMockEvent = (overrides: any = {}) => ({
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  target: { value: '' },
  currentTarget: { value: '' },
  ...overrides,
});

// File helpers for testing file uploads
export const createMockFile = (
  name = 'test.jpg',
  size = 1024,
  type = 'image/jpeg'
) => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Wait for element helpers
export const waitForLoadingToFinish = async () => {
  const { waitForElementToBeRemoved } = await import('@testing-library/react');
  return waitForElementToBeRemoved(
    () => document.querySelector('[data-testid="loading"]'),
    { timeout: 5000 }
  );
};

// Router helpers
export const createMockRouter = (overrides: any = {}) => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/',
  ...overrides,
});

// Local storage helpers
export const mockLocalStorage = () => {
  const storage: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    }),
    length: Object.keys(storage).length,
    key: vi.fn((index: number) => Object.keys(storage)[index] || null),
  };
};

// Test data generators
export const generateTestData = {
  users: (count: number) => 
    Array.from({ length: count }, (_, i) => 
      createMockUser({ user_id: i + 1, username: `user${i + 1}` })
    ),
  
  entities: (count: number) =>
    Array.from({ length: count }, (_, i) =>
      createMockEntity({ entity_id: i + 1, name: `Entity ${i + 1}` })
    ),
  
  reviews: (count: number) =>
    Array.from({ length: count }, (_, i) =>
      createMockReview({ review_id: i + 1 })
    ),
};

// Assertion helpers
export const expectElementToHaveAccessibleName = (
  element: Element,
  name: string
) => {
  expect(element).toHaveAttribute('aria-label', name);
};

export const expectElementToBeVisible = (element: Element) => {
  expect(element).toBeVisible();
  expect(element).not.toHaveAttribute('aria-hidden', 'true');
};

// Performance testing helpers
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  return end - start;
};

// Accessibility testing helpers
export const checkA11y = async (container: Element) => {
  const { axe } = await import('axe-core');
  const results = await axe.run(container);
  return results.violations;
};

// Animation testing helpers
export const waitForAnimation = (duration = 300) => {
  return new Promise(resolve => setTimeout(resolve, duration));
};

// Cleanup helpers
export const cleanupMocks = () => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
};

export default {
  createMockUser,
  createMockEntity,
  createMockReview,
  renderWithProviders,
  renderWithAuth,
  mockApiResponse,
  mockApiError,
  createMockFetch,
  createMockEvent,
  createMockFile,
  waitForLoadingToFinish,
  createMockRouter,
  mockLocalStorage,
  generateTestData,
  expectElementToHaveAccessibleName,
  expectElementToBeVisible,
  measureRenderTime,
  checkA11y,
  waitForAnimation,
  cleanupMocks,
};