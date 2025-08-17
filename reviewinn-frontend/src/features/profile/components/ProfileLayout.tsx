import React from 'react';
import LoadingSpinner from '../../../shared/atoms/LoadingSpinner';
import { Button } from '../../../shared/design-system/components/Button';
import ThreePanelLayout from '../../../shared/layouts/ThreePanelLayout';

interface ProfileLayoutProps {
  children: React.ReactNode;
  userProfile?: any;
}

interface ProfileLoadingProps {
  message?: string;
}

interface ProfileErrorProps {
  error: string;
  onRetry?: () => void;
}

interface ProfileNotFoundProps {
  message?: string;
}

// Loading State Component
export const ProfileLoading: React.FC<ProfileLoadingProps> = ({ 
  message = "Loading profile..." 
}) => (
  <ThreePanelLayout
    pageTitle="👤 User Profile"
    leftPanelTitle="🌟 Community Highlights"
    rightPanelTitle="💡 Profile Suggestions"
    centerPanelWidth="700px"
    headerGradient="from-cyan-600 via-blue-600 to-indigo-800"
    centerPanelClassName="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
  >
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600 mt-4">{message}</p>
      </div>
    </div>
  </ThreePanelLayout>
);

// Error State Component
export const ProfileError: React.FC<ProfileErrorProps> = ({ 
  error, 
  onRetry 
}) => (
  <ThreePanelLayout
    pageTitle="👤 User Profile"
    leftPanelTitle="🌟 Community Highlights"
    rightPanelTitle="💡 Profile Suggestions"
    centerPanelWidth="700px"
    headerGradient="from-cyan-600 via-blue-600 to-indigo-800"
    centerPanelClassName="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
  >
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Profile</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        {onRetry && (
          <Button onClick={onRetry}>
            Try Again
          </Button>
        )}
      </div>
    </div>
  </ThreePanelLayout>
);

// Not Found State Component
export const ProfileNotFound: React.FC<ProfileNotFoundProps> = ({ 
  message = "The user profile you're looking for doesn't exist." 
}) => (
  <ThreePanelLayout
    pageTitle="👤 User Profile"
    leftPanelTitle="🌟 Community Highlights"
    rightPanelTitle="💡 Profile Suggestions"
    centerPanelWidth="700px"
    headerGradient="from-cyan-600 via-blue-600 to-indigo-800"
    centerPanelClassName="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
  >
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-gray-400 text-6xl mb-4">👤</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  </ThreePanelLayout>
);

// Main Layout Component
export const ProfileLayout: React.FC<ProfileLayoutProps> = ({ 
  children, 
  userProfile 
}) => {
  const profileName = userProfile?.name || userProfile?.username || 'User';
  
  return (
    <ThreePanelLayout
      pageTitle={`👤 ${profileName}'s Profile`}
      leftPanelTitle="🌟 Community Highlights"
      rightPanelTitle="💡 Profile Suggestions"
      centerPanelWidth="700px"
      headerGradient="from-cyan-600 via-blue-600 to-indigo-800"
      centerPanelClassName="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
      variant="full-width"
    >
      {children}
    </ThreePanelLayout>
  );
};

export default ProfileLayout;