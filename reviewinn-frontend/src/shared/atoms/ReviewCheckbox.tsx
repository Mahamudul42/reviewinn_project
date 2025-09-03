import React from 'react';

// Generate unique ID for accessibility
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `checkbox-${crypto.randomUUID().slice(0, 8)}`;
  }
  // Fallback for older browsers
  return `checkbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

interface ReviewCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  className?: string;
}

const ReviewCheckbox: React.FC<ReviewCheckboxProps> = ({ 
  label, 
  description, 
  className = '', 
  id,
  ...props 
}) => {
  const checkboxId = id || generateId();
  const descriptionId = description ? `${checkboxId}-description` : undefined;

  return (
    <label className={`flex items-start space-x-3 cursor-pointer ${className}`} htmlFor={checkboxId}>
      <input
        type="checkbox"
        id={checkboxId}
        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-1 border-gray-300 rounded transition-colors"
        aria-describedby={descriptionId}
        {...props}
      />
      <div className="flex-1">
        <span className="text-sm font-medium text-gray-900">{label}</span>
        {description && (
          <p 
            id={descriptionId}
            className="text-sm text-gray-500 mt-1"
          >
            {description}
          </p>
        )}
      </div>
    </label>
  );
};

export default ReviewCheckbox; 