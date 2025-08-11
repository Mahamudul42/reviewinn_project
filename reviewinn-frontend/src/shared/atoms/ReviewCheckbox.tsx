import React from 'react';

interface ReviewCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  className?: string;
}

const ReviewCheckbox: React.FC<ReviewCheckboxProps> = ({ label, description, className = '', ...props }) => (
  <label className={`flex items-start space-x-3 cursor-pointer ${className}`}>
    <input
      type="checkbox"
      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      {...props}
    />
    <div className="flex-1">
      <span className="text-sm font-medium text-gray-900">{label}</span>
      {description && (
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      )}
    </div>
  </label>
);

export default ReviewCheckbox; 