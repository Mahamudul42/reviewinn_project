import React, { useState } from 'react';

interface ReviewImage {
  url?: string;
  caption?: string;
  alt?: string;
}

interface ReviewImagesProps {
  images: (string | ReviewImage)[];
  className?: string;
  maxColumns?: number;
}

const ReviewImages: React.FC<ReviewImagesProps> = ({
  images,
  className = '',
  maxColumns = 3
}) => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return null;
  }

  const getImageUrl = (image: string | ReviewImage): string => {
    return typeof image === 'string' ? image : image.url || '';
  };

  const getImageAlt = (image: string | ReviewImage, index: number): string => {
    if (typeof image === 'string') return `Review image ${index + 1}`;
    return image.alt || image.caption || `Review image ${index + 1}`;
  };

  const gridCols = Math.min(images.length, maxColumns);
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  };

  return (
    <>
      <div className={`grid ${gridClasses[gridCols as keyof typeof gridClasses]} gap-4 ${className}`}>
        {images.map((image, index) => (
          <div key={index} className="relative group">
            <img
              src={getImageUrl(image)}
              alt={getImageAlt(image, index)}
              className="w-full h-48 object-cover rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
              loading="lazy"
              onClick={() => setSelectedImage(index)}
            />
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-200 rounded-lg pointer-events-none"></div>
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Click to enlarge
            </div>
          </div>
        ))}
      </div>

      {/* Image Modal */}
      {selectedImage !== null && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={getImageUrl(images[selectedImage])}
              alt={getImageAlt(images[selectedImage], selectedImage)}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition-all duration-200"
            >
              ×
            </button>
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
                {selectedImage + 1} of {images.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ReviewImages;