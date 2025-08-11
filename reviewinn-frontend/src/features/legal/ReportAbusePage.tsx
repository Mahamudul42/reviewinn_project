import React, { useState } from 'react';
import { AlertTriangle, Shield, Flag, Send, Eye, MessageCircle } from 'lucide-react';

const ReportAbusePage: React.FC = () => {
  const [reportData, setReportData] = useState({
    reportType: '',
    contentUrl: '',
    description: '',
    reporterEmail: '',
    reporterName: '',
    urgency: 'medium'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setReportData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Report submitted:', reportData);
    alert('Thank you for your report. We will investigate this matter within 24 hours.');
    setReportData({
      reportType: '',
      contentUrl: '',
      description: '',
      reporterEmail: '',
      reporterName: '',
      urgency: 'medium'
    });
  };

  const reportTypes = [
    { value: 'fake-review', label: 'Fake or Misleading Review' },
    { value: 'spam', label: 'Spam Content' },
    { value: 'harassment', label: 'Harassment or Bullying' },
    { value: 'hate-speech', label: 'Hate Speech' },
    { value: 'personal-info', label: 'Sharing Personal Information' },
    { value: 'inappropriate-content', label: 'Inappropriate Content' },
    { value: 'copyright', label: 'Copyright Violation' },
    { value: 'impersonation', label: 'Impersonation' },
    { value: 'threats', label: 'Threats or Violence' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Report Abuse</h1>
          <p className="text-lg text-gray-600">
            Help us maintain a safe and respectful community by reporting inappropriate content or behavior.
          </p>
        </div>

        {/* Important Notice */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
          <div className="flex items-start">
            <Shield className="h-6 w-6 text-red-600 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Important Information</h3>
              <ul className="text-red-700 space-y-1">
                <li>• All reports are reviewed by our moderation team</li>
                <li>• False reports may result in account restrictions</li>
                <li>• For urgent safety concerns, contact local authorities</li>
                <li>• We'll investigate reports within 24 hours</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Report Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Flag className="h-6 w-6 text-red-600 mr-2" />
                Submit a Report
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-2">
                    Type of Report *
                  </label>
                  <select
                    id="reportType"
                    name="reportType"
                    value={reportData.reportType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Select a report type</option>
                    {reportTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-2">
                    Urgency Level
                  </label>
                  <select
                    id="urgency"
                    name="urgency"
                    value={reportData.urgency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="low">Low - General policy violation</option>
                    <option value="medium">Medium - Inappropriate content</option>
                    <option value="high">High - Harassment or threats</option>
                    <option value="urgent">Urgent - Immediate safety concern</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="contentUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Content URL or Location
                  </label>
                  <input
                    type="url"
                    id="contentUrl"
                    name="contentUrl"
                    value={reportData.contentUrl}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="https://reviewsite.com/..."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Copy and paste the URL of the content you're reporting (if applicable)
                  </p>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={6}
                    value={reportData.description}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Please provide detailed information about the violation, including specific examples and why you believe it violates our guidelines..."
                  ></textarea>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="reporterName" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name (Optional)
                    </label>
                    <input
                      type="text"
                      id="reporterName"
                      name="reporterName"
                      value={reportData.reporterName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Your name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="reporterEmail" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Email (Optional)
                    </label>
                    <input
                      type="email"
                      id="reporterEmail"
                      name="reporterEmail"
                      value={reportData.reporterEmail}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="your@email.com"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      We'll contact you only if we need additional information
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Anonymous Reporting</h3>
                  <p className="text-sm text-gray-600">
                    You can submit reports anonymously by leaving the name and email fields empty. 
                    However, providing contact information helps us investigate more effectively.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center"
                >
                  <Send className="h-5 w-5 mr-2" />
                  Submit Report
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* What Happens Next */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Eye className="h-5 w-5 text-blue-600 mr-2" />
                What Happens Next
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 mr-3 mt-1">1</div>
                  <div>
                    <h4 className="font-medium text-gray-900">Review</h4>
                    <p className="text-sm text-gray-600">Our team reviews your report within 24 hours</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 mr-3 mt-1">2</div>
                  <div>
                    <h4 className="font-medium text-gray-900">Investigation</h4>
                    <p className="text-sm text-gray-600">We investigate the reported content thoroughly</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 mr-3 mt-1">3</div>
                  <div>
                    <h4 className="font-medium text-gray-900">Action</h4>
                    <p className="text-sm text-gray-600">We take appropriate action if violations are found</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 mr-3 mt-1">4</div>
                  <div>
                    <h4 className="font-medium text-gray-900">Follow-up</h4>
                    <p className="text-sm text-gray-600">We may contact you for additional information</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Common Violations */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MessageCircle className="h-5 w-5 text-orange-600 mr-2" />
                Common Violations
              </h3>
              
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">Fake Reviews</div>
                  <div className="text-gray-600">Reviews not based on genuine experiences</div>
                </div>
                
                <div className="text-sm">
                  <div className="font-medium text-gray-900">Spam Content</div>
                  <div className="text-gray-600">Repetitive or irrelevant content</div>
                </div>
                
                <div className="text-sm">
                  <div className="font-medium text-gray-900">Personal Attacks</div>
                  <div className="text-gray-600">Targeting individuals with harassment</div>
                </div>
                
                <div className="text-sm">
                  <div className="font-medium text-gray-900">Privacy Violations</div>
                  <div className="text-gray-600">Sharing personal information without consent</div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Emergency Situations</h3>
              <p className="text-sm text-red-700 mb-4">
                For immediate safety concerns, threats of violence, or emergencies, contact local authorities first.
              </p>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium text-red-800">Emergency:</span>
                  <span className="text-red-700"> 911 (US)</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-red-800">Crisis Support:</span>
                  <span className="text-red-700"> 988 (US)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportAbusePage;