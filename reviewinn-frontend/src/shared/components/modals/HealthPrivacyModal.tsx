import React from 'react';
import { Modal } from '../../design-system/components/Modal';
import { Heart, Shield, Lock, UserCheck, FileText, AlertCircle } from 'lucide-react';

interface HealthPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HealthPrivacyModal: React.FC<HealthPrivacyModalProps> = ({ isOpen, onClose }) => {
  const lastUpdated = "January 11, 2025";
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="auth"
      title="Consumer Health Privacy"
      className="max-h-[90vh] overflow-y-auto"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4">
          <Heart className="h-12 w-12 text-teal-600 mx-auto mb-3" />
          <p className="text-lg text-gray-700 font-medium">
            Last Updated: {lastUpdated}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Special protections for health-related information and reviews.
          </p>
        </div>

        {/* Overview */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <Shield className="h-5 w-5 text-blue-600 mr-2" />
            Health Information Protection
          </h3>
          <p className="text-gray-700 text-sm">
            ReviewInn recognizes the sensitive nature of health-related information. This policy outlines our special protections and practices for handling health information in compliance with consumer protection standards.
          </p>
        </div>

        {/* Health Review Guidelines */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <UserCheck className="h-5 w-5 text-green-600 mr-2" />
            Health Review Guidelines
          </h3>
          <div className="space-y-3">
            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-2">When reviewing healthcare providers or health services:</h4>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                <li>Focus on service quality, communication, and accessibility</li>
                <li>Avoid sharing specific medical diagnoses or treatments</li>
                <li>Do not include personal health information</li>
                <li>Respect patient confidentiality and HIPAA guidelines</li>
                <li>Be objective and constructive in your feedback</li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-2">Protected Health Information (PHI):</h4>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                <li>Medical record numbers, account numbers</li>
                <li>Specific medical conditions or diagnoses</li>
                <li>Treatment details or medication information</li>
                <li>Insurance information</li>
                <li>Any information that could identify a patient</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Data Protection Measures */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <Lock className="h-5 w-5 text-purple-600 mr-2" />
            Enhanced Data Protection
          </h3>
          <ul className="list-disc list-inside text-gray-700 text-sm space-y-2">
            <li><strong>Automated Screening:</strong> Our systems scan for potential PHI in reviews</li>
            <li><strong>Manual Review:</strong> Health-related content undergoes additional human review</li>
            <li><strong>Anonymization:</strong> We automatically remove identifying information when detected</li>
            <li><strong>Secure Storage:</strong> Health-related data receives enhanced encryption</li>
            <li><strong>Limited Access:</strong> Only authorized personnel can access health-related content</li>
            <li><strong>Regular Audits:</strong> We conduct regular privacy audits for health information</li>
          </ul>
        </div>

        {/* Consumer Rights */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
            <h4 className="text-md font-bold text-gray-900 mb-2">Your Health Privacy Rights</h4>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
              <li>Request removal of health information</li>
              <li>Access your health-related data</li>
              <li>Correct inaccurate health information</li>
              <li>Opt-out of health-related communications</li>
              <li>Request enhanced privacy protection</li>
            </ul>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4">
            <h4 className="text-md font-bold text-gray-900 mb-2">Reporting Violations</h4>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
              <li>Report inappropriate health information</li>
              <li>Flag potential PHI disclosures</li>
              <li>Request content review</li>
              <li>Contact our privacy team directly</li>
              <li>File formal complaints</li>
            </ul>
          </div>
        </div>

        {/* Compliance */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <FileText className="h-5 w-5 text-yellow-600 mr-2" />
            Regulatory Compliance
          </h3>
          <div className="space-y-3">
            <p className="text-gray-700 text-sm">
              ReviewInn complies with applicable health privacy regulations including:
            </p>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
              <li><strong>HIPAA:</strong> Health Insurance Portability and Accountability Act</li>
              <li><strong>HITECH:</strong> Health Information Technology for Economic and Clinical Health Act</li>
              <li><strong>State Privacy Laws:</strong> Applicable state consumer health privacy regulations</li>
              <li><strong>International Standards:</strong> GDPR and other international privacy frameworks</li>
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            Important Disclaimer
          </h3>
          <div className="space-y-2 text-gray-700 text-sm">
            <p>
              <strong>ReviewInn is not a healthcare provider</strong> and does not provide medical advice, diagnosis, or treatment recommendations.
            </p>
            <p>
              Reviews and ratings are opinions of individual users and should not be considered as medical advice. Always consult with qualified healthcare professionals for medical decisions.
            </p>
            <p>
              In case of medical emergencies, immediately contact emergency services or visit the nearest emergency room.
            </p>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 text-center">
          <h4 className="text-md font-bold text-gray-900 mb-3">Health Privacy Questions?</h4>
          <p className="text-gray-700 text-sm mb-4">
            Our dedicated health privacy team is available to address your concerns and protect your sensitive information.
          </p>
          <div className="flex justify-center space-x-3">
            <button className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm">
              Contact Health Privacy Team
            </button>
            <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm">
              Report PHI Violation
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default HealthPrivacyModal;