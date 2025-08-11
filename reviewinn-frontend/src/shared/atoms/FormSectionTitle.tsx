import React from 'react';

interface FormSectionTitleProps {
  children: React.ReactNode;
  className?: string;
}

const FormSectionTitle: React.FC<FormSectionTitleProps> = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h3>
);

export default FormSectionTitle; 