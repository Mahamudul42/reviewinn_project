import React, { useState } from 'react';
import { HelpCircle, Search, ChevronDown, ChevronUp, User, Star, Shield, MessageCircle } from 'lucide-react';

const HelpCenterPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          question: "How do I create an account?",
          answer: "To create an account, click the 'Sign Up' button in the top right corner of the page. You can register using your email address or sign up with your social media accounts. Follow the prompts to complete your profile setup."
        },
        {
          question: "Is ReviewInn free to use?",
          answer: "Yes, ReviewInn is completely free for users to read and write reviews. There are no hidden fees or subscription charges for basic features."
        },
        {
          question: "How do I write my first review?",
          answer: "After creating an account, search for the business or service you want to review. Click on their profile page and select 'Write a Review'. Fill in your rating, write your experience, and submit your review."
        }
      ]
    },
    {
      category: "Writing Reviews",
      questions: [
        {
          question: "What makes a good review?",
          answer: "A good review is honest, detailed, and helpful to other users. Include specific information about your experience, mention both positives and negatives, and focus on aspects that would be useful for future customers."
        },
        {
          question: "Can I edit or delete my review?",
          answer: "Yes, you can edit or delete your reviews at any time. Go to your profile page, find the review you want to modify, and click the edit or delete option. Note that edited reviews will show when they were last updated."
        },
        {
          question: "Are there any restrictions on what I can write?",
          answer: "Reviews must be based on genuine experiences and follow our content guidelines. We prohibit fake reviews, hate speech, personal attacks, and sharing private information. Reviews should be respectful and constructive."
        }
      ]
    },
    {
      category: "Account Management",
      questions: [
        {
          question: "How do I change my password?",
          answer: "Go to your account settings by clicking on your profile picture, then select 'Settings'. In the security section, you can change your password by entering your current password and setting a new one."
        },
        {
          question: "How do I delete my account?",
          answer: "To delete your account, go to Settings > Account > Delete Account. This action is permanent and cannot be undone. Your reviews may remain visible to maintain platform integrity, but will be anonymized."
        },
        {
          question: "Can I change my username?",
          answer: "Yes, you can change your username once every 30 days. Go to Settings > Profile and update your username. Note that your previous username may still appear in old reviews temporarily."
        }
      ]
    },
    {
      category: "Privacy & Safety",
      questions: [
        {
          question: "How is my personal information protected?",
          answer: "We take privacy seriously and use industry-standard security measures to protect your data. Your personal information is encrypted and never shared with third parties without your consent. See our Privacy Policy for details."
        },
        {
          question: "How do I report inappropriate content?",
          answer: "If you see content that violates our guidelines, click the 'Report' button next to the review or comment. You can also contact our moderation team directly through the Report Abuse page."
        },
        {
          question: "Can businesses contact me about my reviews?",
          answer: "Businesses cannot access your private contact information through our platform. If you want to be contacted about a review, you can choose to make your profile public or provide contact details in your review."
        }
      ]
    },
    {
      category: "Technical Issues",
      questions: [
        {
          question: "The website isn't working properly. What should I do?",
          answer: "First, try refreshing the page or clearing your browser cache. If the issue persists, try using a different browser or device. If you're still experiencing problems, contact our technical support team."
        },
        {
          question: "I'm having trouble uploading photos.",
          answer: "Make sure your photos are in JPG, PNG, or GIF format and are smaller than 5MB each. You can upload up to 5 photos per review. If you're still having trouble, try resizing your images or using a different browser."
        },
        {
          question: "Why can't I see my review after submitting it?",
          answer: "New reviews may take a few minutes to appear as they go through our automated screening process. If your review doesn't appear after 24 hours, it may have been flagged for manual review. Contact us if you need assistance."
        }
      ]
    }
  ];

  const quickLinks = [
    { icon: User, title: "Account Setup", description: "Learn how to create and manage your account", link: "#account" },
    { icon: Star, title: "Writing Reviews", description: "Tips for writing helpful and effective reviews", link: "#reviews" },
    { icon: Shield, title: "Safety & Privacy", description: "Understand our privacy and safety policies", link: "#safety" },
    { icon: MessageCircle, title: "Community Guidelines", description: "Learn about our community standards", link: "/content-guidelines" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <HelpCircle className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-lg text-gray-600">
            Find answers to common questions and get help with using ReviewInn
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {quickLinks.map((link, index) => (
            <a
              key={index}
              href={link.link}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <link.icon className="h-10 w-10 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{link.title}</h3>
              <p className="text-gray-600 text-sm">{link.description}</p>
            </a>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            {faqs.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b-2 border-blue-200 pb-2">
                  {category.category}
                </h3>
                
                <div className="space-y-3">
                  {category.questions.map((faq, faqIndex) => {
                    const globalIndex = categoryIndex * 10 + faqIndex;
                    return (
                      <div key={globalIndex} className="border border-gray-200 rounded-lg">
                        <button
                          onClick={() => toggleFAQ(globalIndex)}
                          className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-gray-900 font-medium">{faq.question}</span>
                          {openFAQ === globalIndex ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                        
                        {openFAQ === globalIndex && (
                          <div className="px-6 pb-4 border-t border-gray-100">
                            <p className="text-gray-800 pt-4">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-12 bg-blue-600 rounded-2xl shadow-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Still Need Help?</h2>
          <p className="text-blue-100 mb-6">
            Can't find what you're looking for? Our support team is here to help you with any questions or issues.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/contact" 
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Contact Support
            </a>
            <a 
              href="/feedback" 
              className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
            >
              Send Feedback
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterPage;