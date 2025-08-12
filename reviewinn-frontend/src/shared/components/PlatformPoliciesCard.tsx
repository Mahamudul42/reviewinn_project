import React, { useState } from 'react';
import CookiesPolicyModal from './modals/CookiesPolicyModal';
import AccessibilityModal from './modals/AccessibilityModal';
import DataProtectionModal from './modals/DataProtectionModal';
import ContentGuidelinesModal from './modals/ContentGuidelinesModal';

interface PlatformPoliciesCardProps {
  cardBg?: string;
}

const PlatformPoliciesCard: React.FC<PlatformPoliciesCardProps> = ({ 
  cardBg = 'bg-white bg-gradient-to-br from-yellow-50 to-white border border-yellow-300' 
}) => {
  const [showCookiesModal, setShowCookiesModal] = useState(false);
  const [showAccessibilityModal, setShowAccessibilityModal] = useState(false);
  const [showDataProtectionModal, setShowDataProtectionModal] = useState(false);
  const [showContentGuidelinesModal, setShowContentGuidelinesModal] = useState(false);
  return (
    <>
      {/* Modals */}
      <CookiesPolicyModal isOpen={showCookiesModal} onClose={() => setShowCookiesModal(false)} />
      <AccessibilityModal isOpen={showAccessibilityModal} onClose={() => setShowAccessibilityModal(false)} />
      <DataProtectionModal isOpen={showDataProtectionModal} onClose={() => setShowDataProtectionModal(false)} />
      <ContentGuidelinesModal isOpen={showContentGuidelinesModal} onClose={() => setShowContentGuidelinesModal(false)} />
      
      {/* Card Content */}
    <div className="p-4 shadow-md rounded-lg bg-white hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]">
      <div className={`${cardBg} p-4 rounded-xl bg-gradient-to-br from-green-50 via-white to-emerald-50`}>
      <div className="text-left mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 text-white p-2.5 rounded-full shadow-lg">
              <span className="text-xl font-bold">📋</span>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-black bg-gradient-to-r from-green-600 via-emerald-600 to-green-800 bg-clip-text text-transparent">
              Platform Policies
            </h3>
            <div className="w-10 h-0.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mt-1"></div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <button 
          onClick={() => setShowCookiesModal(true)}
          className="w-full flex items-center p-2.5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200 hover:from-orange-100 hover:to-amber-100 hover:shadow-md transition-all duration-300 group"
        >
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <span className="text-white text-sm">🍪</span>
          </div>
          <div className="ml-2.5 flex-1">
            <span className="text-orange-800 font-bold text-sm block group-hover:translate-x-1 transition-transform duration-300">Cookies Policy</span>
            <span className="text-orange-600 text-xs">Website preferences</span>
          </div>
        </button>

        <button 
          onClick={() => setShowAccessibilityModal(true)}
          className="w-full flex items-center p-2.5 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg border border-violet-200 hover:from-violet-100 hover:to-purple-100 hover:shadow-md transition-all duration-300 group"
        >
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <span className="text-white text-sm">♿</span>
          </div>
          <div className="ml-2.5 flex-1">
            <span className="text-violet-800 font-bold text-sm block group-hover:translate-x-1 transition-transform duration-300">Accessibility</span>
            <span className="text-violet-600 text-xs">Inclusive design</span>
          </div>
        </button>

        <button 
          onClick={() => setShowDataProtectionModal(true)}
          className="w-full flex items-center p-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 hover:from-emerald-100 hover:to-teal-100 hover:shadow-md transition-all duration-300 group"
        >
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <span className="text-white text-sm">🛡️</span>
          </div>
          <div className="ml-2.5 flex-1">
            <span className="text-emerald-800 font-bold text-sm block group-hover:translate-x-1 transition-transform duration-300">Data Protection</span>
            <span className="text-emerald-600 text-xs">GDPR compliance</span>
          </div>
        </button>

        <button 
          onClick={() => setShowContentGuidelinesModal(true)}
          className="w-full flex items-center p-2.5 bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg border border-rose-200 hover:from-rose-100 hover:to-pink-100 hover:shadow-md transition-all duration-300 group"
        >
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-rose-500 to-pink-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <span className="text-white text-sm">📝</span>
          </div>
          <div className="ml-2.5 flex-1">
            <span className="text-rose-800 font-bold text-sm block group-hover:translate-x-1 transition-transform duration-300">Content Guidelines</span>
            <span className="text-rose-600 text-xs">Community standards</span>
          </div>
        </button>
      </div>
      </div>
    </div>
    </>
  );
};

export default PlatformPoliciesCard; 