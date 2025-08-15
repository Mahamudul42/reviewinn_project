import React from 'react';
import { BookOpen, CheckCircle, XCircle, AlertTriangle, Flag, Star } from 'lucide-react';
import LegalPageLayout from './components/LegalPageLayout';

const ContentGuidelinesPage: React.FC = () => {
  const lastUpdated = "January 11, 2025";
  
  return (
    <LegalPageLayout
      title="Content Guidelines"
      lastUpdated={lastUpdated}
      icon={BookOpen}
    >
      <div>

        {/* Important Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Community Standards</h3>
              <p className="text-blue-700">
                Our content guidelines help maintain a respectful, helpful, and trustworthy community for all users. 
                By following these guidelines, you contribute to making ReviewInn a valuable resource for everyone.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              What Makes a Good Review
            </h2>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-green-800 mb-3">Encouraged Content</h3>
              <ul className="list-disc list-inside text-green-700 space-y-2">
                <li><strong>Authentic Experiences:</strong> Share genuine, first-hand experiences</li>
                <li><strong>Detailed Feedback:</strong> Provide specific, helpful details</li>
                <li><strong>Constructive Criticism:</strong> Offer balanced, fair assessments</li>
                <li><strong>Relevant Information:</strong> Focus on aspects that matter to others</li>
                <li><strong>Respectful Language:</strong> Use polite, professional tone</li>
                <li><strong>Recent Experiences:</strong> Share timely, current information</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Review Quality Standards</h3>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li>Minimum 20 characters for meaningful feedback</li>
              <li>Clear, readable writing without excessive abbreviations</li>
              <li>Specific examples and details when possible</li>
              <li>Balanced perspective highlighting both positives and negatives</li>
              <li>Relevant photos or media that add value</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <XCircle className="h-6 w-6 text-red-600 mr-2" />
              Prohibited Content
            </h2>
            
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Fake or Misleading Content</h3>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  <li>Reviews based on hearsay or second-hand information</li>
                  <li>Fake reviews for businesses you haven't used</li>
                  <li>Incentivized reviews (paid, gifted, or solicited)</li>
                  <li>Review manipulation or coordinated campaigns</li>
                </ul>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Inappropriate Content</h3>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  <li>Hate speech, discrimination, or harassment</li>
                  <li>Explicit sexual content or graphic violence</li>
                  <li>Personal attacks or threats</li>
                  <li>Spam, repetitive, or irrelevant content</li>
                </ul>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Privacy Violations</h3>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  <li>Personal information of others (names, addresses, phone numbers)</li>
                  <li>Photos of people without consent</li>
                  <li>Private business information or trade secrets</li>
                  <li>Medical information or health records</li>
                </ul>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Legal Issues</h3>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  <li>Defamatory or libelous statements</li>
                  <li>Copyright or trademark infringement</li>
                  <li>Illegal activities or services</li>
                  <li>Fraudulent or deceptive practices</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8 flex items-center">
              <Star className="h-6 w-6 text-yellow-600 mr-2" />
              Rating Guidelines
            </h2>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">Rating Scale</h3>
              <ul className="list-disc list-inside text-yellow-700 space-y-1">
                <li><strong>5 Stars:</strong> Exceptional experience, exceeded expectations</li>
                <li><strong>4 Stars:</strong> Very good experience, minor issues</li>
                <li><strong>3 Stars:</strong> Average experience, met basic expectations</li>
                <li><strong>2 Stars:</strong> Below average, notable problems</li>
                <li><strong>1 Star:</strong> Poor experience, major issues</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Photo and Media Guidelines</h2>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li>Photos should be relevant and add value to the review</li>
              <li>Respect privacy - no photos of people without consent</li>
              <li>Keep photos appropriate and family-friendly</li>
              <li>Maximum 5 photos per review</li>
              <li>No copyrighted images without permission</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Business Response Guidelines</h2>
            <p className="text-gray-800 mb-4">
              Business owners can respond to reviews with these guidelines:
            </p>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li>Respond professionally and courteously</li>
              <li>Address specific concerns raised in reviews</li>
              <li>Avoid defensive or aggressive language</li>
              <li>Don't share customer's personal information</li>
              <li>Focus on resolution and improvement</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Enforcement</h2>
            <p className="text-gray-800 mb-4">
              We enforce these guidelines through:
            </p>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li>Automated content filtering systems</li>
              <li>Community reporting and moderation</li>
              <li>Manual review by our content team</li>
              <li>User education and warnings</li>
              <li>Content removal or account suspension</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Appeal Process</h2>
            <p className="text-gray-800 mb-4">
              If your content is removed or restricted:
            </p>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li>You'll receive a notification explaining the reason</li>
              <li>You can appeal the decision within 30 days</li>
              <li>We'll review your appeal within 5 business days</li>
              <li>You can provide additional context or evidence</li>
              <li>Our decision will be communicated clearly</li>
            </ul>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-blue-600 rounded-2xl shadow-lg p-8 text-white text-center">
          <Flag className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Questions About Content Guidelines?</h2>
          <p className="text-blue-100 mb-6">
            If you have questions about our content guidelines or need help with your review, our community team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:content@reviewsite.com" 
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Contact Content Team
            </a>
            <a 
              href="/report-abuse" 
              className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
            >
              Report Content
            </a>
          </div>
        </div>
      </div>
    </LegalPageLayout>
  );
};

export default ContentGuidelinesPage;