import React, { useState } from 'react';
import { entityService } from '../../api/services';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import { Entity } from '../../types';

interface ClaimButtonProps {
  entity: Entity;
  onClaimChange?: (entity: Entity) => void;
  className?: string;
}

const ClaimButton: React.FC<ClaimButtonProps> = ({ 
  entity, 
  onClaimChange,
  className = ''
}) => {
  const { isAuthenticated } = useUnifiedAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClaimToggle = async () => {
    if (!isAuthenticated) {
      setError('Please log in to claim entities');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let result;
      if (entity.isClaimed) {
        result = await entityService.unclaimEntity(entity.id);
      } else {
        result = await entityService.claimEntity(entity.id);
      }
      
      onClaimChange?.(result.entity);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to update claim status');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Don't show claim button for unauthenticated users
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button
        onClick={handleClaimToggle}
        disabled={isLoading}
        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
          entity.isClaimed
            ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
            : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {entity.isClaimed ? 'Unclaiming...' : 'Claiming...'}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            {entity.isClaimed ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Unclaim Entity
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Claim Entity
              </>
            )}
          </span>
        )}
      </button>
      
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
          {error}
        </div>
      )}
    </div>
  );
};

export default ClaimButton; 