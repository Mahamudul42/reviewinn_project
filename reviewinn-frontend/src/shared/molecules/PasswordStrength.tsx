import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

interface PasswordRequirement {
  test: (password: string) => boolean;
  label: string;
  id: string;
}

const requirements: PasswordRequirement[] = [
  {
    id: 'length',
    label: 'At least 8 characters',
    test: (password: string) => password.length >= 8
  },
  {
    id: 'lowercase',
    label: 'One lowercase letter',
    test: (password: string) => /[a-z]/.test(password)
  },
  {
    id: 'uppercase',
    label: 'One uppercase letter',
    test: (password: string) => /[A-Z]/.test(password)
  },
  {
    id: 'number',
    label: 'One number',
    test: (password: string) => /\d/.test(password)
  },
  {
    id: 'special',
    label: 'One special character',
    test: (password: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  },
  {
    id: 'noCommon',
    label: 'Not a common password',
    test: (password: string) => !/^(password|123456|qwerty|admin|user|test)$/i.test(password)
  },
  {
    id: 'noSequential',
    label: 'No sequential characters',
    test: (password: string) => !/(?:012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)
  }
];

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password, className = '' }) => {
  if (!password) return null;

  const getStrengthLevel = () => {
    const passedTests = requirements.filter(req => req.test(password)).length;
    if (passedTests >= 6) return 'strong';
    if (passedTests >= 5) return 'medium';
    if (passedTests >= 3) return 'weak';
    return 'very-weak';
  };

  const strengthLevel = getStrengthLevel();
  const passedCount = requirements.filter(req => req.test(password)).length;

  const strengthColors = {
    'very-weak': 'text-red-600 bg-red-100 border-red-200',
    'weak': 'text-orange-600 bg-orange-100 border-orange-200',
    'medium': 'text-yellow-600 bg-yellow-100 border-yellow-200',
    'strong': 'text-green-600 bg-green-100 border-green-200'
  };

  const strengthTexts = {
    'very-weak': 'Very Weak',
    'weak': 'Weak',
    'medium': 'Medium',
    'strong': 'Strong'
  };

  return (
    <div className={`mt-2 p-3 border rounded-lg ${strengthColors[strengthLevel]} ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">
          Password Strength: {strengthTexts[strengthLevel]}
        </span>
        <span className="text-xs">
          {passedCount}/{requirements.length}
        </span>
      </div>
      
      <div className="space-y-1">
        {requirements.map((requirement) => {
          const isPassed = requirement.test(password);
          return (
            <div key={requirement.id} className="flex items-center space-x-2">
              {isPassed ? (
                <Check size={12} className="text-green-500" />
              ) : (
                <X size={12} className="text-red-400" />
              )}
              <span className={`text-xs ${isPassed ? 'text-green-700' : 'text-gray-600'}`}>
                {requirement.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PasswordStrength;
