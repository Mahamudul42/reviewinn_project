import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorId: this.generateErrorId(),
    };
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (import.meta.env.DEV) {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }

    // Call onError callback if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: this.generateErrorId(),
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full text-center bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            {/* Error Icon */}
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>

            {/* Error Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Oops! Something went wrong
            </h1>

            {/* Error Description */}
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              We're sorry for the inconvenience. An unexpected error occurred while loading this page.
              Our team has been notified and is working to fix this issue.
            </p>

            {/* Error ID */}
            <div className="bg-gray-100 rounded-lg p-4 mb-8">
              <p className="text-sm text-gray-500 mb-2">Error ID for support:</p>
              <code className="text-sm font-mono text-gray-800 bg-white px-3 py-1 rounded border">
                {this.state.errorId}
              </code>
            </div>

            {/* Error Details (Development Only) */}
            {import.meta.env.DEV && this.props.showDetails && this.state.error && (
              <details className="text-left mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
                <summary className="cursor-pointer font-medium text-red-700 mb-2">
                  🐛 Developer Details (Development Mode)
                </summary>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-red-700 mb-2">Error Message:</h4>
                    <pre className="text-sm text-red-600 bg-white p-3 rounded border overflow-auto">
                      {this.state.error.message}
                    </pre>
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <h4 className="font-medium text-red-700 mb-2">Stack Trace:</h4>
                      <pre className="text-xs text-red-600 bg-white p-3 rounded border overflow-auto max-h-40">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <h4 className="font-medium text-red-700 mb-2">Component Stack:</h4>
                      <pre className="text-xs text-red-600 bg-white p-3 rounded border overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Try Again
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center px-6 py-3 text-base font-medium text-purple-600 bg-white border-2 border-purple-600 hover:bg-purple-600 hover:text-white rounded-xl transition-all duration-200"
              >
                <Home className="w-5 h-5 mr-2" />
                Go to Homepage
              </button>
            </div>

            {/* Support Information */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                If this problem persists, please{' '}
                <a 
                  href="mailto:support@reviewsite.com" 
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  contact support
                </a>{' '}
                with the error ID above.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 