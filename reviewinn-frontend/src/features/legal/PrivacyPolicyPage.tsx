import React from 'react';
import { Shield, Eye, Lock, Database, UserCheck, AlertCircle } from 'lucide-react';

const PrivacyPolicyPage: React.FC = () => {
  const lastUpdated = "January 11, 2025";
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-lg text-gray-800">
            Last Updated: {lastUpdated}
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Eye className="h-6 w-6 text-blue-600 mr-2" />
              Introduction
            </h2>
            <p className="text-gray-800 mb-6">
              At ReviewInn ("we," "our," or "us"), we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our review platform and related services.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Database className="h-6 w-6 text-green-600 mr-2" />
              Information We Collect
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Personal Information</h3>
            <ul className="list-disc list-inside text-gray-800 mb-4 space-y-2">
              <li>Account information (name, email address, username)</li>
              <li>Profile information (bio, avatar, preferences)</li>
              <li>Contact details when you reach out to us</li>
              <li>Payment information (processed securely by third-party providers)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Usage Information</h3>
            <ul className="list-disc list-inside text-gray-800 mb-4 space-y-2">
              <li>Reviews, ratings, and comments you submit</li>
              <li>Search queries and browsing behavior</li>
              <li>Device information (IP address, browser type, operating system)</li>
              <li>Usage analytics and performance metrics</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Automatically Collected Information</h3>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li>Cookies and similar tracking technologies</li>
              <li>Log files and server data</li>
              <li>Location information (if permitted)</li>
              <li>Referral sources and traffic patterns</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <UserCheck className="h-6 w-6 text-purple-600 mr-2" />
              How We Use Your Information
            </h2>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li>Provide, operate, and maintain our services</li>
              <li>Process and display your reviews and ratings</li>
              <li>Communicate with you about your account and our services</li>
              <li>Improve our platform through analytics and feedback</li>
              <li>Prevent fraud and ensure platform security</li>
              <li>Comply with legal obligations and resolve disputes</li>
              <li>Send marketing communications (with your consent)</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Lock className="h-6 w-6 text-red-600 mr-2" />
              Information Sharing and Disclosure
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">We may share your information in the following circumstances:</h3>
            <ul className="list-disc list-inside text-gray-800 mb-4 space-y-2">
              <li><strong>Public Reviews:</strong> Your reviews, ratings, and profile information are publicly visible</li>
              <li><strong>Service Providers:</strong> Third-party vendors who help us operate our platform</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
              <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
              <li><strong>Consent:</strong> When you explicitly authorize us to share your information</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">We do NOT sell your personal information to third parties.</h3>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Security</h2>
            <p className="text-gray-800 mb-6">
              We implement industry-standard security measures to protect your information, including encryption, secure servers, and regular security audits. However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights and Choices</h2>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li><strong>Access:</strong> Request access to your personal information</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Cookies:</strong> Control cookie preferences in your browser</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>
            <p className="text-gray-800 mb-6">
              We retain your information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. Reviews may remain publicly visible even after account deletion to maintain platform integrity.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">International Data Transfers</h2>
            <p className="text-gray-800 mb-6">
              Your information may be transferred to and processed in countries other than your residence. We ensure appropriate safeguards are in place to protect your data in accordance with applicable privacy laws.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
            <p className="text-gray-800 mb-6">
              Our services are not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child, please contact us immediately.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
            <p className="text-gray-800 mb-6">
              We may update this Privacy Policy periodically. We will notify you of significant changes by email or through our platform. Your continued use of our services after such modifications constitutes acceptance of the updated policy.
            </p>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-blue-600 rounded-2xl shadow-lg p-8 text-white text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Questions About Privacy?</h2>
          <p className="text-blue-100 mb-6">
            If you have any questions about this Privacy Policy or our data practices, please contact us.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:privacy@reviewsite.com" 
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Contact Privacy Team
            </a>
            <a 
              href="/data-protection" 
              className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
            >
              Data Protection Info
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;