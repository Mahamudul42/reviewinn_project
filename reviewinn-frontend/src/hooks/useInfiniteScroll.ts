import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions<T> {
  fetchMore: (page: number) => Promise<T[]>;
  initialPage?: number;
  pageSize?: number;
  threshold?: number;
  maxItems?: number; // Maximum items to keep in memory
  virtualScrolling?: boolean; // Enable virtual scrolling for large datasets
}

interface UseInfiniteScrollReturn<T> {
  data: T[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
  reset: () => void;
  refresh: () => void;
  lastElementRef: (node: HTMLElement | null) => void;
}

export function useInfiniteScroll<T>({
  fetchMore,
  initialPage = 1,
  pageSize = 10,
  threshold = 100,
  maxItems = 1000, // Default max items for memory management
  virtualScrolling = false
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef(false);
  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    
    console.log(`[useInfiniteScroll] Loading page ${page}...`);
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const newItems = await fetchMore(page);
      
      setData(prevData => {
        const newData = [...prevData, ...newItems];
        
        // Memory management: Keep only maxItems most recent items
        if (newData.length > maxItems) {
          console.log(`[useInfiniteScroll] Trimming data to ${maxItems} items for memory management`);
          return newData.slice(-maxItems);
        }
        
        return newData;
      });
      
      if (newItems.length < pageSize) {
        setHasMore(false);
      } else {
        setPage(prevPage => prevPage + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more items');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [fetchMore, page, pageSize, hasMore]);
  const reset = useCallback(() => {
    setData([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
    setLoading(false);
    loadingRef.current = false;
  }, [initialPage]);
  const refresh = useCallback(async () => {
    console.log('[useInfiniteScroll] Refreshing data...');
    reset();
    // Load first page immediately after reset
    setPage(initialPage);
    setHasMore(true);
    setError(null);
    setLoading(false);
    loadingRef.current = false;
    
    // Load the first page
    loadingRef.current = true;
    setLoading(true);
    
    try {
      const newItems = await fetchMore(initialPage);
      setData(newItems);
      
      if (newItems.length < pageSize) {
        setHasMore(false);
      } else {
        setPage(initialPage + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [fetchMore, initialPage, pageSize]);

  // Set up intersection observer for auto-loading
  const lastElementRef = useCallback((node: HTMLElement | null) => {
    if (loading) return;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          loadMore();
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    );
    
    if (node) {
      observerRef.current.observe(node);
    }
  }, [loading, hasMore, loadMore, threshold]);  // Load initial data only once
  const initializedRef = useRef(false);
  
  useEffect(() => {
    if (!initializedRef.current && data.length === 0 && hasMore && !loadingRef.current) {
      console.log('[useInfiniteScroll] Initial load triggered');
      initializedRef.current = true;
      loadMore();
    }
  }, []);

  // Cleanup observer
  useEffect(() => {
    const currentObserver = observerRef.current;
    return () => {
      if (currentObserver) {
        currentObserver.disconnect();
      }
    };
  }, []);
  return {
    data,
    loading,
    hasMore,
    error,
    loadMore,
    reset,
    refresh,
    lastElementRef
  };
}
