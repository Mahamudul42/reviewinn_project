import React from 'react';
import { Cookie, Settings, Eye, BarChart3, Shield, Trash2 } from 'lucide-react';

const CookiesPolicyPage: React.FC = () => {
  const lastUpdated = "January 11, 2025";
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Cookie className="h-16 w-16 text-orange-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookies Policy</h1>
          <p className="text-lg text-gray-800">
            Last Updated: {lastUpdated}
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Eye className="h-6 w-6 text-blue-600 mr-2" />
              What Are Cookies?
            </h2>
            <p className="text-gray-800 mb-6">
              Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and to provide information to website owners about how users interact with their site.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Settings className="h-6 w-6 text-green-600 mr-2" />
              How We Use Cookies
            </h2>
            <p className="text-gray-800 mb-6">
              ReviewInn uses cookies to enhance your browsing experience, analyze site traffic, and improve our services. We are committed to transparency about our cookie usage and provide you with control over your preferences.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Types of Cookies We Use</h2>
            
            <div className="space-y-6">
              {/* Essential Cookies */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-green-800 mb-3">Essential Cookies</h3>
                <p className="text-green-700 mb-3">
                  These cookies are necessary for the website to function properly and cannot be disabled.
                </p>
                <ul className="list-disc list-inside text-green-600 space-y-1">
                  <li>Authentication and login sessions</li>
                  <li>Shopping cart and form submissions</li>
                  <li>Security and fraud prevention</li>
                  <li>Site navigation and basic functionality</li>
                </ul>
              </div>

              {/* Analytics Cookies */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-800 mb-3 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Analytics Cookies
                </h3>
                <p className="text-blue-700 mb-3">
                  These cookies help us understand how visitors interact with our website.
                </p>
                <ul className="list-disc list-inside text-blue-600 space-y-1">
                  <li>Page views and site usage statistics</li>
                  <li>Popular content and user flow analysis</li>
                  <li>Performance monitoring and optimization</li>
                  <li>Error tracking and debugging</li>
                </ul>
              </div>

              {/* Functional Cookies */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-purple-800 mb-3">Functional Cookies</h3>
                <p className="text-purple-700 mb-3">
                  These cookies enhance your experience by remembering your preferences.
                </p>
                <ul className="list-disc list-inside text-purple-600 space-y-1">
                  <li>Language and region preferences</li>
                  <li>Theme and display settings</li>
                  <li>Saved searches and filters</li>
                  <li>Personalized content recommendations</li>
                </ul>
              </div>

              {/* Marketing Cookies */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-orange-800 mb-3">Marketing Cookies</h3>
                <p className="text-orange-700 mb-3">
                  These cookies are used to deliver relevant advertisements and measure campaign effectiveness.
                </p>
                <ul className="list-disc list-inside text-orange-600 space-y-1">
                  <li>Targeted advertising based on interests</li>
                  <li>Social media integration and sharing</li>
                  <li>Campaign performance tracking</li>
                  <li>Retargeting and conversion optimization</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Third-Party Cookies</h2>
            <p className="text-gray-800 mb-4">
              We may use third-party services that set their own cookies. These include:
            </p>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li><strong>Google Analytics:</strong> For website traffic analysis</li>
              <li><strong>Social Media Platforms:</strong> For social login and sharing features</li>
              <li><strong>Content Delivery Networks:</strong> For faster content delivery</li>
              <li><strong>Payment Processors:</strong> For secure payment processing</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Shield className="h-6 w-6 text-purple-600 mr-2" />
              Your Cookie Choices
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Cookie Consent</h3>
            <p className="text-gray-800 mb-4">
              When you first visit our website, we will ask for your consent to use non-essential cookies. You can:
            </p>
            <ul className="list-disc list-inside text-gray-800 mb-4 space-y-2">
              <li>Accept all cookies for the full website experience</li>
              <li>Customize your preferences by cookie category</li>
              <li>Reject non-essential cookies (some features may be limited)</li>
              <li>Change your preferences at any time</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Browser Settings</h3>
            <p className="text-gray-800 mb-4">
              You can also control cookies through your browser settings:
            </p>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li>Block all cookies (may affect website functionality)</li>
              <li>Allow cookies from specific sites only</li>
              <li>Delete cookies automatically when you close your browser</li>
              <li>Receive notifications when cookies are set</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Trash2 className="h-6 w-6 text-red-600 mr-2" />
              Managing Your Cookies
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Deleting Cookies</h3>
            <p className="text-gray-800 mb-4">
              To delete cookies that have already been set:
            </p>
            <ul className="list-disc list-inside text-gray-800 mb-4 space-y-2">
              <li><strong>Chrome:</strong> Settings → Privacy and Security → Clear browsing data</li>
              <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
              <li><strong>Edge:</strong> Settings → Privacy, search, and services → Clear browsing data</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Opting Out of Marketing Cookies</h3>
            <p className="text-gray-800 mb-6">
              You can opt out of marketing cookies through industry opt-out tools:
            </p>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li>Network Advertising Initiative (NAI) opt-out</li>
              <li>Digital Advertising Alliance (DAA) opt-out</li>
              <li>European Interactive Digital Advertising Alliance (EDAA) opt-out</li>
              <li>Google Ads Settings</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookie Retention</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Cookie Lifespan</h3>
              <ul className="list-disc list-inside text-gray-800 space-y-1">
                <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
                <li><strong>Persistent Cookies:</strong> Remain for a specified period (typically 1-24 months)</li>
                <li><strong>Essential Cookies:</strong> Remain as long as necessary for site functionality</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
            <p className="text-gray-800 mb-6">
              We may update this Cookies Policy to reflect changes in our practices or for legal compliance. We will notify users of significant changes and obtain consent where required by law.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-800 mb-4">
              If you have questions about our use of cookies or this policy, please contact us:
            </p>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li>Email: privacy@reviewsite.com</li>
              <li>Privacy Settings: Available in your account settings</li>
              <li>Help Center: /help</li>
            </ul>
          </div>
        </div>

        {/* Cookie Settings Section */}
        <div className="bg-orange-600 rounded-2xl shadow-lg p-8 text-white text-center">
          <Cookie className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Manage Your Cookie Preferences</h2>
          <p className="text-orange-100 mb-6">
            You can update your cookie preferences at any time. Your choices will be saved and respected across all your visits to our site.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors">
              Cookie Preferences
            </button>
            <a 
              href="/privacy-policy" 
              className="bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-800 transition-colors"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiesPolicyPage;