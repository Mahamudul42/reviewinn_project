import React from 'react';
import { FileText, AlertTriangle, Scale, Shield, Users, Ban } from 'lucide-react';
import LegalPageLayout from './components/LegalPageLayout';

const TermsOfServicePage: React.FC = () => {
  const lastUpdated = "January 11, 2025";
  
  return (
    <LegalPageLayout
      title="Terms of Service"
      lastUpdated={lastUpdated}
      icon={FileText}
    >
      <div>

        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Notice</h3>
              <p className="text-yellow-700">
                By using ReviewInn, you agree to these Terms of Service. Please read them carefully. 
                Users are solely responsible for their reviews and content. ReviewInn is not responsible for user-generated content or decisions made based on reviews.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Scale className="h-6 w-6 text-blue-600 mr-2" />
              Acceptance of Terms
            </h2>
            <p className="text-gray-800 mb-6">
              These Terms of Service ("Terms") govern your use of ReviewInn ("Platform," "Service," "we," "us," or "our"). By accessing or using our platform, you agree to be bound by these Terms and our Privacy Policy.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Users className="h-6 w-6 text-green-600 mr-2" />
              User Responsibilities
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Account Registration</h3>
            <ul className="list-disc list-inside text-gray-800 mb-4 space-y-2">
              <li>You must be at least 13 years old to use our service</li>
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>You are responsible for all activities under your account</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Content Standards</h3>
            <ul className="list-disc list-inside text-gray-800 mb-4 space-y-2">
              <li><strong>Honest Reviews:</strong> All reviews must be based on genuine experiences</li>
              <li><strong>Respectful Language:</strong> No offensive, abusive, or discriminatory content</li>
              <li><strong>No Spam:</strong> Avoid repetitive or promotional content</li>
              <li><strong>Privacy Respect:</strong> Do not share personal information of others</li>
              <li><strong>Factual Accuracy:</strong> Strive for truthful and accurate information</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Prohibited Activities</h3>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li>Posting fake, misleading, or fraudulent reviews</li>
              <li>Manipulating ratings or review systems</li>
              <li>Impersonating others or creating fake accounts</li>
              <li>Uploading malicious software or harmful content</li>
              <li>Attempting to hack or compromise platform security</li>
              <li>Using the platform for illegal activities</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Shield className="h-6 w-6 text-purple-600 mr-2" />
              Platform Rights and Responsibilities
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Our Rights</h3>
            <ul className="list-disc list-inside text-gray-800 mb-4 space-y-2">
              <li>Moderate, edit, or remove content that violates these Terms</li>
              <li>Suspend or terminate accounts for violations</li>
              <li>Update these Terms with reasonable notice</li>
              <li>Discontinue or modify services as needed</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Content Ownership</h3>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li>You retain ownership of your original content</li>
              <li>You grant us a license to use, display, and distribute your content</li>
              <li>We own the platform, software, and aggregated data</li>
              <li>Users cannot use platform data without explicit permission</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Ban className="h-6 w-6 text-red-600 mr-2" />
              Disclaimers and Limitations
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">User-Generated Content</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 font-semibold">
                IMPORTANT: Users are solely responsible for their reviews and content. ReviewInn does not endorse, verify, or guarantee the accuracy of user reviews.
              </p>
            </div>
            <ul className="list-disc list-inside text-gray-800 mb-4 space-y-2">
              <li>Reviews reflect individual user opinions and experiences</li>
              <li>We do not verify the accuracy of user-submitted information</li>
              <li>Users should conduct their own research before making decisions</li>
              <li>ReviewInn is not responsible for outcomes based on user reviews</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Platform Availability</h3>
            <ul className="list-disc list-inside text-gray-800 mb-4 space-y-2">
              <li>We provide the platform "as is" without warranties</li>
              <li>We do not guarantee uninterrupted service availability</li>
              <li>Technical issues may occur despite our best efforts</li>
              <li>We are not liable for service interruptions or data loss</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Limitation of Liability</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <p className="text-gray-800 font-medium">
                ReviewInn and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform or reliance on user-generated content.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Usage and Protection</h2>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li>Platform data is proprietary and protected by intellectual property laws</li>
              <li>Scraping, automated data collection, or unauthorized access is prohibited</li>
              <li>Commercial use of platform data requires explicit written permission</li>
              <li>We respect user privacy as outlined in our Privacy Policy</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Indemnification</h2>
            <p className="text-gray-800 mb-6">
              You agree to indemnify and hold harmless ReviewInn from any claims, damages, or expenses arising from your use of the platform, your content, or your violation of these Terms.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Governing Law</h2>
            <p className="text-gray-800 mb-6">
              These Terms are governed by the laws of the jurisdiction where ReviewInn is incorporated. Any disputes will be resolved through binding arbitration or in appropriate courts.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to Terms</h2>
            <p className="text-gray-800 mb-6">
              We may update these Terms periodically. We will notify users of significant changes via email or platform notifications. Continued use after changes constitutes acceptance of the updated Terms.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
            <p className="text-gray-800 mb-4">
              For questions about these Terms or to report violations, contact us at:
            </p>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li>Email: legal@reviewsite.com</li>
              <li>Report Abuse: abuse@reviewsite.com</li>
              <li>Help Center: /help</li>
            </ul>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-blue-600 rounded-2xl shadow-lg p-8 text-white text-center">
          <Scale className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Questions About Our Terms?</h2>
          <p className="text-blue-100 mb-6">
            If you have any questions about these Terms of Service or need clarification, please contact our legal team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:legal@reviewsite.com" 
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Contact Legal Team
            </a>
            <a 
              href="/help" 
              className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
            >
              Help Center
            </a>
          </div>
        </div>
      </div>
    </LegalPageLayout>
  );
};

export default TermsOfServicePage;