import React from 'react';
import { Button } from '../../../shared/ui';
import { CheckCircle, ArrowLeft, Check, Sparkles, Zap } from 'lucide-react';

interface ModularSubmitSectionProps {
  onSubmit: () => void;
  onBack: () => void;
  isLoading: boolean;
  disabled?: boolean;
  title?: string;
  description?: string;
}

const ModularSubmitSection: React.FC<ModularSubmitSectionProps> = ({
  onSubmit,
  onBack,
  isLoading,
  disabled = false,
  title = "Ready to Create Entity",
  description = "All information has been reviewed and validated"
}) => {
  return (
    <div className="space-y-6">
      {/* Prominent Submit Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 border-2 border-emerald-200 rounded-2xl shadow-2xl">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-200/20 to-blue-200/20 rounded-full transform translate-x-20 -translate-y-20"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full transform -translate-x-16 translate-y-16"></div>
        
        <div className="relative p-8">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-emerald-500 to-blue-600 flex items-center justify-center shadow-2xl animate-pulse">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{description}</p>
            
            {/* Success Indicators */}
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium border border-emerald-200">
                <CheckCircle className="h-4 w-4" />
                Form Validated
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium border border-blue-200">
                <Sparkles className="h-4 w-4" />
                Ready to Submit
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium border border-purple-200">
                <Zap className="h-4 w-4" />
                Final Step
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="secondary"
              size="lg"
              onClick={onBack}
              leftIcon={<ArrowLeft className="h-5 w-5" />}
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold px-8 py-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 min-w-[160px]"
              disabled={isLoading}
            >
              Back to Edit
            </Button>
            
            <Button
              variant="primary"
              size="lg"
              onClick={onSubmit}
              disabled={disabled || isLoading}
              isLoading={isLoading}
              leftIcon={!isLoading ? <Check className="h-6 w-6" /> : undefined}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-12 py-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-w-[220px] text-lg"
            >
              <span>
                {isLoading ? 'Creating Entity...' : '🚀 Create Entity'}
              </span>
            </Button>
          </div>
          
          {/* Additional Info */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              By creating this entity, you agree to our terms of service and community guidelines.
            </p>
          </div>
        </div>
      </div>
      
      {/* Spacer to ensure visibility */}
      <div className="h-20"></div>
      
      {/* Bottom anchor for scrolling */}
      <div id="submit-section-anchor" className="h-1"></div>
    </div>
  );
};

export default ModularSubmitSection; 