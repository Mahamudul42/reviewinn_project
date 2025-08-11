import React from 'react';
import { Modal } from '../../design-system/components/Modal';
import { Cookie, Settings, BarChart3, Target, Shield, Info } from 'lucide-react';

interface CookiesPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CookiesPolicyModal: React.FC<CookiesPolicyModalProps> = ({ isOpen, onClose }) => {
  const lastUpdated = "January 11, 2025";
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="auth"
      title="Cookies Policy"
      className="max-h-[90vh] overflow-y-auto"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
          <Cookie className="h-12 w-12 text-orange-600 mx-auto mb-3" />
          <p className="text-lg text-gray-700 font-medium">
            Last Updated: {lastUpdated}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Learn how we use cookies to improve your ReviewInn experience.
          </p>
        </div>

        {/* What Are Cookies */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <Info className="h-5 w-5 text-blue-600 mr-2" />
            What Are Cookies?
          </h3>
          <p className="text-gray-700 text-sm">
            Cookies are small text files stored on your device when you visit our website. They help us provide you with a better browsing experience by remembering your preferences and enabling essential site functionality.
          </p>
        </div>

        {/* Types of Cookies */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
            <h4 className="text-md font-bold text-gray-900 mb-2 flex items-center">
              <Shield className="h-4 w-4 text-green-600 mr-2" />
              Essential Cookies
            </h4>
            <p className="text-gray-700 text-sm mb-2">These cookies are necessary for the website to function properly and cannot be disabled.</p>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
              <li>User authentication and login status</li>
              <li>Shopping cart and session management</li>
              <li>Security and fraud prevention</li>
              <li>Basic site functionality</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
            <h4 className="text-md font-bold text-gray-900 mb-2 flex items-center">
              <Settings className="h-4 w-4 text-purple-600 mr-2" />
              Functional Cookies
            </h4>
            <p className="text-gray-700 text-sm mb-2">These cookies enable enhanced functionality and personalization.</p>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
              <li>Language and region preferences</li>
              <li>User interface customizations</li>
              <li>Accessibility settings</li>
              <li>Recently viewed content</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4">
            <h4 className="text-md font-bold text-gray-900 mb-2 flex items-center">
              <BarChart3 className="h-4 w-4 text-yellow-600 mr-2" />
              Analytics Cookies
            </h4>
            <p className="text-gray-700 text-sm mb-2">These cookies help us understand how visitors interact with our website.</p>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
              <li>Page views and user behavior</li>
              <li>Site performance monitoring</li>
              <li>Error tracking and debugging</li>
              <li>Popular content identification</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4">
            <h4 className="text-md font-bold text-gray-900 mb-2 flex items-center">
              <Target className="h-4 w-4 text-pink-600 mr-2" />
              Marketing Cookies
            </h4>
            <p className="text-gray-700 text-sm mb-2">These cookies are used to deliver relevant advertisements and track campaign effectiveness.</p>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
              <li>Personalized content recommendations</li>
              <li>Social media integration</li>
              <li>Advertising campaign tracking</li>
              <li>Cross-site behavior analysis</li>
            </ul>
          </div>
        </div>

        {/* Cookie Management */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Managing Your Cookie Preferences</h3>
          <div className="space-y-3">
            <p className="text-gray-700 text-sm">
              You have control over which cookies you accept. Here are your options:
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">Browser Settings</h4>
                <p className="text-gray-700 text-xs">Configure cookie settings directly in your browser preferences.</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">Cookie Banner</h4>
                <p className="text-gray-700 text-xs">Use our cookie consent banner to customize your preferences.</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">Account Settings</h4>
                <p className="text-gray-700 text-xs">Manage preferences in your ReviewInn account settings.</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">Opt-Out Tools</h4>
                <p className="text-gray-700 text-xs">Use industry opt-out tools for advertising cookies.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Third-Party Cookies */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Third-Party Services</h3>
          <p className="text-gray-700 text-sm mb-3">
            We use trusted third-party services that may set their own cookies:
          </p>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-lg text-center">
              <h4 className="text-sm font-semibold text-gray-800">Google Analytics</h4>
              <p className="text-gray-700 text-xs">Website analytics</p>
            </div>
            <div className="bg-white p-3 rounded-lg text-center">
              <h4 className="text-sm font-semibold text-gray-800">Social Media</h4>
              <p className="text-gray-700 text-xs">Sharing and integration</p>
            </div>
            <div className="bg-white p-3 rounded-lg text-center">
              <h4 className="text-sm font-semibold text-gray-800">CDN Services</h4>
              <p className="text-gray-700 text-xs">Content delivery</p>
            </div>
          </div>
        </div>

        {/* Contact & Settings */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 text-center">
          <h4 className="text-md font-bold text-gray-900 mb-3">Cookie Preferences</h4>
          <p className="text-gray-700 text-sm mb-4">
            Customize your cookie settings or contact us with questions about our cookie policy.
          </p>
          <div className="flex justify-center space-x-3">
            <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm">
              Manage Cookie Settings
            </button>
            <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CookiesPolicyModal;