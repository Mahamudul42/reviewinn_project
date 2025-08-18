import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class GatingErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Gating system error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // Fallback UI - just show the content without gating
      return this.props.fallback || (
        <div className="w-full">
          {this.props.children}
          {typeof process !== 'undefined' && process.env?.NODE_ENV === 'development' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <h4 className="text-red-800 font-medium mb-2">Gating System Error</h4>
              <p className="text-red-600 text-sm">
                The content gating system encountered an error. Content is being displayed without restrictions.
              </p>
              {this.state.error && (
                <details className="mt-2">
                  <summary className="text-red-700 text-xs cursor-pointer">Error Details</summary>
                  <pre className="text-red-600 text-xs mt-1 overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default GatingErrorBoundary;