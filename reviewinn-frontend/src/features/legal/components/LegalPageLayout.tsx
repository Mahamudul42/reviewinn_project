import React from 'react';

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({ 
  title, 
  lastUpdated, 
  icon: Icon, 
  children 
}) => {
  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-left mb-8 sm:mb-12">
          <div className="flex items-center mb-4">
            <Icon className="h-12 w-12 sm:h-16 sm:w-16 text-blue-600 mr-3 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 break-words">
                {title}
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600">
                Last Updated: {lastUpdated}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 mb-8">
          <div className="prose prose-sm sm:prose lg:prose-lg max-w-none text-left">
            {children}
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="text-center">
          <a 
            href="/" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            ← Back to ReviewInn
          </a>
        </div>
      </div>
    </div>
  );
};

export default LegalPageLayout;