import React, { useState } from 'react';
import { Modal } from '../../design-system/components/Modal';
import { HelpCircle, Book, Video, MessageSquare, Search, ChevronRight, Star, Users, Shield } from 'lucide-react';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpCenterModal: React.FC<HelpCenterModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const helpCategories = [
    {
      title: 'Getting Started',
      icon: <Star className="h-5 w-5" />,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100',
      articles: [
        'How to create your first review',
        'Setting up your profile',
        'Understanding review guidelines',
        'Navigating the platform'
      ]
    },
    {
      title: 'Account Management',
      icon: <Users className="h-5 w-5" />,
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-50 to-green-100',
      articles: [
        'Updating your profile information',
        'Managing privacy settings',
        'Changing your password',
        'Deactivating your account'
      ]
    },
    {
      title: 'Review Guidelines',
      icon: <Shield className="h-5 w-5" />,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100',
      articles: [
        'Community standards',
        'What makes a good review',
        'Avoiding fake reviews',
        'Content moderation policies'
      ]
    }
  ];

  const quickActions = [
    {
      title: 'Video Tutorials',
      description: 'Watch step-by-step guides',
      icon: <Video className="h-5 w-5" />,
      color: 'from-red-500 to-red-600',
      bgColor: 'from-red-50 to-red-100'
    },
    {
      title: 'Community Forum',
      description: 'Connect with other users',
      icon: <MessageSquare className="h-5 w-5" />,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'from-indigo-50 to-indigo-100'
    },
    {
      title: 'Knowledge Base',
      description: 'Browse all articles',
      icon: <Book className="h-5 w-5" />,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'from-orange-50 to-orange-100'
    }
  ];

  const faqItems = [
    {
      question: 'How do I write my first review?',
      answer: 'Click on "Write Review" from the homepage, search for the entity you want to review, fill out the review form with your honest experience, and submit it for review.'
    },
    {
      question: 'Can I edit my review after posting?',
      answer: 'Yes, you can edit your reviews within 24 hours of posting. After that, contact our support team for assistance with major changes.'
    },
    {
      question: 'How are reviews moderated?',
      answer: 'All reviews go through automated and manual moderation to ensure they meet our community guidelines and are genuine user experiences.'
    },
    {
      question: 'What should I do if I see inappropriate content?',
      answer: 'Use the "Report" button on any content that violates our guidelines. Our moderation team will review it promptly.'
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="auth"
      title="Help Center"
      className="max-h-[90vh] overflow-y-auto"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Find answers to your questions and learn how to make the most of ReviewInn.
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help articles, guides, or FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <div key={index} className={`bg-gradient-to-br ${action.bgColor} rounded-xl p-4 cursor-pointer hover:shadow-md transition-all duration-300 group`}>
              <div className={`w-10 h-10 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform duration-300`}>
                {action.icon}
              </div>
              <h4 className="font-bold text-gray-900 mb-1">{action.title}</h4>
              <p className="text-gray-600 text-sm">{action.description}</p>
            </div>
          ))}
        </div>

        {/* Help Categories */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <HelpCircle className="h-6 w-6 mr-2 text-blue-600" />
            Browse by Category
          </h3>
          
          {helpCategories.map((category, index) => (
            <div key={index} className={`bg-gradient-to-br ${category.bgColor} rounded-xl p-5`}>
              <div className="flex items-center mb-4">
                <div className={`w-8 h-8 bg-gradient-to-r ${category.color} rounded-lg flex items-center justify-center text-white mr-3`}>
                  {category.icon}
                </div>
                <h4 className="text-lg font-bold text-gray-900">{category.title}</h4>
              </div>
              <div className="space-y-2">
                {category.articles.map((article, articleIndex) => (
                  <div key={articleIndex} className="flex items-center justify-between p-2 bg-white bg-opacity-50 rounded-lg hover:bg-opacity-70 cursor-pointer transition-all duration-200 group">
                    <span className="text-gray-700 text-sm group-hover:text-gray-900">{article}</span>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Frequently Asked Questions */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <MessageSquare className="h-6 w-6 mr-2 text-yellow-600" />
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            {faqItems.map((faq, index) => (
              <div key={index} className="bg-white bg-opacity-70 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-2">{faq.question}</h5>
                <p className="text-gray-700 text-sm">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Still Need Help?</h3>
          <p className="text-gray-700 mb-4">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <div className="flex justify-center space-x-3">
            <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
              Contact Support
            </button>
            <button className="bg-white text-indigo-600 border border-indigo-600 px-6 py-2 rounded-lg hover:bg-indigo-50 transition-colors font-medium">
              Submit Ticket
            </button>
          </div>
        </div>

        {/* Popular Articles */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Star className="h-6 w-6 mr-2 text-green-600" />
            Most Popular Articles
          </h3>
          <div className="space-y-3">
            {[
              'How to write effective reviews',
              'Understanding our rating system',
              'Managing your notifications',
              'Privacy and security settings',
              'Reporting inappropriate content'
            ].map((article, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white bg-opacity-70 rounded-lg hover:bg-opacity-90 cursor-pointer transition-all duration-200 group">
                <span className="text-gray-700 font-medium group-hover:text-gray-900">{article}</span>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default HelpCenterModal;