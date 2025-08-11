import React, { useState } from 'react';
import { MessageCircle, Lightbulb, ThumbsUp, Bug, Send, Star } from 'lucide-react';

const FeedbackPage: React.FC = () => {
  const [feedbackData, setFeedbackData] = useState({
    type: '',
    category: '',
    title: '',
    description: '',
    rating: 0,
    name: '',
    email: '',
    allowContact: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFeedbackData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRatingChange = (rating: number) => {
    setFeedbackData(prev => ({ ...prev, rating }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Feedback submitted:', feedbackData);
    alert('Thank you for your feedback! We appreciate your input and will use it to improve our platform.');
    setFeedbackData({
      type: '',
      category: '',
      title: '',
      description: '',
      rating: 0,
      name: '',
      email: '',
      allowContact: false
    });
  };

  const feedbackTypes = [
    { value: 'suggestion', label: 'Suggestion', icon: Lightbulb, color: 'text-yellow-600' },
    { value: 'compliment', label: 'Compliment', icon: ThumbsUp, color: 'text-green-600' },
    { value: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-600' },
    { value: 'feature', label: 'Feature Request', icon: Star, color: 'text-purple-600' }
  ];

  const categories = [
    'User Interface',
    'Search Functionality',
    'Review System',
    'Account Management',
    'Performance',
    'Mobile Experience',
    'Accessibility',
    'Content Quality',
    'Community Features',
    'Other'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <MessageCircle className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Feedback</h1>
          <p className="text-lg text-gray-600">
            Help us improve ReviewInn by sharing your thoughts, suggestions, and experiences with our platform.
          </p>
        </div>

        {/* Feedback Types */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {feedbackTypes.map(type => (
            <button
              key={type.value}
              onClick={() => setFeedbackData(prev => ({ ...prev, type: type.value }))}
              className={`p-6 rounded-xl border-2 transition-all ${
                feedbackData.type === type.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <type.icon className={`h-8 w-8 ${type.color} mx-auto mb-3`} />
              <h3 className="font-semibold text-gray-900">{type.label}</h3>
            </button>
          ))}
        </div>

        {/* Feedback Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Share Your Feedback</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Selection */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Feedback Type *
              </label>
              <select
                id="type"
                name="type"
                value={feedbackData.type}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select feedback type</option>
                {feedbackTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={feedbackData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Overall Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Rating of ReviewInn
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingChange(star)}
                    className={`text-2xl ${
                      star <= feedbackData.rating ? 'text-yellow-400' : 'text-gray-300'
                    } hover:text-yellow-400 transition-colors`}
                  >
                    ★
                  </button>
                ))}
                <span className="text-sm text-gray-500 ml-2">
                  {feedbackData.rating > 0 ? `${feedbackData.rating} out of 5 stars` : 'No rating selected'}
                </span>
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={feedbackData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief summary of your feedback"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                rows={6}
                value={feedbackData.description}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Please provide detailed feedback. Include specific examples, steps to reproduce issues, or suggestions for improvement..."
              ></textarea>
            </div>

            {/* Contact Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={feedbackData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your name"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={feedbackData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Contact Permission */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowContact"
                name="allowContact"
                checked={feedbackData.allowContact}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="allowContact" className="ml-2 text-sm text-gray-700">
                I consent to be contacted about this feedback for follow-up questions or updates
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Send className="h-5 w-5 mr-2" />
              Submit Feedback
            </button>
          </form>
        </div>

        {/* Feedback Guidelines */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Feedback Guidelines</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">What makes good feedback:</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Specific and detailed descriptions</li>
                <li>• Clear steps to reproduce issues</li>
                <li>• Constructive suggestions for improvement</li>
                <li>• Context about your user experience</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">What we do with feedback:</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Review all feedback within 3 business days</li>
                <li>• Prioritize feedback based on impact</li>
                <li>• Incorporate suggestions into development</li>
                <li>• Follow up when additional info is needed</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Thank You Message */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
          <ThumbsUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-900 mb-2">Thank You for Your Feedback!</h3>
          <p className="text-green-700">
            Your input helps us build a better platform for everyone. We read every piece of feedback and use it to guide our improvements.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;