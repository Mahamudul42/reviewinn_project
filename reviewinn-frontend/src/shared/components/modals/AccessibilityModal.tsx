import React from 'react';
import { Modal } from '../../design-system/components/Modal';
import { Accessibility, Eye, Ear, Keyboard, Mouse, Heart } from 'lucide-react';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccessibilityModal: React.FC<AccessibilityModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="auth"
      title="Accessibility Statement"
      className="max-h-[90vh] overflow-y-auto"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
          <Accessibility className="h-12 w-12 text-purple-600 mx-auto mb-3" />
          <p className="text-lg text-gray-700 font-medium">
            Committed to Digital Inclusion
          </p>
          <p className="text-sm text-gray-600 mt-2">
            ReviewInn is designed to be accessible to everyone, regardless of ability.
          </p>
        </div>

        {/* Commitment */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <Heart className="h-5 w-5 text-blue-600 mr-2" />
            Our Commitment
          </h3>
          <p className="text-gray-700 text-sm">
            We believe everyone should have equal access to information and functionality. We strive to meet and exceed Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards to ensure our platform is usable by people with disabilities.
          </p>
        </div>

        {/* Accessibility Features */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
            <h4 className="text-md font-bold text-gray-900 mb-2 flex items-center">
              <Eye className="h-4 w-4 text-green-600 mr-2" />
              Visual Accessibility
            </h4>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
              <li>High contrast color schemes</li>
              <li>Scalable fonts and adjustable text size</li>
              <li>Alt text for all images</li>
              <li>Screen reader compatibility</li>
              <li>Focus indicators for navigation</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4">
            <h4 className="text-md font-bold text-gray-900 mb-2 flex items-center">
              <Keyboard className="h-4 w-4 text-yellow-600 mr-2" />
              Keyboard Navigation
            </h4>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
              <li>Full keyboard navigation support</li>
              <li>Logical tab order</li>
              <li>Skip links for main content</li>
              <li>Keyboard shortcuts</li>
              <li>No keyboard traps</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4">
            <h4 className="text-md font-bold text-gray-900 mb-2 flex items-center">
              <Ear className="h-4 w-4 text-pink-600 mr-2" />
              Audio & Media
            </h4>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
              <li>Captions for video content</li>
              <li>Audio descriptions available</li>
              <li>Transcript options</li>
              <li>No auto-playing media</li>
              <li>Volume controls</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4">
            <h4 className="text-md font-bold text-gray-900 mb-2 flex items-center">
              <Mouse className="h-4 w-4 text-indigo-600 mr-2" />
              Motor Accessibility
            </h4>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
              <li>Large click targets</li>
              <li>Generous spacing between elements</li>
              <li>No time-based interactions</li>
              <li>Drag and drop alternatives</li>
              <li>Voice navigation support</li>
            </ul>
          </div>
        </div>

        {/* Assistive Technologies */}
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Supported Assistive Technologies</h3>
          <p className="text-gray-700 text-sm mb-3">
            ReviewInn has been tested with and supports the following assistive technologies:
          </p>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-lg text-center">
              <h4 className="text-sm font-semibold text-gray-800">Screen Readers</h4>
              <p className="text-gray-700 text-xs">JAWS, NVDA, VoiceOver</p>
            </div>
            <div className="bg-white p-3 rounded-lg text-center">
              <h4 className="text-sm font-semibold text-gray-800">Voice Control</h4>
              <p className="text-gray-700 text-xs">Dragon, Voice Control</p>
            </div>
            <div className="bg-white p-3 rounded-lg text-center">
              <h4 className="text-sm font-semibold text-gray-800">Magnification</h4>
              <p className="text-gray-700 text-xs">ZoomText, Magnifier</p>
            </div>
          </div>
        </div>

        {/* Feedback & Support */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Accessibility Feedback</h3>
          <p className="text-gray-700 text-sm mb-4">
            We continuously work to improve accessibility. If you encounter any barriers or have suggestions, please let us know:
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-800 mb-1">Report Issues</h4>
              <p className="text-gray-700 text-xs">Email: accessibility@reviewsite.com</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-800 mb-1">Phone Support</h4>
              <p className="text-gray-700 text-xs">Call: 1-800-REVIEW-1</p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 text-center">
          <h4 className="text-md font-bold text-gray-900 mb-3">Need Accessibility Assistance?</h4>
          <p className="text-gray-700 text-sm mb-4">
            Our accessibility team is here to help ensure you have the best possible experience.
          </p>
          <div className="flex justify-center space-x-3">
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm">
              Contact Accessibility Team
            </button>
            <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm">
              Request Accommodation
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AccessibilityModal;