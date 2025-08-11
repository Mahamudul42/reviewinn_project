import React from 'react';
import FormField from './FormField';
import FormInput from '../atoms/FormInput';
import FormSelect from '../atoms/FormSelect';

interface FormCustomFieldProps {
  label: string;
  type: string;
  required?: boolean;
  value: any;
  options?: string[];
  placeholder?: string;
  onChange: (value: any) => void;
  error?: string;
}

const FormCustomField: React.FC<FormCustomFieldProps> = ({
  label, type, required, value, options, placeholder, onChange, error
}) => (
  <FormField label={label} required={required} error={error}>
    {type === 'select' ? (
      <FormSelect
        required={required}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">Select {label}</option>
        {options?.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </FormSelect>
    ) : (
      <FormInput
        type={type === 'date' ? 'date' : 'text'}
        required={required}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    )}
  </FormField>
);

export default FormCustomField; 