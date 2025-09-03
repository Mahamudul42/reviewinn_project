import React, { createContext, useContext, useId, ReactNode } from 'react';

// Form Context for sharing form state
interface FormContextValue {
  formId: string;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

const FormContext = createContext<FormContextValue | null>(null);

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
};

// Form Provider Component
interface FormProviderProps {
  children: ReactNode;
  errors?: Record<string, string>;
  touched?: Record<string, boolean>;
}

export const FormProvider: React.FC<FormProviderProps> = ({
  children,
  errors = {},
  touched = {}
}) => {
  const formId = useId();

  return (
    <FormContext.Provider value={{ formId, errors, touched }}>
      {children}
    </FormContext.Provider>
  );
};

// Accessible Input Field Component
interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
  description?: string;
  required?: boolean;
  hideLabel?: boolean;
}

export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  label,
  name,
  error: propError,
  description,
  required = false,
  hideLabel = false,
  className = '',
  ...inputProps
}) => {
  const inputId = useId();
  const errorId = useId();
  const descriptionId = useId();
  
  const { errors, touched } = useFormContext();
  const error = propError || (touched[name] ? errors[name] : undefined);
  const hasError = Boolean(error);

  return (
    <div className="space-y-1">
      <label
        htmlFor={inputId}
        className={`
          block text-sm font-medium text-gray-700 
          ${hideLabel ? 'sr-only' : ''}
          ${required ? 'after:content-["*"] after:ml-0.5 after:text-red-500' : ''}
        `}
      >
        {label}
      </label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-gray-600">
          {description}
        </p>
      )}
      
      <input
        id={inputId}
        name={name}
        aria-invalid={hasError}
        aria-describedby={`
          ${description ? descriptionId : ''} 
          ${hasError ? errorId : ''}
        `.trim()}
        aria-required={required}
        className={`
          block w-full px-3 py-2 border rounded-md shadow-sm
          placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
          ${hasError 
            ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
          }
          ${className}
        `}
        {...inputProps}
      />
      
      {hasError && (
        <p 
          id={errorId} 
          className="text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
};

// Accessible Textarea Component
interface AccessibleTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  name: string;
  error?: string;
  description?: string;
  required?: boolean;
  hideLabel?: boolean;
}

export const AccessibleTextarea: React.FC<AccessibleTextareaProps> = ({
  label,
  name,
  error: propError,
  description,
  required = false,
  hideLabel = false,
  className = '',
  ...textareaProps
}) => {
  const textareaId = useId();
  const errorId = useId();
  const descriptionId = useId();
  
  const { errors, touched } = useFormContext();
  const error = propError || (touched[name] ? errors[name] : undefined);
  const hasError = Boolean(error);

  return (
    <div className="space-y-1">
      <label
        htmlFor={textareaId}
        className={`
          block text-sm font-medium text-gray-700 
          ${hideLabel ? 'sr-only' : ''}
          ${required ? 'after:content-["*"] after:ml-0.5 after:text-red-500' : ''}
        `}
      >
        {label}
      </label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-gray-600">
          {description}
        </p>
      )}
      
      <textarea
        id={textareaId}
        name={name}
        aria-invalid={hasError}
        aria-describedby={`
          ${description ? descriptionId : ''} 
          ${hasError ? errorId : ''}
        `.trim()}
        aria-required={required}
        className={`
          block w-full px-3 py-2 border rounded-md shadow-sm
          placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
          ${hasError 
            ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
          }
          ${className}
        `}
        {...textareaProps}
      />
      
      {hasError && (
        <p 
          id={errorId} 
          className="text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
};

// Accessible Select Component
interface AccessibleSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  name: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  error?: string;
  description?: string;
  required?: boolean;
  hideLabel?: boolean;
}

export const AccessibleSelect: React.FC<AccessibleSelectProps> = ({
  label,
  name,
  options,
  placeholder = 'Select an option...',
  error: propError,
  description,
  required = false,
  hideLabel = false,
  className = '',
  ...selectProps
}) => {
  const selectId = useId();
  const errorId = useId();
  const descriptionId = useId();
  
  const { errors, touched } = useFormContext();
  const error = propError || (touched[name] ? errors[name] : undefined);
  const hasError = Boolean(error);

  return (
    <div className="space-y-1">
      <label
        htmlFor={selectId}
        className={`
          block text-sm font-medium text-gray-700 
          ${hideLabel ? 'sr-only' : ''}
          ${required ? 'after:content-["*"] after:ml-0.5 after:text-red-500' : ''}
        `}
      >
        {label}
      </label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-gray-600">
          {description}
        </p>
      )}
      
      <select
        id={selectId}
        name={name}
        aria-invalid={hasError}
        aria-describedby={`
          ${description ? descriptionId : ''} 
          ${hasError ? errorId : ''}
        `.trim()}
        aria-required={required}
        className={`
          block w-full px-3 py-2 border rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
          ${hasError 
            ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
          }
          ${className}
        `}
        {...selectProps}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {hasError && (
        <p 
          id={errorId} 
          className="text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
};

// Accessible Checkbox Component
interface AccessibleCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  name: string;
  description?: string;
  error?: string;
}

export const AccessibleCheckbox: React.FC<AccessibleCheckboxProps> = ({
  label,
  name,
  description,
  error: propError,
  className = '',
  ...checkboxProps
}) => {
  const checkboxId = useId();
  const errorId = useId();
  const descriptionId = useId();
  
  const { errors, touched } = useFormContext();
  const error = propError || (touched[name] ? errors[name] : undefined);
  const hasError = Boolean(error);

  return (
    <div className="space-y-1">
      <div className="flex items-start">
        <input
          id={checkboxId}
          name={name}
          type="checkbox"
          aria-invalid={hasError}
          aria-describedby={`
            ${description ? descriptionId : ''} 
            ${hasError ? errorId : ''}
          `.trim()}
          className={`
            h-4 w-4 text-purple-600 rounded border-gray-300 
            focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
            ${hasError ? 'border-red-300' : 'border-gray-300'}
            ${className}
          `}
          {...checkboxProps}
        />
        <div className="ml-3">
          <label htmlFor={checkboxId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
          {description && (
            <p id={descriptionId} className="text-sm text-gray-600">
              {description}
            </p>
          )}
        </div>
      </div>
      
      {hasError && (
        <p 
          id={errorId} 
          className="text-sm text-red-600 ml-7"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
};