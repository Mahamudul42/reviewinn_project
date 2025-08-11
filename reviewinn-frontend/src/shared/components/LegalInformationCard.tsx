import React, { useState } from 'react';
import AboutUsModal from './modals/AboutUsModal';
import PrivacyPolicyModal from './modals/PrivacyPolicyModal';
import TermsOfServiceModal from './modals/TermsOfServiceModal';
import HealthPrivacyModal from './modals/HealthPrivacyModal';

interface LegalInformationCardProps {
  cardBg?: string;
}

const LegalInformationCard: React.FC<LegalInformationCardProps> = ({ 
  cardBg = 'bg-white bg-gradient-to-br from-yellow-50 to-white border border-yellow-300' 
}) => {
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);

  return (
    <>
      {/* Modals */}
      <AboutUsModal isOpen={showAboutModal} onClose={() => setShowAboutModal(false)} />
      <PrivacyPolicyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
      <TermsOfServiceModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
      <HealthPrivacyModal isOpen={showHealthModal} onClose={() => setShowHealthModal(false)} />
      
      {/* Card Content */}
    <div className="p-4 shadow-md rounded-lg bg-white hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]">
      <div className={`${cardBg} p-4 rounded-xl bg-gradient-to-br from-blue-50 via-white to-indigo-50`}>
      <div className="text-center mb-4">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
          <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-2.5 rounded-full shadow-lg">
            <span className="text-xl font-bold">⚖️</span>
          </div>
        </div>
        <h3 className="text-lg font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 bg-clip-text text-transparent mt-3">
          Legal Information
        </h3>
        <div className="w-10 h-0.5 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full mx-auto mt-2"></div>
      </div>

      <div className="space-y-2">
        <button 
          onClick={() => setShowAboutModal(true)}
          className="w-full flex items-center p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:from-blue-100 hover:to-indigo-100 hover:shadow-md transition-all duration-300 group"
        >
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <span className="text-white text-sm">📋</span>
          </div>
          <div className="ml-2.5 flex-1">
            <span className="text-blue-800 font-bold text-sm block group-hover:translate-x-1 transition-transform duration-300">About Us</span>
            <span className="text-blue-600 text-xs">Learn our story</span>
          </div>
        </button>

        <button 
          onClick={() => setShowPrivacyModal(true)}
          className="w-full flex items-center p-2.5 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200 hover:from-cyan-100 hover:to-blue-100 hover:shadow-md transition-all duration-300 group"
        >
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <span className="text-white text-sm">🔒</span>
          </div>
          <div className="ml-2.5 flex-1">
            <span className="text-cyan-800 font-bold text-sm block group-hover:translate-x-1 transition-transform duration-300">Privacy Policy</span>
            <span className="text-cyan-600 text-xs">Data protection</span>
          </div>
        </button>

        <button 
          onClick={() => setShowTermsModal(true)}
          className="w-full flex items-center p-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 hover:from-indigo-100 hover:to-purple-100 hover:shadow-md transition-all duration-300 group"
        >
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <span className="text-white text-sm">📜</span>
          </div>
          <div className="ml-2.5 flex-1">
            <span className="text-indigo-800 font-bold text-sm block group-hover:translate-x-1 transition-transform duration-300">Terms of Service</span>
            <span className="text-indigo-600 text-xs">Usage agreement</span>
          </div>
        </button>

        <button 
          onClick={() => setShowHealthModal(true)}
          className="w-full flex items-center p-2.5 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-200 hover:from-teal-100 hover:to-cyan-100 hover:shadow-md transition-all duration-300 group"
        >
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <span className="text-white text-sm">🏥</span>
          </div>
          <div className="ml-2.5 flex-1">
            <span className="text-teal-800 font-bold text-sm block group-hover:translate-x-1 transition-transform duration-300">Health Privacy</span>
            <span className="text-teal-600 text-xs">Consumer protection</span>
          </div>
        </button>
      </div>
      </div>
    </div>
    </>
  );
};

export default LegalInformationCard; 