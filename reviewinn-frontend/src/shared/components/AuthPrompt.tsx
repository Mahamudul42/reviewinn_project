import React from 'react';
import { LogIn, Lock, Shield, Star } from 'lucide-react';

interface AuthPromptProps {
  title: string;
  description: string;
  feature: string;
  onSignIn: () => void;
  className?: string;
}

const AuthPrompt: React.FC<AuthPromptProps> = ({ 
  title, 
  description, 
  feature, 
  onSignIn, 
  className = '' 
}) => {
  const getFeatureIcon = () => {
    switch (feature) {
      case 'notifications':
        return <Shield className="w-12 h-12 text-blue-500" />;
      case 'messages':
        return <Star className="w-12 h-12 text-green-500" />;
      case 'dashboard':
        return <Lock className="w-12 h-12 text-purple-500" />;
      default:
        return <LogIn className="w-12 h-12 text-blue-500" />;
    }
  };

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 text-center border border-blue-200 shadow-lg ${className}`}>
      <div className="flex justify-center mb-4">
        {getFeatureIcon()}
      </div>
      
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>
      
      <button
        onClick={onSignIn}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
      >
        <LogIn size={18} />
        Sign In to Continue
      </button>
      
      <p className="text-sm text-gray-500 mt-4">
        Join thousands of users sharing authentic reviews
      </p>
    </div>
  );
};

export default AuthPrompt;