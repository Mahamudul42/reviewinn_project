import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { getEntityImage, getSubcategoryImage, getFallbackImage } from '../../api/imageService';

interface EntityImageProps {
  entity: any;
  size?: 'thumbnail' | 'card' | 'header' | 'uniform';
  className?: string;
  alt?: string;
  useSubcategoryImage?: boolean;
}

const EntityImage: React.FC<EntityImageProps> = ({
  entity,
  size = 'uniform',
  className = '',
  alt,
  useSubcategoryImage = false
}) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeDimensions = {
    thumbnail: '100x100',
    card: '300x200',
    header: '800x400',
    uniform: '80x80',
  };
  
  const sizeClasses = {
    thumbnail: 'w-16 h-16',
    card: 'w-full h-48',
    header: 'w-full h-64',
    uniform: 'w-20 h-20',
  };
  
  const getImageUrl = () => {
    if (imageError) {
      return getFallbackImage(entity.category, sizeDimensions[size]);
    }
    if (useSubcategoryImage) {
      return getSubcategoryImage(entity.category);
    }
    return getEntityImage(entity);
  };
  return (
    <div className={`${sizeClasses[size]} bg-gray-200 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-white shadow-lg ring-1 ring-gray-200 ${className}`}>
      {imageError ? (
        <ImageIcon className={`${size === 'uniform' ? 'w-10 h-10' : 'w-8 h-8'} text-gray-400`} />
      ) : (
        <img
          src={getImageUrl()}
          alt={alt || entity.name}
          className="w-full h-full object-cover object-center"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      )}
    </div>
  );
};

export default EntityImage;
