import React from 'react';
import { Accessibility, Eye, Ear, Hand, Brain, Heart, Phone } from 'lucide-react';

const AccessibilityPage: React.FC = () => {
  const lastUpdated = "January 11, 2025";
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Accessibility className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Accessibility Statement</h1>
          <p className="text-lg text-gray-800">
            Last Updated: {lastUpdated}
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Heart className="h-6 w-6 text-red-600 mr-2" />
              Our Commitment to Accessibility
            </h2>
            <p className="text-gray-800 mb-6">
              ReviewInn is committed to ensuring digital accessibility for all users, including those with disabilities. We strive to provide an inclusive experience that allows everyone to access our platform's features and content effectively.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Accessibility Standards</h2>
            <p className="text-gray-800 mb-4">
              We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA. These guidelines help make web content more accessible to people with disabilities, including:
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Eye className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="font-semibold text-blue-800">Visual Impairments</h3>
                </div>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>Blindness and low vision</li>
                  <li>Color blindness</li>
                  <li>Light sensitivity</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Ear className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="font-semibold text-green-800">Hearing Impairments</h3>
                </div>
                <ul className="text-green-700 text-sm space-y-1">
                  <li>Deafness and hard of hearing</li>
                  <li>Auditory processing disorders</li>
                  <li>Tinnitus</li>
                </ul>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Hand className="h-5 w-5 text-purple-600 mr-2" />
                  <h3 className="font-semibold text-purple-800">Motor Impairments</h3>
                </div>
                <ul className="text-purple-700 text-sm space-y-1">
                  <li>Limited fine motor control</li>
                  <li>Muscle weakness</li>
                  <li>Tremors and spasms</li>
                </ul>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Brain className="h-5 w-5 text-orange-600 mr-2" />
                  <h3 className="font-semibold text-orange-800">Cognitive Impairments</h3>
                </div>
                <ul className="text-orange-700 text-sm space-y-1">
                  <li>Learning disabilities</li>
                  <li>Memory impairments</li>
                  <li>Attention disorders</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Accessibility Features</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Keyboard Navigation</h3>
            <ul className="list-disc list-inside text-gray-800 mb-4 space-y-2">
              <li>All interactive elements are keyboard accessible</li>
              <li>Logical tab order throughout the site</li>
              <li>Skip navigation links for screen readers</li>
              <li>Visible focus indicators</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Screen Reader Support</h3>
            <ul className="list-disc list-inside text-gray-800 mb-4 space-y-2">
              <li>Semantic HTML markup</li>
              <li>ARIA labels and descriptions</li>
              <li>Alternative text for images</li>
              <li>Proper heading structure</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Visual Design</h3>
            <ul className="list-disc list-inside text-gray-800 mb-4 space-y-2">
              <li>High contrast color schemes</li>
              <li>Scalable text and interface elements</li>
              <li>Clear visual hierarchy</li>
              <li>Consistent navigation patterns</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Content Structure</h3>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li>Clear and simple language</li>
              <li>Descriptive links and buttons</li>
              <li>Logical content organization</li>
              <li>Error identification and suggestions</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Assistive Technology Compatibility</h2>
            <p className="text-gray-800 mb-4">
              Our website is designed to work with assistive technologies, including:
            </p>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li>Screen readers (NVDA, JAWS, VoiceOver)</li>
              <li>Screen magnification software</li>
              <li>Speech recognition software</li>
              <li>Alternative keyboards and mice</li>
              <li>Eye-tracking devices</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Browser and Device Support</h2>
            <p className="text-gray-800 mb-4">
              We test our accessibility features on:
            </p>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li>Modern web browsers (Chrome, Firefox, Safari, Edge)</li>
              <li>Mobile devices (iOS and Android)</li>
              <li>Common screen readers and assistive tools</li>
              <li>Various screen sizes and resolutions</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ongoing Efforts</h2>
            <p className="text-gray-800 mb-4">
              We continuously work to improve accessibility through:
            </p>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li>Regular accessibility audits and testing</li>
              <li>User feedback and testing with disabled users</li>
              <li>Staff training on accessibility best practices</li>
              <li>Collaboration with accessibility experts</li>
              <li>Implementation of new accessibility technologies</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Known Limitations</h2>
            <p className="text-gray-800 mb-4">
              While we strive for full accessibility, we acknowledge some current limitations:
            </p>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li>Some third-party content may not meet accessibility standards</li>
              <li>Certain interactive features are being improved for better accessibility</li>
              <li>We are working to make all video content fully accessible</li>
              <li>Some legacy content is being updated to meet current standards</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Accessibility Settings</h2>
            <p className="text-gray-800 mb-4">
              You can customize your experience using:
            </p>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li>Browser zoom and text size controls</li>
              <li>Operating system accessibility settings</li>
              <li>Browser extensions for accessibility</li>
              <li>Custom CSS for personal preferences</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Alternative Formats</h2>
            <p className="text-gray-800 mb-6">
              If you need information in an alternative format, we can provide:
            </p>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li>Large print versions</li>
              <li>Plain text documents</li>
              <li>Audio descriptions</li>
              <li>Simplified language versions</li>
            </ul>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="bg-blue-600 rounded-2xl shadow-lg p-8 text-white text-center">
          <Phone className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Accessibility Feedback</h2>
          <p className="text-blue-100 mb-6">
            We welcome your feedback on our accessibility efforts. If you encounter any barriers or have suggestions for improvement, please let us know.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:accessibility@reviewsite.com" 
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Report Accessibility Issue
            </a>
            <a 
              href="/contact" 
              className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
            >
              General Contact
            </a>
          </div>
          
          <div className="mt-8 text-left bg-blue-700 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Contact Information</h3>
            <p className="text-blue-100 text-sm">
              <strong>Accessibility Team:</strong> accessibility@reviewsite.com<br />
              <strong>Phone:</strong> +1-800-REVIEW-SITE<br />
              <strong>Response Time:</strong> We aim to respond within 2 business days
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityPage;