import React from 'react';
import { Modal } from '../../design-system/components/Modal';
import { Users, Shield, Target, Heart, Star, Globe } from 'lucide-react';

interface AboutUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutUsModal: React.FC<AboutUsModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="auth"
      title="About ReviewInn"
      className="max-h-[90vh] overflow-y-auto"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Your trusted platform for authentic reviews and informed decisions. We connect people with genuine experiences to help build a more transparent marketplace.
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <Target className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-xl font-bold text-gray-900">Our Mission</h3>
          </div>
          <p className="text-gray-700 leading-relaxed">
            At ReviewInn, we believe in the power of authentic experiences. Our mission is to create a platform where genuine reviews help people make better decisions while fostering trust and transparency in the digital marketplace. We empower consumers to share their honest opinions and help businesses improve through constructive feedback.
          </p>
        </div>

        {/* Values Section */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
            <div className="flex items-center mb-3">
              <Shield className="h-5 w-5 text-green-600 mr-2" />
              <h4 className="text-lg font-bold text-gray-900">Trust & Authenticity</h4>
            </div>
            <p className="text-gray-700 text-sm">
              We prioritize genuine reviews and maintain strict policies to prevent fake or misleading content. Our verification systems ensure authentic user experiences.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
            <div className="flex items-center mb-3">
              <Users className="h-5 w-5 text-blue-600 mr-2" />
              <h4 className="text-lg font-bold text-gray-900">Community First</h4>
            </div>
            <p className="text-gray-700 text-sm">
              Our platform thrives on community contributions. We respect user privacy while fostering an environment where honest feedback is valued and protected.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4">
            <div className="flex items-center mb-3">
              <Star className="h-5 w-5 text-yellow-600 mr-2" />
              <h4 className="text-lg font-bold text-gray-900">Quality Standards</h4>
            </div>
            <p className="text-gray-700 text-sm">
              We maintain high standards for review quality and content moderation to ensure our platform remains a reliable resource for decision-making.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
            <div className="flex items-center mb-3">
              <Globe className="h-5 w-5 text-purple-600 mr-2" />
              <h4 className="text-lg font-bold text-gray-900">Global Impact</h4>
            </div>
            <p className="text-gray-700 text-sm">
              We're building a global platform that transcends boundaries, helping people worldwide make informed choices based on real experiences.
            </p>
          </div>
        </div>

        {/* Company Story */}
        <div className="bg-gradient-to-br from-red-50 to-pink-100 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <Heart className="h-6 w-6 text-red-600 mr-3" />
            <h3 className="text-xl font-bold text-gray-900">Our Story</h3>
          </div>
          <div className="space-y-3 text-gray-700">
            <p>
              Founded in 2024, ReviewInn emerged from a simple belief: everyone deserves access to honest, unbiased reviews when making important decisions. We recognized that traditional review platforms often struggled with authenticity and user trust.
            </p>
            <p>
              Our team consists of passionate developers, designers, and community managers who are committed to creating a platform that truly serves its users. We leverage cutting-edge technology while maintaining the human touch that makes authentic reviews possible.
            </p>
            <p>
              Today, we're proud to serve a growing community of reviewers and consumers who rely on our platform for genuine insights and transparent feedback.
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Get In Touch</h3>
          <p className="text-gray-700 mb-4">
            Have questions or want to learn more about our mission? We'd love to hear from you.
          </p>
          <div className="flex justify-center space-x-4">
            <a href="/contact" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Contact Us
            </a>
            <a href="/help" className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
              Help Center
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AboutUsModal;