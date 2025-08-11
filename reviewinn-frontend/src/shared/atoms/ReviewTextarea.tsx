import React from 'react';

interface ReviewTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  characterCount?: number;
  maxLength?: number;
  className?: string;
}

const ReviewTextarea: React.FC<ReviewTextareaProps> = ({
  value,
  onChange,
  placeholder = "Share your experience...",
  rows = 4,
  required = false,
  characterCount = 0,
  maxLength = 1000,
  className = ''
}) => {
  const isNearLimit = characterCount > maxLength * 0.9;
  const isOverLimit = characterCount > maxLength;

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        maxLength={maxLength}
        className={`
          w-full px-4 py-3 border border-gray-300 rounded-lg 
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
          resize-none transition-colors
          ${isOverLimit ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
          ${className}
        `}
      />
      
      <div className="flex justify-between items-center text-sm">
        <div className="text-gray-500">
          {characterCount > 0 && (
            <span>
              {characterCount} character{characterCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        <div className={`
          ${isOverLimit ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-gray-500'}
        `}>
          {characterCount}/{maxLength}
        </div>
      </div>
      
      {isOverLimit && (
        <p className="text-sm text-red-600">
          Character limit exceeded. Please shorten your review.
        </p>
      )}
    </div>
  );
};

export default ReviewTextarea; 