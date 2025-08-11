import React, { useState } from 'react';
import { Modal } from '../../design-system/components/Modal';
import { AlertTriangle, Shield, Flag, Eye, MessageSquare, User, FileText, Camera } from 'lucide-react';

interface ReportAbuseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReportAbuseModal: React.FC<ReportAbuseModalProps> = ({ isOpen, onClose }) => {
  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [attachments, setAttachments] = useState<File[]>([]);

  const reportTypes = [
    {
      id: 'spam',
      title: 'Spam or Fake Content',
      description: 'Fake reviews, promotional content, or spam',
      icon: <Flag className="h-5 w-5" />,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'from-orange-50 to-orange-100'
    },
    {
      id: 'harassment',
      title: 'Harassment or Bullying',
      description: 'Targeted harassment, bullying, or threats',
      icon: <Shield className="h-5 w-5" />,
      color: 'from-red-500 to-red-600',
      bgColor: 'from-red-50 to-red-100'
    },
    {
      id: 'inappropriate',
      title: 'Inappropriate Content',
      description: 'Adult content, violence, or disturbing material',
      icon: <Eye className="h-5 w-5" />,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100'
    },
    {
      id: 'hate-speech',
      title: 'Hate Speech',
      description: 'Content that promotes hatred or discrimination',
      icon: <MessageSquare className="h-5 w-5" />,
      color: 'from-red-600 to-red-700',
      bgColor: 'from-red-50 to-red-100'
    },
    {
      id: 'impersonation',
      title: 'Impersonation',
      description: 'Pretending to be someone else or a business',
      icon: <User className="h-5 w-5" />,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100'
    },
    {
      id: 'copyright',
      title: 'Copyright Violation',
      description: 'Unauthorized use of copyrighted material',
      icon: <FileText className="h-5 w-5" />,
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-50 to-green-100'
    }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Report submitted:', {
      reportType,
      description,
      severity,
      attachments
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="auth"
      title="Report Abuse"
      className="max-h-[90vh] overflow-y-auto"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-3" />
          <p className="text-lg text-gray-700 font-medium">
            Help us maintain a safe and respectful community
          </p>
          <p className="text-gray-600 text-sm mt-2">
            All reports are reviewed by our moderation team within 24 hours
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Report Type Selection */}
          <div>
            <label className="block text-lg font-bold text-gray-900 mb-4">
              What type of issue are you reporting?
            </label>
            <div className="grid md:grid-cols-2 gap-3">
              {reportTypes.map((type) => (
                <div
                  key={type.id}
                  className={`cursor-pointer rounded-xl p-4 border-2 transition-all duration-300 ${
                    reportType === type.id
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setReportType(type.id)}
                >
                  <div className="flex items-center mb-2">
                    <div className={`w-8 h-8 bg-gradient-to-r ${type.color} rounded-lg flex items-center justify-center text-white mr-3`}>
                      {type.icon}
                    </div>
                    <h4 className="font-bold text-gray-900">{type.title}</h4>
                  </div>
                  <p className="text-gray-600 text-sm">{type.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Severity Level */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4">
            <label className="block text-lg font-bold text-gray-900 mb-3">
              How urgent is this issue?
            </label>
            <div className="space-y-2">
              {[
                { value: 'low', label: 'Low Priority', desc: 'Minor issue, not immediately harmful' },
                { value: 'medium', label: 'Medium Priority', desc: 'Moderately concerning, needs attention' },
                { value: 'high', label: 'High Priority', desc: 'Serious issue requiring immediate action' }
              ].map((option) => (
                <label key={option.value} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="severity"
                    value={option.value}
                    checked={severity === option.value}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="mr-3 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">{option.label}</span>
                    <p className="text-gray-600 text-sm">{option.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-lg font-bold text-gray-900 mb-3">
              Please provide details about the issue
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Describe the issue in detail. Include specific examples, dates, and any other relevant information that will help our team investigate."
            />
            <p className="text-gray-500 text-sm mt-2">
              Minimum 50 characters required. Be specific and factual.
            </p>
          </div>

          {/* File Attachments */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
            <label className="block text-lg font-bold text-gray-900 mb-3 flex items-center">
              <Camera className="h-5 w-5 mr-2" />
              Attach Evidence (Optional)
            </label>
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-gray-600 text-sm mt-2">
              Upload screenshots, documents, or other evidence. Max 5 files, 10MB each.
            </p>
            
            {/* Display uploaded files */}
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-2 rounded-lg">
                    <span className="text-sm text-gray-700 truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
            <h4 className="font-bold text-gray-900 mb-3">Contact Information (Optional)</h4>
            <p className="text-gray-600 text-sm mb-3">
              Provide your contact details if you'd like updates on this report.
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              <input
                type="email"
                placeholder="Your email address"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="tel"
                placeholder="Phone number (optional)"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
            <h4 className="font-bold text-gray-900 mb-2 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
              Important Notice
            </h4>
            <ul className="text-gray-700 text-sm space-y-1">
              <li>• False reports may result in account restrictions</li>
              <li>• We investigate all reports thoroughly and fairly</li>
              <li>• Anonymous reports are accepted but may limit our ability to follow up</li>
              <li>• For urgent safety concerns, contact local authorities immediately</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reportType || description.length < 50}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ReportAbuseModal;