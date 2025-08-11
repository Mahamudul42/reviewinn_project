import React from 'react';
import { Users, Shield, Target, Heart, Star, Globe } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About ReviewInn</h1>
          <p className="text-xl text-gray-800 max-w-2xl mx-auto">
            Your trusted platform for authentic reviews and informed decisions. We connect people with genuine experiences to help build a more transparent marketplace.
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <Target className="h-8 w-8 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
          </div>
          <p className="text-gray-800 text-lg leading-relaxed">
            At ReviewInn, we believe in the power of authentic experiences. Our mission is to create a platform where genuine reviews help people make better decisions while fostering trust and transparency in the digital marketplace. We empower consumers to share their honest opinions and help businesses improve through constructive feedback.
          </p>
        </div>

        {/* Values Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-green-600 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Trust & Authenticity</h3>
            </div>
            <p className="text-gray-800">
              We prioritize genuine reviews and maintain strict policies to prevent fake or misleading content. Our verification systems ensure authentic user experiences.
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Users className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Community First</h3>
            </div>
            <p className="text-gray-800">
              Our platform thrives on community contributions. We respect user privacy while fostering an environment where honest feedback is valued and protected.
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Star className="h-6 w-6 text-yellow-600 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Quality Standards</h3>
            </div>
            <p className="text-gray-800">
              We maintain high standards for review quality and content moderation to ensure our platform remains a reliable resource for decision-making.
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Globe className="h-6 w-6 text-purple-600 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Global Impact</h3>
            </div>
            <p className="text-gray-800">
              We're building a global platform that transcends boundaries, helping people worldwide make informed choices based on real experiences.
            </p>
          </div>
        </div>

        {/* Company Info */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <Heart className="h-8 w-8 text-red-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Our Story</h2>
          </div>
          <div className="prose max-w-none text-gray-800">
            <p className="mb-4">
              Founded in 2024, ReviewInn emerged from a simple belief: everyone deserves access to honest, unbiased reviews when making important decisions. We recognized that traditional review platforms often struggled with authenticity and user trust.
            </p>
            <p className="mb-4">
              Our team of dedicated professionals combines expertise in technology, consumer protection, and community management to create a platform that truly serves its users. We're committed to continuous improvement and innovation while maintaining the highest ethical standards.
            </p>
            <p>
              Today, ReviewInn serves thousands of users worldwide, facilitating millions of authentic reviews across countless categories. We're proud to be a trusted resource for consumers and a valuable feedback channel for businesses.
            </p>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl shadow-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Get In Touch</h2>
          <p className="text-blue-100 mb-6">
            Have questions about our platform or want to learn more about our mission? We'd love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:contact@reviewsite.com" 
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Contact Us
            </a>
            <a 
              href="/help" 
              className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
            >
              Help Center
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;