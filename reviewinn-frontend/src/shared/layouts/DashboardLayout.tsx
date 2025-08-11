import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PanelFactory } from '../panels';
import AddReviewModal from '../../features/reviews/components/AddReviewModal';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import { reviewService } from '../../api/services';
import type { Review, Entity, ReviewFormData } from '../../types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  className = ''
}) => {
  const { isAuthenticated } = useUnifiedAuth();
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" style={{ zoom: '0.9' }}>
      <div className="flex justify-center">
        <div className="grid grid-cols-[420px_1fr_420px] w-full max-w-screen-xl h-screen">
          {/* Left Sidebar */}
          <div className="h-screen overflow-hidden group bg-white/80 backdrop-blur-sm shadow-lg border-2 border-black">
            <div className="h-full overflow-y-hidden group-hover:overflow-y-auto overflow-x-hidden hide-scrollbar p-8">
              <PanelFactory position="left" />
            </div>
          </div>
          
          {/* Center Content */}
          <div className={`h-screen overflow-y-auto hide-scrollbar bg-transparent ${className}`}>
            <div className="w-full max-w-2xl mx-auto px-6 py-8">
              {children}
            </div>
          </div>
          
          {/* Right Sidebar */}
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

export default DashboardLayout; 