import React from 'react';
import ReviewCheckbox from '../atoms/ReviewCheckbox';

interface PrivacySectionProps {
  isAnonymous: boolean;
  onAnonymousChange: (isAnonymous: boolean) => void;
  className?: string;
}

const PrivacySection: React.FC<PrivacySectionProps> = ({ isAnonymous, onAnonymousChange, className = '' }) => (
  <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy</h3>
    <ReviewCheckbox
      label="Submit anonymously"
      description="Your username will be hidden from this review"
      checked={isAnonymous}
      onChange={(e) => onAnonymousChange(e.target.checked)}
    />
  </div>
);

export default PrivacySection; 