import { useState, useCallback } from 'react';

interface ErrorState {
  error: Error | string | null;
  isRetrying: boolean;
  retryCount: number;
  hasError: boolean;
}

interface UseErrorHandlerOptions {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error | string) => void;
  onRetry?: () => void;
  onMaxRetriesReached?: () => void;
}

interface UseErrorHandlerReturn extends ErrorState {
  setError: (error: Error | string | null) => void;
  retry: (retryFn?: () => Promise<void>) => Promise<void>;
  clearError: () => void;
  canRetry: boolean;
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    onRetry,
    onMaxRetriesReached
  } = options;

  const [state, setState] = useState<ErrorState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    hasError: false,
  });

  const setError = useCallback((error: Error | string | null) => {
    setState(prev => ({
      ...prev,
      error,
      hasError: error !== null,
      isRetrying: false,
    }));

    if (error && onError) {
      onError(error);
    }
  }, [onError]);

  const clearError = useCallback(() => {
    setState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      hasError: false,
    });
  }, []);

  const retry = useCallback(async (retryFn?: () => Promise<void>) => {
    if (state.retryCount >= maxRetries) {
      onMaxRetriesReached?.();
      return;
    }

    setState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1,
    }));

    onRetry?.();

    try {
      // Add delay before retry
      if (retryDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }

      if (retryFn) {
        await retryFn();
        // Clear error on successful retry
        clearError();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error : String(error);
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isRetrying: false,
        hasError: true,
      }));
      
      if (onError) {
        onError(errorMessage);
      }
    }

    setState(prev => ({
      ...prev,
      isRetrying: false,
    }));
  }, [state.retryCount, maxRetries, retryDelay, onError, onRetry, onMaxRetriesReached, clearError]);

  const canRetry = state.retryCount < maxRetries;

  return {
    ...state,
    setError,
    retry,
    clearError,
    canRetry,
  };
};