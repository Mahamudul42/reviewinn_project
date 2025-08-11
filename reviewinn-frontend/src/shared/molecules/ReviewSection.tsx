import React from 'react';

interface ReviewSectionProps {
  title: string;
  children: React.ReactNode;
  description?: string;
  className?: string;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({
  title,
  children,
  description,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>
      
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

export default ReviewSection; 