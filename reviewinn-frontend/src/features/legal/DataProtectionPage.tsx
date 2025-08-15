import React from 'react';
import { Shield, Database, Lock, Key, Eye, AlertCircle } from 'lucide-react';
import LegalPageLayout from './components/LegalPageLayout';

const DataProtectionPage: React.FC = () => {
  const lastUpdated = "January 11, 2025";
  
  return (
    <LegalPageLayout
      title="Data Protection"
      lastUpdated={lastUpdated}
      icon={Shield}
    >
      <div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Database className="h-6 w-6 text-green-600 mr-2" />
              Our Data Protection Commitment
            </h2>
            <p className="text-gray-800 mb-6">
              At ReviewInn, we are committed to protecting your personal data and respecting your privacy rights. This page outlines our comprehensive approach to data protection, including technical, organizational, and legal measures we implement to safeguard your information.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Lock className="h-6 w-6 text-blue-600 mr-2" />
              Technical Safeguards
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Encryption</h3>
            <ul className="list-disc list-inside text-gray-800 mb-4 space-y-2">
              <li>End-to-end encryption for data transmission (TLS 1.3)</li>
              <li>Database encryption at rest using AES-256</li>
              <li>Encrypted backups and secure storage</li>
              <li>Password hashing using industry-standard algorithms</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Access Controls</h3>
            <ul className="list-disc list-inside text-gray-800 mb-4 space-y-2">
              <li>Multi-factor authentication for all accounts</li>
              <li>Role-based access control (RBAC)</li>
              <li>Regular access reviews and privilege audits</li>
              <li>Automatic session timeout and logout</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Infrastructure Security</h3>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li>Cloud infrastructure with SOC 2 Type II compliance</li>
              <li>Regular security patches and updates</li>
              <li>Firewall protection and intrusion detection</li>
              <li>Distributed denial-of-service (DDoS) protection</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Key className="h-6 w-6 text-purple-600 mr-2" />
              Organizational Measures
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Staff Training</h3>
            <ul className="list-disc list-inside text-gray-800 mb-4 space-y-2">
              <li>Regular privacy and security training for all employees</li>
              <li>Data handling best practices and procedures</li>
              <li>Incident response training and drills</li>
              <li>Confidentiality agreements and security policies</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Data Governance</h3>
            <ul className="list-disc list-inside text-gray-800 mb-4 space-y-2">
              <li>Data Protection Officer (DPO) oversight</li>
              <li>Privacy by design and by default principles</li>
              <li>Data minimization and purpose limitation</li>
              <li>Regular privacy impact assessments</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Third-Party Management</h3>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li>Due diligence on all data processing partners</li>
              <li>Data processing agreements with strict requirements</li>
              <li>Regular audits of third-party security practices</li>
              <li>Vendor risk assessments and monitoring</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Eye className="h-6 w-6 text-indigo-600 mr-2" />
              Compliance Framework
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Regulatory Compliance</h3>
            <ul className="list-disc list-inside text-gray-800 mb-4 space-y-2">
              <li>GDPR (General Data Protection Regulation) compliance</li>
              <li>CCPA (California Consumer Privacy Act) adherence</li>
              <li>COPPA (Children's Online Privacy Protection Act) compliance</li>
              <li>Industry-specific regulations where applicable</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Data Subject Rights</h3>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li>Right to access your personal data</li>
              <li>Right to rectification of inaccurate data</li>
              <li>Right to erasure ("right to be forgotten")</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
              <li>Right to restrict processing</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Retention Periods</h3>
              <ul className="list-disc list-inside text-blue-700 space-y-1">
                <li><strong>Account Data:</strong> Retained while account is active + 30 days</li>
                <li><strong>Review Data:</strong> Retained for 7 years for platform integrity</li>
                <li><strong>Analytics Data:</strong> Anonymized after 26 months</li>
                <li><strong>Log Data:</strong> Retained for 12 months for security purposes</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Breach Response</h2>
            <p className="text-gray-800 mb-4">
              In the unlikely event of a data breach, we have established procedures to:
            </p>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li>Detect and contain the breach within 24 hours</li>
              <li>Assess the scope and impact of the incident</li>
              <li>Notify relevant authorities within 72 hours (if required)</li>
              <li>Inform affected users without undue delay</li>
              <li>Implement remediation measures and prevent recurrence</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">International Transfers</h2>
            <p className="text-gray-800 mb-4">
              When we transfer data internationally, we ensure adequate protection through:
            </p>
            <ul className="list-disc list-inside text-gray-800 mb-6 space-y-2">
              <li>Adequacy decisions by relevant authorities</li>
              <li>Standard contractual clauses (SCCs)</li>
              <li>Binding corporate rules (BCRs)</li>
              <li>Certification schemes and codes of conduct</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Our Data Protection Team</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <p className="text-gray-800 mb-2">
                For any data protection concerns or to exercise your rights:
              </p>
              <ul className="list-disc list-inside text-gray-800 space-y-1">
                <li><strong>Email:</strong> dpo@reviewsite.com</li>
                <li><strong>Response Time:</strong> Within 30 days</li>
                <li><strong>Escalation:</strong> Contact your local data protection authority</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-green-600 rounded-2xl shadow-lg p-8 text-white text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Data Protection Questions?</h2>
          <p className="text-green-100 mb-6">
            Our Data Protection Officer is available to answer your questions and help you understand your rights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:dpo@reviewsite.com" 
              className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
            >
              Contact DPO
            </a>
            <a 
              href="/privacy-policy" 
              className="bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </LegalPageLayout>
  );
};

export default DataProtectionPage;