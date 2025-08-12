import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class HomepageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Homepage Error:', error);
    console.error('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
            <div className="flex justify-center mb-4">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="32,8 60,56 4,56" fill="#FFEB3B" stroke="#222" strokeWidth="3" />
                <rect x="29" y="24" width="6" height="16" rx="3" fill="#222" />
                <rect x="29" y="44" width="6" height="6" rx="3" fill="#222" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Homepage Error</h2>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'Something went wrong loading the homepage'}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default HomepageErrorBoundary;