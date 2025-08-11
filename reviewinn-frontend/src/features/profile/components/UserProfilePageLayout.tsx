import React from 'react';
import { PanelFactory } from '../../../shared/panels';

interface UserProfilePageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * User Profile Page Layout with reused left/right panels from homepage
 * Only the middle panel content is different (profile specific)
 */
const UserProfilePageLayout: React.FC<UserProfilePageLayoutProps> = ({ 
  children, 
  className = ''
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" style={{ zoom: '0.9' }}>
      <div className="flex justify-center">
        <div className="grid grid-cols-[420px_1fr_420px] w-full max-w-screen-xl h-screen">
          {/* Left Sidebar - Reused from Homepage */}
          <div className="h-screen overflow-hidden group bg-white/80 backdrop-blur-sm shadow-lg border-2 border-black">
            <div className="h-full overflow-y-hidden group-hover:overflow-y-auto overflow-x-hidden hide-scrollbar p-8">
              <PanelFactory position="left" />
            </div>
          </div>
          
          {/* Center Content - User Profile specific */}
          <div className={`h-screen overflow-y-auto hide-scrollbar bg-transparent ${className}`}>
            <div className="w-full max-w-2xl mx-auto space-y-6 py-8 px-6">
              {children}
            </div>
          </div>
          
          {/* Right Sidebar - Reused from Homepage */}
          <div className="h-screen overflow-y-hidden group bg-white/80 backdrop-blur-sm shadow-lg border-2 border-black">
            <div className="h-full overflow-y-hidden group-hover:overflow-y-auto hide-scrollbar p-8">
              <PanelFactory position="right" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePageLayout;