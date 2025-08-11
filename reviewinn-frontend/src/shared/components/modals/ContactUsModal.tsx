import React from 'react';
import { Modal } from '../../design-system/components/Modal';
import { Phone, Mail, MapPin, Clock, MessageCircle, Users } from 'lucide-react';

interface ContactUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactUsModal: React.FC<ContactUsModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="auth"
      title="Contact Us"
      className="max-h-[90vh] overflow-y-auto"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            We'd love to hear from you! Get in touch with our team for any questions, feedback, or support needs.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
            <div className="flex items-center mb-3">
              <Phone className="h-5 w-5 text-blue-600 mr-2" />
              <h4 className="text-lg font-bold text-gray-900">Phone Support</h4>
            </div>
            <p className="text-gray-700 text-sm mb-2">
              Call us directly for immediate assistance
            </p>
            <a href="tel:+1-555-0123" className="text-blue-600 font-semibold hover:text-blue-800">
              +1 (555) 012-3456
            </a>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
            <div className="flex items-center mb-3">
              <Mail className="h-5 w-5 text-green-600 mr-2" />
              <h4 className="text-lg font-bold text-gray-900">Email Support</h4>
            </div>
            <p className="text-gray-700 text-sm mb-2">
              Send us a detailed message
            </p>
            <a href="mailto:support@reviewsite.com" className="text-green-600 font-semibold hover:text-green-800">
              support@reviewsite.com
            </a>
          </div>
        </div>

        {/* Office Information */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <MapPin className="h-6 w-6 text-purple-600 mr-3" />
            <h3 className="text-xl font-bold text-gray-900">Our Office</h3>
          </div>
          <div className="space-y-3 text-gray-700">
            <p>
              <strong>ReviewInn Headquarters</strong><br />
              123 Innovation Drive, Suite 500<br />
              San Francisco, CA 94105<br />
              United States
            </p>
          </div>
        </div>

        {/* Business Hours */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <Clock className="h-6 w-6 text-yellow-600 mr-3" />
            <h3 className="text-xl font-bold text-gray-900">Business Hours</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-gray-700">
            <div>
              <p className="font-semibold">Customer Support:</p>
              <ul className="text-sm space-y-1">
                <li>Monday - Friday: 9:00 AM - 8:00 PM PST</li>
                <li>Saturday: 10:00 AM - 6:00 PM PST</li>
                <li>Sunday: 12:00 PM - 6:00 PM PST</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">Technical Support:</p>
              <ul className="text-sm space-y-1">
                <li>24/7 Emergency Support</li>
                <li>Priority response for critical issues</li>
                <li>Community forum available anytime</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <MessageCircle className="h-6 w-6 text-indigo-600 mr-3" />
            <h3 className="text-xl font-bold text-gray-900">Send us a Message</h3>
          </div>
          <form className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your last name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option>General Inquiry</option>
                <option>Technical Support</option>
                <option>Account Issues</option>
                <option>Feature Request</option>
                <option>Bug Report</option>
                <option>Partnership</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Please describe your inquiry in detail..."
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors font-medium"
            >
              Send Message
            </button>
          </form>
        </div>

        {/* Social Media */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-gray-600 mr-3" />
            <h3 className="text-xl font-bold text-gray-900">Follow Us</h3>
          </div>
          <p className="text-gray-700 mb-4">Stay connected with our community</p>
          <div className="flex justify-center space-x-4">
            <a href="#" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Twitter
            </a>
            <a href="#" className="bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors">
              LinkedIn
            </a>
            <a href="#" className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ContactUsModal;