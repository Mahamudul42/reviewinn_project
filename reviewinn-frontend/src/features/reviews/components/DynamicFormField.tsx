import React from 'react';
import type { FieldConfig } from '../../../types';

interface DynamicFormFieldProps {
  field: FieldConfig;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

export const DynamicFormField: React.FC<DynamicFormFieldProps> = ({
  field,
  value,
  onChange,
  error,
  disabled = false
}) => {
  const fieldId = `field-${field.name.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  const helpId = field.helpText ? `${fieldId}-help` : undefined;
  const baseClasses = `
    w-full px-3 py-2 border border-gray-300 rounded-lg
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:bg-gray-100 disabled:cursor-not-allowed
    ${error ? 'border-red-500 focus:ring-red-500' : ''}
  `;

  const renderField = () => {
    switch (field.type) {
      case 'text':
        return (
          <input
            id={fieldId}
            type="text"
            className={baseClasses}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            required={field.required}
            aria-invalid={!!error}
            aria-describedby={[helpId, errorId].filter(Boolean).join(' ') || undefined}
          />
        );

      case 'textarea':
        return (
          <textarea
            id={fieldId}
            className={`${baseClasses} min-h-[80px] resize-y`}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            required={field.required}
            rows={3}
            aria-invalid={!!error}
            aria-describedby={[helpId, errorId].filter(Boolean).join(' ') || undefined}
          />
        );

      case 'select':
        return (
          <select
            id={fieldId}
            className={baseClasses}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            required={field.required}
            aria-invalid={!!error}
            aria-describedby={[helpId, errorId].filter(Boolean).join(' ') || undefined}
          >
            <option value="">Select {field.name}</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'number':
        return (
          <input
            id={fieldId}
            type="number"
            className={baseClasses}
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            placeholder={field.placeholder}
            disabled={disabled}
            required={field.required}
            min={field.validation?.min}
            max={field.validation?.max}
            aria-invalid={!!error}
            aria-describedby={[helpId, errorId].filter(Boolean).join(' ') || undefined}
          />
        );

      case 'date':
        return (
          <input
            id={fieldId}
            type="date"
            className={baseClasses}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            required={field.required}
            aria-invalid={!!error}
            aria-describedby={[helpId, errorId].filter(Boolean).join(' ') || undefined}
          />
        );

      default:
        return (
          <input
            id={fieldId}
            type="text"
            className={baseClasses}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            required={field.required}
            aria-invalid={!!error}
            aria-describedby={[helpId, errorId].filter(Boolean).join(' ') || undefined}
          />
        );
    }
  };

  return (
    <div className="mb-4">
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
        {field.name}
        {field.required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        {field.required && <span className="sr-only">(required)</span>}
      </label>
      
      {renderField()}
      
      {field.helpText && (
        <p id={helpId} className="text-xs text-gray-500 mt-1">{field.helpText}</p>
      )}
      
      {error && (
        <p id={errorId} className="text-xs text-red-500 mt-1" role="alert" aria-live="polite">{error}</p>
      )}
    </div>
  );
};

export default DynamicFormField;