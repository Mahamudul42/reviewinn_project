import React, { Component, ReactNode } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle, Router } from 'lucide-react';

interface NetworkErrorState {
  hasError: boolean;
  errorType: 'network' | 'server' | 'timeout' | 'unknown';
  errorMessage: string;
  retryCount: number;
}

interface NetworkErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  maxRetries?: number;
  showRetryButton?: boolean;
}

class NetworkErrorBoundary extends Component<NetworkErrorBoundaryProps, NetworkErrorState> {
  private retryTimer: NodeJS.Timeout | null = null;

  constructor(props: NetworkErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorType: 'unknown',
      errorMessage: '',
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<NetworkErrorState> {
    let errorType: NetworkErrorState['errorType'] = 'unknown';
    let errorMessage = error.message;

    // Classify error type based on error message or properties
    if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
      errorType = 'network';
      errorMessage = 'Unable to connect to the server. Please check your internet connection.';
    } else if (error.message.includes('timeout')) {
      errorType = 'timeout';
      errorMessage = 'Request timed out. The server is taking too long to respond.';
    } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
      errorType = 'server';
      errorMessage = 'Server is currently experiencing issues. Please try again in a few moments.';
    }

    return {
      hasError: true,
      errorType,
      errorMessage,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details
    console.error('Network Error Boundary caught an error:', error, errorInfo);
    
    // Call onError callback if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    const maxRetries = this.props.maxRetries || 3;
    
    if (this.state.retryCount < maxRetries) {
      this.setState({
        hasError: false,
        retryCount: this.state.retryCount + 1,
      });
    } else {
      // Show different message if max retries reached
      this.setState({
        errorMessage: 'Multiple retry attempts failed. Please refresh the page or try again later.',
      });
    }
  };

  handleRefreshPage = () => {
    window.location.reload();
  };

  getErrorIcon = () => {
    switch (this.state.errorType) {
      case 'network':
        return <WifiOff className="w-16 h-16 text-red-500" />;
      case 'server':
        return <Router className="w-16 h-16 text-orange-500" />;
      case 'timeout':
        return <AlertCircle className="w-16 h-16 text-yellow-500" />;
      default:
        return <AlertCircle className="w-16 h-16 text-gray-500" />;
    }
  };

  getErrorColor = () => {
    switch (this.state.errorType) {
      case 'network':
        return 'from-red-50 to-red-100 border-red-200';
      case 'server':
        return 'from-orange-50 to-orange-100 border-orange-200';
      case 'timeout':
        return 'from-yellow-50 to-yellow-100 border-yellow-200';
      default:
        return 'from-gray-50 to-gray-100 border-gray-200';
    }
  };

  getActionButtonColor = () => {
    switch (this.state.errorType) {
      case 'network':
        return 'from-red-600 to-red-700 hover:from-red-700 hover:to-red-800';
      case 'server':
        return 'from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800';
      case 'timeout':
        return 'from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800';
      default:
        return 'from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800';
    }
  };

  render() {
    if (this.state.hasError) {
      const maxRetries = this.props.maxRetries || 3;
      const canRetry = this.state.retryCount < maxRetries;
      
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className={`max-w-md w-full text-center bg-gradient-to-br ${this.getErrorColor()} rounded-2xl shadow-lg border p-8`}>
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              {this.getErrorIcon()}
            </div>

            {/* Error Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {this.state.errorType === 'network' && 'Connection Problem'}
              {this.state.errorType === 'server' && 'Server Error'}
              {this.state.errorType === 'timeout' && 'Request Timeout'}
              {this.state.errorType === 'unknown' && 'Something Went Wrong'}
            </h2>

            {/* Error Message */}
            <p className="text-gray-700 mb-6 leading-relaxed">
              {this.state.errorMessage}
            </p>

            {/* Network Status Indicator */}
            <div className="flex items-center justify-center mb-6 space-x-2">
              <Wifi className={`w-4 h-4 ${navigator.onLine ? 'text-green-500' : 'text-red-500'}`} />
              <span className={`text-sm font-medium ${navigator.onLine ? 'text-green-600' : 'text-red-600'}`}>
                {navigator.onLine ? 'Connected to Internet' : 'No Internet Connection'}
              </span>
            </div>

            {/* Retry Information */}
            {this.state.retryCount > 0 && (
              <div className="mb-4 p-3 bg-white/50 rounded-lg border">
                <p className="text-sm text-gray-600">
                  Retry attempts: {this.state.retryCount} of {maxRetries}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {this.props.showRetryButton !== false && canRetry && (
                <button
                  onClick={this.handleRetry}
                  className={`w-full inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-gradient-to-r ${this.getActionButtonColor()} rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200`}
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Try Again
                </button>
              )}
              
              <button
                onClick={this.handleRefreshPage}
                className="w-full inline-flex items-center justify-center px-6 py-3 text-base font-medium text-gray-700 bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-xl transition-all duration-200"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Refresh Page
              </button>
            </div>

            {/* Help Text */}
            <p className="mt-6 text-xs text-gray-500">
              If this problem persists, please check your internet connection or try again later.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default NetworkErrorBoundary;