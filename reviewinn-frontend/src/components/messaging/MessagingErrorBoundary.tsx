/**
 * Enterprise Messaging Error Boundary
 * Handles messaging feature errors gracefully with proper user feedback
 */

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Settings, MessageCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  featureName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: string;
  retryCount: number;
}

export class MessagingErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('MessagingErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      errorInfo: errorInfo.componentStack
    });

    // Report to monitoring service (e.g., Sentry, LogRocket)
    if (import.meta.env.VITE_ERROR_TRACKING_ENABLED === 'true') {
      // window.Sentry?.captureException(error, { extra: errorInfo });
      console.info('Error would be reported to monitoring service');
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="messaging-error-boundary p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                {this.props.featureName || 'Messaging'} Feature Temporarily Unavailable
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                <p>We're experiencing technical difficulties with the messaging system.</p>
                <p className="mt-1">Your other features continue to work normally.</p>
              </div>
              
              <div className="mt-4 flex space-x-3">
                {this.state.retryCount < this.maxRetries && (
                  <button
                    onClick={this.handleRetry}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Try Again ({this.maxRetries - this.state.retryCount} left)
                  </button>
                )}
                
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Refresh Page
                </button>
              </div>

              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4">
                  <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                    Technical Details (Dev Mode)
                  </summary>
                  <pre className="mt-2 text-xs text-red-800 bg-red-100 p-2 rounded border overflow-auto max-h-32">
                    {this.state.error.message}
                    {this.state.errorInfo}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Feature Disabled Component
export const FeatureDisabledNotice: React.FC<{
  featureName: string;
  description?: string;
}> = ({ featureName, description }) => (
  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
    <div className="flex items-center space-x-3">
      <Settings className="w-5 h-5 text-gray-400" />
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {featureName} Currently Disabled
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {description || `${featureName} is temporarily disabled. Please check back later.`}
        </p>
      </div>
    </div>
  </div>
);

// Service Unavailable Component
export const ServiceUnavailableNotice: React.FC<{
  serviceName: string;
  retryAfter?: number;
  onRetry?: () => void;
}> = ({ serviceName, retryAfter, onRetry }) => (
  <div className="p-4 border border-amber-200 rounded-lg bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
    <div className="flex items-start space-x-3">
      <MessageCircle className="w-5 h-5 text-amber-500 mt-0.5" />
      <div className="flex-1">
        <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
          {serviceName} Temporarily Unavailable
        </h3>
        <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
          We're working to restore this service. Please try again in a few moments.
        </p>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-amber-700 bg-amber-100 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 dark:bg-amber-800 dark:text-amber-100 dark:hover:bg-amber-700"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Try Again
            {retryAfter && ` (${Math.ceil(retryAfter / 1000)}s)`}
          </button>
        )}
      </div>
    </div>
  </div>
);

export default MessagingErrorBoundary;