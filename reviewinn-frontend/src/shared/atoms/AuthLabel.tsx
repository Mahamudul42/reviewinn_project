import React from 'react';

interface AuthLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  className?: string;
}

const AuthLabel: React.FC<AuthLabelProps> = ({ children, className = '', ...props }) => (
  <label
    className={`inline-flex items-center text-sm font-medium text-gray-700 ${className}`}
    style={{ margin: 0 }}
    {...props}
  >
    {children}
  </label>
);

export default AuthLabel; 