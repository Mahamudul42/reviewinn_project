import React, { useEffect, useState, useRef } from 'react';
import LoadingProgressBar from './LoadingProgressBar';

interface PageLoaderProps<T> {
  loadData: () => Promise<T>;
  timeout?: number;
  render: (props: { data: T }) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  renderError?: (error: Error) => React.ReactNode;
  isEmpty?: (data: T) => boolean;
  loadingTitle?: string;
  loadingSubtitle?: string;
}

function PageLoader<T = any>({
  loadData,
  timeout = 30000,
  render,
  renderEmpty,
  renderError,
  isEmpty,
  loadingTitle = 'Loading',
  loadingSubtitle = '',
}: PageLoaderProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setTimedOut(false);
    setData(null);

    // Start timeout
    timeoutRef.current = window.setTimeout(() => {
      if (isMounted) {
        setTimedOut(true);
        setLoading(false);
      }
    }, timeout);

    // Load data
    loadData()
      .then((result) => {
        if (isMounted) {
          setData(result);
          setLoading(false);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }
      });

    return () => {
      isMounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
     
  }, [loadData, timeout]);

  if (loading) {
    return (
      <LoadingProgressBar
        isLoading={true}
        title={loadingTitle}
        subtitle={loadingSubtitle}
        duration={timeout}
        showPercentage={true}
      />
    );
  }

  if (timedOut) {
    return renderError ? renderError(new Error('Request timed out. Please try again.')) : (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <h2 className="text-xl font-semibold mb-2">Request timed out</h2>
          <p className="text-gray-600 mb-4">The request took too long. Please try again.</p>
          <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Reload</button>
        </div>
      </div>
    );
  }

  if (error) {
    return renderError ? renderError(error) : (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Reload</button>
        </div>
      </div>
    );
  }

  if (data && isEmpty && isEmpty(data)) {
    return renderEmpty ? renderEmpty() : (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <p className="text-gray-600">No data found.</p>
        </div>
      </div>
    );
  }

  if (data) {
    return <>{render({ data })}</>;
  }

  // Fallback (should not happen)
  return null;
}

export default PageLoader; 