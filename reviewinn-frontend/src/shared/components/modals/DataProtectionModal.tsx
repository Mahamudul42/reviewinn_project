import React from 'react';
import { Modal } from '../../design-system/components/Modal';
import { Shield, Lock, Database, UserCheck, Globe, AlertTriangle } from 'lucide-react';

interface DataProtectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DataProtectionModal: React.FC<DataProtectionModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="auth"
      title="Data Protection Policy"
      className="max-h-[90vh] overflow-y-auto"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4">
          <Shield className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
          <p className="text-lg text-gray-700 font-medium">
            GDPR & Global Data Compliance
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Comprehensive data protection in accordance with international standards.
          </p>
        </div>

        {/* GDPR Compliance */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <Globe className="h-5 w-5 text-blue-600 mr-2" />
            GDPR Compliance
          </h3>
          <p className="text-gray-700 text-sm mb-3">
            ReviewInn complies with the General Data Protection Regulation (GDPR) and other international data protection laws to ensure your personal data is handled with the highest standards of security and privacy.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-800 mb-1">Legal Basis</h4>
              <p className="text-gray-700 text-xs">We process data based on consent, legitimate interests, and legal obligations.</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-800 mb-1">Data Minimization</h4>
              <p className="text-gray-700 text-xs">We collect only the data necessary for our services.</p>
            </div>
          </div>
        </div>

        {/* Your Rights */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <UserCheck className="h-5 w-5 text-purple-600 mr-2" />
            Your Data Protection Rights
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="bg-white p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">Right to Access</h4>
                <p className="text-gray-700 text-xs">Request a copy of your personal data we hold.</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">Right to Rectification</h4>
                <p className="text-gray-700 text-xs">Correct inaccurate or incomplete data.</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">Right to Erasure</h4>
                <p className="text-gray-700 text-xs">Request deletion of your personal data.</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="bg-white p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">Right to Portability</h4>
                <p className="text-gray-700 text-xs">Receive your data in a structured format.</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">Right to Object</h4>
                <p className="text-gray-700 text-xs">Object to processing based on legitimate interests.</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">Right to Restrict</h4>
                <p className="text-gray-700 text-xs">Limit how we process your data.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Measures */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <Lock className="h-5 w-5 text-red-600 mr-2" />
            Security Measures
          </h3>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-lg text-center">
              <h4 className="text-sm font-semibold text-gray-800">Encryption</h4>
              <p className="text-gray-700 text-xs">End-to-end encryption for data in transit and at rest</p>
            </div>
            <div className="bg-white p-3 rounded-lg text-center">
              <h4 className="text-sm font-semibold text-gray-800">Access Controls</h4>
              <p className="text-gray-700 text-xs">Strict access controls and authentication</p>
            </div>
            <div className="bg-white p-3 rounded-lg text-center">
              <h4 className="text-sm font-semibold text-gray-800">Regular Audits</h4>
              <p className="text-gray-700 text-xs">Continuous security monitoring and audits</p>
            </div>
            <div className="bg-white p-3 rounded-lg text-center">
              <h4 className="text-sm font-semibold text-gray-800">Data Backups</h4>
              <p className="text-gray-700 text-xs">Secure, encrypted backup systems</p>
            </div>
            <div className="bg-white p-3 rounded-lg text-center">
              <h4 className="text-sm font-semibold text-gray-800">Staff Training</h4>
              <p className="text-gray-700 text-xs">Regular data protection training for all staff</p>
            </div>
            <div className="bg-white p-3 rounded-lg text-center">
              <h4 className="text-sm font-semibold text-gray-800">Incident Response</h4>
              <p className="text-gray-700 text-xs">Rapid response to security incidents</p>
            </div>
          </div>
        </div>

        {/* Data Processing */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <Database className="h-5 w-5 text-yellow-600 mr-2" />
            Data Processing Information
          </h3>
          <div className="space-y-3">
            <div className="bg-white p-3 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Data Controller</h4>
              <p className="text-gray-700 text-xs">ReviewInn Ltd. acts as the data controller for personal data processing.</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Processing Purposes</h4>
              <ul className="list-disc list-inside text-gray-700 text-xs space-y-1">
                <li>Service provision and account management</li>
                <li>Communication and customer support</li>
                <li>Platform improvement and analytics</li>
                <li>Legal compliance and fraud prevention</li>
              </ul>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Retention Periods</h4>
              <p className="text-gray-700 text-xs">We retain personal data only as long as necessary for the purposes outlined in our privacy policy, typically no longer than 7 years after account closure.</p>
            </div>
          </div>
        </div>

        {/* International Transfers */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3">International Data Transfers</h3>
          <p className="text-gray-700 text-sm mb-3">
            When we transfer data internationally, we ensure appropriate safeguards are in place:
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-800 mb-1">Adequacy Decisions</h4>
              <p className="text-gray-700 text-xs">Transfers to countries with adequate protection</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-800 mb-1">Standard Contractual Clauses</h4>
              <p className="text-gray-700 text-xs">EU-approved contractual protections</p>
            </div>
          </div>
        </div>

        {/* Data Breach Response */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            Data Breach Response
          </h3>
          <p className="text-gray-700 text-sm mb-3">
            In the unlikely event of a data breach affecting your personal data:
          </p>
          <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
            <li>We will notify relevant authorities within 72 hours</li>
            <li>Affected users will be informed without undue delay</li>
            <li>We will provide clear information about the breach</li>
            <li>Immediate steps will be taken to contain and resolve the issue</li>
            <li>We will assist you in taking protective measures</li>
          </ul>
        </div>

        {/* Contact DPO */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 text-center">
          <h4 className="text-md font-bold text-gray-900 mb-3">Data Protection Officer</h4>
          <p className="text-gray-700 text-sm mb-4">
            For questions about data protection or to exercise your rights, contact our Data Protection Officer.
          </p>
          <div className="flex justify-center space-x-3">
            <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm">
              Contact DPO
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
              Exercise Rights
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DataProtectionModal;