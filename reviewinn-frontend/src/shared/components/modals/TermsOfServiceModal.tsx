import React from 'react';
import { Modal } from '../../design-system/components/Modal';
import { FileText, Users, Shield, AlertTriangle, Scale, CheckCircle } from 'lucide-react';

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({ isOpen, onClose }) => {
  const lastUpdated = "January 11, 2025";
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="auth"
      title="Terms of Service"
      className="max-h-[90vh] overflow-y-auto"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4">
          <FileText className="h-12 w-12 text-indigo-600 mx-auto mb-3" />
          <p className="text-lg text-gray-700 font-medium">
            Last Updated: {lastUpdated}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            By using ReviewInn, you agree to these terms and conditions.
          </p>
        </div>

        {/* Acceptance of Terms */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            Acceptance of Terms
          </h3>
          <p className="text-gray-700 text-sm">
            By accessing and using ReviewInn, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
        </div>

        {/* User Responsibilities */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <Users className="h-5 w-5 text-blue-600 mr-2" />
            User Responsibilities
          </h3>
          <ul className="list-disc list-inside text-gray-700 text-sm space-y-2">
            <li>Provide accurate and truthful information in your reviews</li>
            <li>Respect other users and maintain civil discourse</li>
            <li>Do not post spam, fake reviews, or misleading content</li>
            <li>Protect your account credentials and notify us of unauthorized use</li>
            <li>Comply with all applicable laws and regulations</li>
            <li>Respect intellectual property rights of others</li>
          </ul>
        </div>

        {/* Review Guidelines */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <Shield className="h-5 w-5 text-purple-600 mr-2" />
            Review Guidelines
          </h3>
          <div className="space-y-3">
            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-1">What's Allowed:</h4>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                <li>Honest opinions based on your experience</li>
                <li>Constructive feedback for businesses</li>
                <li>Factual information about products and services</li>
                <li>Photos related to your experience</li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-1">What's Prohibited:</h4>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                <li>Fake or misleading reviews</li>
                <li>Defamatory or abusive language</li>
                <li>Reviews about competitors (conflict of interest)</li>
                <li>Spam or promotional content</li>
                <li>Personal information of others</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Platform Rights */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <Scale className="h-5 w-5 text-orange-600 mr-2" />
            Platform Rights and Enforcement
          </h3>
          <ul className="list-disc list-inside text-gray-700 text-sm space-y-2">
            <li>We reserve the right to remove content that violates our guidelines</li>
            <li>We may suspend or terminate accounts for policy violations</li>
            <li>We can modify these terms with reasonable notice</li>
            <li>We provide the platform "as is" without warranties</li>
            <li>We are not liable for user-generated content</li>
          </ul>
        </div>

        {/* Account Terms */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4">
            <h4 className="text-md font-bold text-gray-900 mb-2">Account Registration</h4>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
              <li>You must be 13+ years old</li>
              <li>One account per person</li>
              <li>Provide accurate information</li>
              <li>Keep credentials secure</li>
            </ul>
          </div>
          
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4">
            <h4 className="text-md font-bold text-gray-900 mb-2">Content Ownership</h4>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
              <li>You retain rights to your content</li>
              <li>You grant us license to display it</li>
              <li>You're responsible for your content</li>
              <li>We may use for improvement</li>
            </ul>
          </div>
        </div>

        {/* Limitation of Liability */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            Limitation of Liability
          </h3>
          <p className="text-gray-700 text-sm mb-3">
            ReviewInn shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
          </p>
          <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
            <li>Loss of profits, data, use, goodwill, or other intangible losses</li>
            <li>Damages resulting from user-generated content</li>
            <li>Unauthorized access to or use of our servers and/or personal information</li>
            <li>Interruption or cessation of transmission to or from our service</li>
          </ul>
        </div>

        {/* Contact */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 text-center">
          <h4 className="text-md font-bold text-gray-900 mb-3">Questions About These Terms?</h4>
          <p className="text-gray-700 text-sm mb-4">
            If you have questions about these Terms of Service, please contact our legal team.
          </p>
          <div className="flex justify-center space-x-3">
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm">
              Contact Legal Team
            </button>
            <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm">
              View Full Terms
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TermsOfServiceModal;