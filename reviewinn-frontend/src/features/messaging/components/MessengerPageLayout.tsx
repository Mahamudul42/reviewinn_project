import React from 'react';
import { PanelFactory } from '../../../shared/panels';

interface MessengerPageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Messenger Page Layout with reused left/right panels from homepage
 * The middle panel contains the full messaging interface (conversations + chat)
 */
const MessengerPageLayout: React.FC<MessengerPageLayoutProps> = ({ 
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
          
          {/* Center Content - Full Messaging Interface */}
          <div className={`h-screen overflow-y-auto hide-scrollbar bg-transparent ${className}`}>
            <div className="w-full max-w-4xl mx-auto py-4 px-4">
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

export default MessengerPageLayout;