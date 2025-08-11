/**
 * Performance Utilities - World-class performance optimization helpers
 * Tools for lazy loading, memoization, and performance monitoring
 */

import React, { lazy, ComponentType, memo, useCallback, useMemo, useRef, useEffect, useState } from 'react';

// Lazy loading with error boundaries
export const lazyWithRetry = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  retries = 3
) => {
  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      const attemptImport = (attempt: number) => {
        importFunc()
          .then(resolve)
          .catch((error) => {
            if (attempt < retries) {
              // Exponential backoff
              setTimeout(() => attemptImport(attempt + 1), Math.pow(2, attempt) * 1000);
            } else {
              reject(error);
            }
          });
      };
      attemptImport(0);
    });
  });
};

// Memoization utilities
export const memoComponent = <P extends object>(
  Component: ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
) => {
  return memo(Component, propsAreEqual);
};

// Deep comparison for objects
export const deepEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  
  if (a == null || b == null) return false;
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }
  
  return false;
};

// Optimized hooks
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: any[]
): T => {
  return useCallback(callback, deps);
};

export const useDeepMemo = <T>(
  factory: () => T,
  deps: any[]
): T => {
  const ref = useRef<{ deps: any[]; value: T }>();
  
  if (!ref.current || !deepEqual(ref.current.deps, deps)) {
    ref.current = {
      deps,
      value: factory(),
    };
  }
  
  return ref.current.value;
};

// Debounce hook
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

// Throttle hook
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(Date.now());
  
  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) => {
  const [inView, setInView] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  
  useEffect(() => {
    if (!ref.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        setEntry(entry);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );
    
    observer.observe(ref.current);
    
    return () => observer.disconnect();
  }, [ref, options]);
  
  return { inView, entry };
};

// Virtual scrolling hook
export const useVirtualScroll = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  
  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
    }));
  }, [items, startIndex, endIndex]);
  
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  };
};

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);
    
    return result;
  }
  
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);
    
    return result;
  }
  
  getMetrics(name: string) {
    const measurements = this.metrics.get(name) || [];
    if (measurements.length === 0) {
      return null;
    }
    
    const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);
    
    return { avg, min, max, count: measurements.length };
  }
  
  getAllMetrics() {
    const result: Record<string, any> = {};
    for (const [name] of this.metrics) {
      result[name] = this.getMetrics(name);
    }
    return result;
  }
  
  clear(name?: string) {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }
}

// Hook to use performance monitor
export const usePerformanceMonitor = () => {
  return PerformanceMonitor.getInstance();
};

// Component performance tracker
export const withPerformanceTracking = <P extends object>(
  Component: ComponentType<P>,
  name?: string
) => {
  const componentName = name || Component.displayName || Component.name || 'Unknown';
  
  return memo((props: P) => {
    const monitor = usePerformanceMonitor();
    const renderCount = useRef(0);
    
    useEffect(() => {
      renderCount.current += 1;
    });
    
    return useMemo(() => {
      return monitor.measure(`${componentName}_render`, () => 
        React.createElement(Component, props)
      );
    }, [props, monitor]);
  });
};

// Bundle size tracking (development only)
export const trackBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          console.log('Navigation timing:', entry);
        }
        if (entry.entryType === 'resource') {
          console.log('Resource timing:', entry.name, entry.transferSize);
        }
      });
    });
    
    observer.observe({ entryTypes: ['navigation', 'resource'] });
    
    return () => observer.disconnect();
  }
};

// Image optimization utilities
export const optimizeImage = (
  src: string,
  width?: number,
  height?: number,
  quality: number = 80
): string => {
  // ImgBB provides direct URLs - no transformation needed
  // For optimization, we handle this at upload time via the ImgBB service
  return src;
};

// Preload critical resources
export const preloadResource = (href: string, as: string, type?: string) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;
  document.head.appendChild(link);
};

// Critical CSS inlining (for above-the-fold content)
export const inlineCriticalCSS = (css: string) => {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
};

// Service Worker utilities
export const registerServiceWorker = async (swPath: string = '/sw.js') => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      const registration = await navigator.serviceWorker.register(swPath);
      console.log('SW registered: ', registration);
      return registration;
    } catch (registrationError) {
      console.log('SW registration failed: ', registrationError);
    }
  }
};

export default {
  lazyWithRetry,
  memoComponent,
  deepEqual,
  useStableCallback,
  useDeepMemo,
  useDebounce,
  useThrottle,
  useIntersectionObserver,
  useVirtualScroll,
  PerformanceMonitor,
  usePerformanceMonitor,
  withPerformanceTracking,
  trackBundleSize,
  optimizeImage,
  preloadResource,
  inlineCriticalCSS,
  registerServiceWorker,
};