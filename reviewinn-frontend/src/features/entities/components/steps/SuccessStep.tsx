/**
 * Success Step Component
 * Shows success message after entity creation
 */

import React from 'react';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../../../../shared/ui';

export const SuccessStep: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-2xl py-8 flex items-center justify-center">
      <Card className="max-w-md w-full text-center p-8">
        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center">
          <Check className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          Success!
        </h1>
        <p className="text-neutral-600 mb-6">
          Your entity has been created successfully.
        </p>
        <Button
          onClick={() => navigate('/')}
          variant="purple"
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Go to Homepage
        </Button>
      </Card>
    </div>
  );
};