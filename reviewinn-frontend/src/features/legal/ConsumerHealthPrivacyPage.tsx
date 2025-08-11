import React from 'react';
import { Heart, Shield, UserCheck, AlertCircle, Lock, Eye } from 'lucide-react';

const ConsumerHealthPrivacyPage: React.FC = () => {
  const lastUpdated = "January 11, 2025";
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Heart className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Consumer Health Privacy</h1>
          <p className="text-lg text-gray-800">
            Last Updated: {lastUpdated}
          </p>
        </div>

        {/* Important Notice */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-red-600 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Important Health Information Notice</h3>
              <p className="text-red-700">
                ReviewInn is not a healthcare provider. Health-related reviews and information on our platform are for informational purposes only and should not replace professional medical advice, diagnosis, or treatment.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Shield className="h-6 w-6 text-blue-600 mr-2" />
              Our Commitment to Health Privacy
            </h2>
            <p className="text-gray-800 mb-6">
              We understand that health-related information is particularly sensitive. This Consumer Health Privacy Notice explains how we handle health information and our commitment to protecting your privacy when using ReviewInn for health-related reviews and discussions.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <UserCheck className="h-6 w-6 text-green-600 mr-2" />
              Types of Health Information
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Information We May Collect</h3>
            <ul className="list-disc list-inside text-gray-800 mb-4 space-y-2">
              <li>Reviews about healthcare providers, hospitals, or medical facilities</li>
              <li>Reviews about health-related products or services</li>
              <li>General health experiences shared voluntarily in reviews</li>
              <li>Wellness and fitness-related content</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Information We Do NOT Collect</h3>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li>Protected Health Information (PHI) as defined by HIPAA</li>
              <li>Medical records or clinical data</li>
              <li>Insurance information</li>
              <li>Prescription or medication details</li>
              <li>Specific medical diagnoses or conditions</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Lock className="h-6 w-6 text-purple-600 mr-2" />
              Health Information Protection
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Privacy Safeguards</h3>
            <ul className="list-disc list-inside text-gray-800 mb-4 space-y-2">
              <li>We encourage users to avoid sharing specific personal health information</li>
              <li>Our content moderation systems flag potentially sensitive health data</li>
              <li>We provide tools to report inappropriate health information sharing</li>
              <li>Enhanced security measures protect health-related content</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">User Guidelines for Health Reviews</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 font-medium">
                When writing health-related reviews, please:
              </p>
            </div>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li>Focus on service quality, facility conditions, and general experiences</li>
              <li>Avoid sharing personal medical details or diagnoses</li>
              <li>Do not include names of specific medical conditions</li>
              <li>Respect the privacy of other patients and healthcare providers</li>
              <li>Use general terms rather than specific medical terminology</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Eye className="h-6 w-6 text-indigo-600 mr-2" />
              Compliance and Standards
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">HIPAA Compliance</h3>
            <p className="text-gray-800 mb-4">
              While ReviewInn is not a covered entity under HIPAA, we respect HIPAA principles and encourage users to maintain privacy standards when discussing healthcare experiences.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">State Privacy Laws</h3>
            <p className="text-gray-800 mb-4">
              We comply with applicable state privacy laws, including the California Consumer Privacy Act (CCPA) and similar regulations, particularly regarding health information.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">International Standards</h3>
            <p className="text-gray-800 mb-6">
              For international users, we align with GDPR requirements and other applicable privacy regulations regarding health data processing.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Health Information Sharing</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">We do NOT share health information with:</h3>
            <ul className="list-disc list-inside text-gray-800 mb-4 space-y-2">
              <li>Healthcare providers or institutions</li>
              <li>Insurance companies</li>
              <li>Employers</li>
              <li>Government agencies (except as required by law)</li>
              <li>Third-party marketers</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Limited Exceptions</h3>
            <p className="text-gray-800 mb-6">
              We may disclose health information only in limited circumstances such as legal requirements, user consent, or to prevent serious harm to health or safety.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">User Rights and Controls</h2>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li><strong>Content Control:</strong> Edit or delete health-related reviews at any time</li>
              <li><strong>Privacy Settings:</strong> Control visibility of health-related content</li>
              <li><strong>Data Deletion:</strong> Request removal of health information from our platform</li>
              <li><strong>Access Rights:</strong> Request access to health information we have about you</li>
              <li><strong>Correction Rights:</strong> Request corrections to inaccurate health information</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Disclaimers</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Medical Disclaimer</h3>
              <p className="text-gray-700">
                Information on ReviewInn is for informational purposes only. It is not intended as medical advice and should not be used to diagnose, treat, cure, or prevent any disease or condition. Always consult with qualified healthcare providers for medical advice and treatment.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Reporting Health Privacy Concerns</h2>
            <p className="text-gray-800 mb-4">
              If you believe someone has shared inappropriate health information or violated privacy standards, please report it immediately:
            </p>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li>Use our "Report" feature on any review or content</li>
              <li>Contact our privacy team at privacy@reviewsite.com</li>
              <li>Submit a formal complaint through our Help Center</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Updates to This Notice</h2>
            <p className="text-gray-800 mb-6">
              We may update this Consumer Health Privacy Notice to reflect changes in our practices or applicable laws. We will notify users of significant changes and obtain consent where required.
            </p>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-red-600 rounded-2xl shadow-lg p-8 text-white text-center">
          <Heart className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Questions About Health Privacy?</h2>
          <p className="text-red-100 mb-6">
            If you have concerns about health privacy or questions about this notice, please contact our dedicated health privacy team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:healthprivacy@reviewsite.com" 
              className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors"
            >
              Contact Health Privacy Team
            </a>
            <a 
              href="/privacy-policy" 
              className="bg-red-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-800 transition-colors"
            >
              General Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsumerHealthPrivacyPage;