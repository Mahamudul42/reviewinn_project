import React from 'react';
import { Modal } from '../../design-system/components/Modal';
import { FileText, CheckCircle, XCircle, AlertTriangle, Flag, Users } from 'lucide-react';

interface ContentGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContentGuidelinesModal: React.FC<ContentGuidelinesModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="auth"
      title="Community Content Guidelines"
      className="max-h-[90vh] overflow-y-auto"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-4">
          <FileText className="h-12 w-12 text-rose-600 mx-auto mb-3" />
          <p className="text-lg text-gray-700 font-medium">
            Building a Respectful Review Community
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Guidelines to ensure helpful, honest, and respectful reviews for everyone.
          </p>
        </div>

        {/* Community Standards */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <Users className="h-5 w-5 text-blue-600 mr-2" />
            Our Community Standards
          </h3>
          <p className="text-gray-700 text-sm">
            ReviewInn thrives on authentic, helpful reviews. Our community guidelines ensure that everyone can share and discover genuine experiences in a safe, respectful environment.
          </p>
        </div>

        {/* What's Encouraged */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            What We Encourage
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="bg-white p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">✅ Honest Experiences</h4>
                <p className="text-gray-700 text-xs">Share your genuine experience with products and services</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">✅ Detailed Reviews</h4>
                <p className="text-gray-700 text-xs">Provide specific, helpful information for other users</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">✅ Constructive Feedback</h4>
                <p className="text-gray-700 text-xs">Offer suggestions for improvement when appropriate</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="bg-white p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">✅ Respectful Language</h4>
                <p className="text-gray-700 text-xs">Use professional, courteous language</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">✅ Relevant Photos</h4>
                <p className="text-gray-700 text-xs">Include photos that support your review</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">✅ Balanced Perspective</h4>
                <p className="text-gray-700 text-xs">Share both positive and negative aspects fairly</p>
              </div>
            </div>
          </div>
        </div>

        {/* What's Prohibited */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <XCircle className="h-5 w-5 text-red-600 mr-2" />
            Prohibited Content
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="bg-white p-3 rounded-lg border-l-4 border-red-500">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">❌ Fake Reviews</h4>
                <p className="text-gray-700 text-xs">Reviews for businesses you haven't used or experiences you haven't had</p>
              </div>
              <div className="bg-white p-3 rounded-lg border-l-4 border-red-500">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">❌ Hate Speech</h4>
                <p className="text-gray-700 text-xs">Discriminatory language based on race, religion, gender, etc.</p>
              </div>
              <div className="bg-white p-3 rounded-lg border-l-4 border-red-500">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">❌ Personal Attacks</h4>
                <p className="text-gray-700 text-xs">Attacks on individuals rather than focusing on the service</p>
              </div>
              <div className="bg-white p-3 rounded-lg border-l-4 border-red-500">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">❌ Spam Content</h4>
                <p className="text-gray-700 text-xs">Promotional content, repetitive posts, or irrelevant information</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="bg-white p-3 rounded-lg border-l-4 border-red-500">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">❌ Private Information</h4>
                <p className="text-gray-700 text-xs">Personal details of staff, customers, or other individuals</p>
              </div>
              <div className="bg-white p-3 rounded-lg border-l-4 border-red-500">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">❌ Defamatory Content</h4>
                <p className="text-gray-700 text-xs">False statements that damage reputation</p>
              </div>
              <div className="bg-white p-3 rounded-lg border-l-4 border-red-500">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">❌ Conflict of Interest</h4>
                <p className="text-gray-700 text-xs">Reviews of competitors or businesses you have a financial interest in</p>
              </div>
              <div className="bg-white p-3 rounded-lg border-l-4 border-red-500">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">❌ Inappropriate Media</h4>
                <p className="text-gray-700 text-xs">Explicit, violent, or unrelated images and videos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Review Quality Standards */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Quality Standards</h3>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-lg text-center">
              <h4 className="text-sm font-semibold text-gray-800">Minimum Length</h4>
              <p className="text-gray-700 text-xs">At least 50 characters for meaningful reviews</p>
            </div>
            <div className="bg-white p-3 rounded-lg text-center">
              <h4 className="text-sm font-semibold text-gray-800">Recent Experience</h4>
              <p className="text-gray-700 text-xs">Reviews should be based on recent experiences</p>
            </div>
            <div className="bg-white p-3 rounded-lg text-center">
              <h4 className="text-sm font-semibold text-gray-800">One Per Business</h4>
              <p className="text-gray-700 text-xs">One review per user per business</p>
            </div>
          </div>
        </div>

        {/* Enforcement */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <AlertTriangle className="h-5 w-5 text-purple-600 mr-2" />
            Enforcement & Consequences
          </h3>
          <div className="space-y-3">
            <p className="text-gray-700 text-sm">
              Violations of our content guidelines may result in:
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">Content Removal</h4>
                <p className="text-gray-700 text-xs">Reviews that violate guidelines will be removed</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">Account Warnings</h4>
                <p className="text-gray-700 text-xs">Notifications about guideline violations</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">Temporary Suspension</h4>
                <p className="text-gray-700 text-xs">Temporary restriction of posting privileges</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">Account Termination</h4>
                <p className="text-gray-700 text-xs">Permanent ban for serious or repeated violations</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reporting */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <Flag className="h-5 w-5 text-orange-600 mr-2" />
            Reporting Violations
          </h3>
          <p className="text-gray-700 text-sm mb-3">
            Help us maintain community standards by reporting content that violates our guidelines:
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-800 mb-1">Report Button</h4>
              <p className="text-gray-700 text-xs">Use the report button on any review or comment</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-800 mb-1">Contact Support</h4>
              <p className="text-gray-700 text-xs">Email our moderation team directly</p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 text-center">
          <h4 className="text-md font-bold text-gray-900 mb-3">Questions About Guidelines?</h4>
          <p className="text-gray-700 text-sm mb-4">
            Our community team is here to help clarify any questions about our content guidelines.
          </p>
          <div className="flex justify-center space-x-3">
            <button className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors text-sm">
              Contact Community Team
            </button>
            <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm">
              Report Content
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ContentGuidelinesModal;