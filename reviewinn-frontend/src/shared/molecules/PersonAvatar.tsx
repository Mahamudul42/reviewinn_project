import React, { useState } from 'react';
import { User, Users } from 'lucide-react';
import { getPersonAvatar, getFallbackImage } from '../../api/imageService';

interface PersonAvatarProps {
  personName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'uniform';
  showMultipleIndicator?: boolean;
  multipleCount?: number;
  className?: string;
}

const PersonAvatar: React.FC<PersonAvatarProps> = ({
  personName,
  size = 'uniform',
  showMultipleIndicator = false,
  multipleCount = 0,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    uniform: 'w-20 h-20', // 80x80px for universal avatar
  };
  
  const sizeDimensions = {
    sm: '64x64',
    md: '96x96',
    lg: '128x128',
    xl: '192x192',
    uniform: '80x80',
  };
    const cleanPersonName = personName.split(' - ')[0];
  const imageUrl = imageError 
    ? getFallbackImage('person_professional', sizeDimensions[size])
    : getPersonAvatar();

  return (
    <div className={`relative ${className}`}>      <div className={`${sizeClasses[size]} rounded-2xl overflow-hidden bg-gray-200 flex items-center justify-center border-2 border-white shadow-lg ring-1 ring-gray-200`}>
        {imageError ? (
          <User className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : size === 'lg' ? 'w-8 h-8' : size === 'uniform' ? 'w-10 h-10' : 'w-12 h-12'} text-gray-400`} />
        ) : (
          <img
            src={imageUrl}
            alt={cleanPersonName}
            className="w-full h-full object-cover object-center"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        )}
      </div>
      
      {/* Multiple entities indicator */}
      {showMultipleIndicator && multipleCount > 0 && (
        <div className="absolute -top-1 -right-1 bg-blue-600 text-white rounded-full flex items-center justify-center min-w-[20px] h-5 px-1">
          <Users className="w-3 h-3 mr-0.5" />
          <span className="text-xs font-medium">{multipleCount + 1}</span>
        </div>
      )}
    </div>
  );
};

export default PersonAvatar;
