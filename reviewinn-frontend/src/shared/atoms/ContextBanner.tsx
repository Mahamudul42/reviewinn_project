import React from 'react';
import { Users } from 'lucide-react';

interface ContextBannerProps {
  role: string;
  organization?: string;
  department?: string;
}

const ContextBanner: React.FC<ContextBannerProps> = ({
  role,
  organization,
  department
}) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-blue-900">
            Professional Context
          </h4>
          <div className="mt-1 space-y-1">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Role:</span> {role}
            </p>
            {organization && (
              <p className="text-sm text-blue-700">
                <span className="font-medium">Organization:</span> {organization}
              </p>
            )}
            {department && (
              <p className="text-sm text-blue-700">
                <span className="font-medium">Department:</span> {department}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContextBanner; 