import React from 'react';
import { Modal } from '../../design-system/components/Modal';
import { Shield, Eye, Lock, Database, UserCheck, AlertCircle } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  const lastUpdated = "January 11, 2025";
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="auth"
      title="Privacy Policy"
      className="max-h-[90vh] overflow-y-auto"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-3" />
          <p className="text-lg text-gray-700 font-medium">
            Last Updated: {lastUpdated}
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <Eye className="h-5 w-5 text-blue-600 mr-2" />
            Introduction
          </h3>
          <p className="text-gray-700">
            At ReviewInn ("we," "our," or "us"), we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our review platform and related services.
          </p>
        </div>

        {/* Information We Collect */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <Database className="h-5 w-5 text-green-600 mr-2" />
            Information We Collect
          </h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-2">Personal Information</h4>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                <li>Account information (name, email address, username)</li>
                <li>Profile information (bio, avatar, preferences)</li>
                <li>Contact details when you reach out to us</li>
                <li>Payment information (processed securely by third-party providers)</li>
              </ul>
            </div>

            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-2">Usage Information</h4>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                <li>Reviews, ratings, and comments you submit</li>
                <li>Search queries and browsing behavior</li>
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage analytics and performance metrics</li>
              </ul>
            </div>

            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-2">Automatically Collected Information</h4>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                <li>Cookies and similar tracking technologies</li>
                <li>Log files and server data</li>
                <li>Location information (if permitted)</li>
                <li>Referral sources and traffic patterns</li>
              </ul>
            </div>
          </div>
        </div>

        {/* How We Use Your Information */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <UserCheck className="h-5 w-5 text-purple-600 mr-2" />
            How We Use Your Information
          </h3>
          <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
            <li>Provide, operate, and maintain our services</li>
            <li>Process and display your reviews and ratings</li>
            <li>Communicate with you about your account and our services</li>
            <li>Improve our platform through analytics and feedback</li>
            <li>Prevent fraud and ensure platform security</li>
            <li>Comply with legal obligations and resolve disputes</li>
            <li>Send marketing communications (with your consent)</li>
          </ul>
        </div>

        {/* Information Sharing */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <Lock className="h-5 w-5 text-red-600 mr-2" />
            Information Sharing and Disclosure
          </h3>
          
          <p className="text-gray-700 text-sm mb-3 font-medium">We may share your information in the following circumstances:</p>
          <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 mb-3">
            <li><strong>Public Reviews:</strong> Your reviews, ratings, and profile information are publicly visible</li>
            <li><strong>Service Providers:</strong> Third-party vendors who help us operate our platform</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
            <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
            <li><strong>Consent:</strong> When you explicitly authorize us to share your information</li>
          </ul>
          
          <div className="bg-red-200 p-3 rounded-lg">
            <p className="text-red-800 text-sm font-bold">We do NOT sell your personal information to third parties.</p>
          </div>
        </div>

        {/* Data Security & Rights */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4">
            <h4 className="text-md font-bold text-gray-900 mb-2">Data Security</h4>
            <p className="text-gray-700 text-sm">
              We implement industry-standard security measures including encryption, secure servers, and regular security audits to protect your information.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4">
            <h4 className="text-md font-bold text-gray-900 mb-2">Your Rights</h4>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
              <li><strong>Access:</strong> Request access to your data</li>
              <li><strong>Correction:</strong> Update inaccurate information</li>
              <li><strong>Deletion:</strong> Request account deletion</li>
              <li><strong>Portability:</strong> Get your data in portable format</li>
            </ul>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-5 text-center">
          <div className="flex items-center justify-center mb-3">
            <AlertCircle className="h-5 w-5 text-teal-600 mr-2" />
            <h4 className="text-md font-bold text-gray-900">Questions About Privacy?</h4>
          </div>
          <p className="text-gray-700 text-sm mb-4">
            If you have questions about this Privacy Policy, please contact our privacy team.
          </p>
          <button className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm">
            Contact Privacy Team
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PrivacyPolicyModal;