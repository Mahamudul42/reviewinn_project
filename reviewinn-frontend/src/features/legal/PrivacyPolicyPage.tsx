import React from 'react';
import { Shield, Eye, Lock, Database, UserCheck, AlertCircle } from 'lucide-react';
import LegalPageLayout from './components/LegalPageLayout';

const PrivacyPolicyPage: React.FC = () => {
  const lastUpdated = "January 11, 2025";
  
  return (
    <LegalPageLayout 
      title="Privacy Policy" 
      lastUpdated={lastUpdated} 
      icon={Shield}
    >
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center flex-wrap">
        <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mr-2 flex-shrink-0" />
        Introduction
      </h2>
      <p className="text-gray-800 mb-6 text-sm sm:text-base leading-relaxed">
        At ReviewInn ("we," "our," or "us"), we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our review platform and related services.
      </p>

      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center flex-wrap">
        <Database className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mr-2 flex-shrink-0" />
        Information We Collect
      </h2>
      <div className="mb-6 text-sm sm:text-base">
        <h3 className="font-semibold text-gray-900 mb-2">Personal Information</h3>
        <ul className="list-disc list-inside space-y-1 mb-4 ml-4">
          <li>Name, email address, and contact information</li>
          <li>Profile information and preferences</li>
          <li>Review content and ratings</li>
          <li>Communication history with our support team</li>
        </ul>
        
        <h3 className="font-semibold text-gray-900 mb-2">Usage Information</h3>
        <ul className="list-disc list-inside space-y-1 mb-4 ml-4">
          <li>Device information and IP addresses</li>
          <li>Browsing patterns and interaction data</li>
          <li>Location data (if permitted)</li>
          <li>Cookies and similar tracking technologies</li>
        </ul>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center flex-wrap">
        <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mr-2 flex-shrink-0" />
        How We Use Your Information
      </h2>
      <div className="mb-6 text-sm sm:text-base">
        <p className="mb-4">We use your information to:</p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Provide and improve our review platform services</li>
          <li>Personalize your experience and content recommendations</li>
          <li>Communicate with you about updates and support</li>
          <li>Ensure platform security and prevent abuse</li>
          <li>Analyze usage patterns to enhance our services</li>
          <li>Comply with legal obligations and protect our rights</li>
        </ul>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center flex-wrap">
        <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mr-2 flex-shrink-0" />
        Data Protection & Security
      </h2>
      <p className="text-gray-800 mb-6 text-sm sm:text-base leading-relaxed">
        We implement industry-standard security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure servers, and regular security audits.
      </p>

      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center flex-wrap">
        <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mr-2 flex-shrink-0" />
        Your Rights & Choices
      </h2>
      <div className="mb-6 text-sm sm:text-base">
        <p className="mb-4">You have the right to:</p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Access and update your personal information</li>
          <li>Delete your account and associated data</li>
          <li>Opt-out of marketing communications</li>
          <li>Control cookie preferences</li>
          <li>Request data portability</li>
          <li>File a complaint with regulatory authorities</li>
        </ul>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 mt-8">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 text-blue-600" />
          <h2 className="text-lg sm:text-2xl font-bold mb-4 text-gray-900">Questions About Privacy?</h2>
          <p className="text-gray-700 mb-6 text-sm sm:text-base">
            If you have any questions about this Privacy Policy or our data practices, please contact us.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:privacy@reviewinn.com" 
              className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              Contact Privacy Team
            </a>
            <a 
              href="/data-protection" 
              className="bg-white text-blue-600 border border-blue-600 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-sm sm:text-base"
            >
              Data Protection Info
            </a>
          </div>
        </div>
      </div>
    </LegalPageLayout>
  );
};

export default PrivacyPolicyPage;