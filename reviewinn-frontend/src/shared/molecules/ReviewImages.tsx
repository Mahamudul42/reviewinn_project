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
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3'
  };

  // Navigate to next/previous image
  const navigateImage = (direction: 'next' | 'prev') => {
    if (selectedImage === null) return;
    
    if (direction === 'next') {
      setSelectedImage(selectedImage < images.length - 1 ? selectedImage + 1 : 0);
    } else {
      setSelectedImage(selectedImage > 0 ? selectedImage - 1 : images.length - 1);
    }
  };

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImage === null) return;
      
      switch (e.key) {
        case 'Escape':
          setSelectedImage(null);
          break;
        case 'ArrowRight':
          navigateImage('next');
          break;
        case 'ArrowLeft':
          navigateImage('prev');
          break;
      }
    };

    if (selectedImage !== null) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedImage, images.length]);

  return (
    <>
      <div className={`grid ${gridClasses[gridCols as keyof typeof gridClasses]} gap-3 ${className}`}>
        {images.map((image, index) => (
          <div key={index} className="relative group overflow-hidden rounded-xl">
            <img
              src={getImageUrl(image)}
              alt={getImageAlt(image, index)}
              className="w-full h-32 sm:h-28 object-cover rounded-xl border border-gray-200 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer"
              loading="lazy"
              onClick={() => setSelectedImage(index)}
            />
            {/* Beautiful gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"></div>
            
            {/* Enhanced hover indicators */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 border border-white/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
            
            {/* Image counter badge */}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {index + 1} of {images.length}
            </div>
            
            {/* Click to enlarge hint */}
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Click to enlarge
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Image Modal */}
      {selectedImage !== null && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-6xl max-h-full w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            {/* Main Image */}
            <div className="relative">
              <img
                src={getImageUrl(images[selectedImage])}
                alt={getImageAlt(images[selectedImage], selectedImage)}
                className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
              />
              
              {/* Loading placeholder would go here if needed */}
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); navigateImage('prev'); }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200 hover:scale-110"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); navigateImage('next'); }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200 hover:scale-110"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Close Button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200 hover:scale-110"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image Info Bar */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full flex items-center gap-3">
              <span className="text-sm font-medium">
                {selectedImage + 1} of {images.length}
              </span>
              {images.length > 1 && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs text-gray-300">
                    Use ← → keys to navigate
                  </span>
                </>
              )}
            </div>

            {/* Thumbnail Strip for multiple images */}
            {images.length > 1 && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-md overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={(e) => { e.stopPropagation(); setSelectedImage(index); }}
                    className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      index === selectedImage 
                        ? 'border-white shadow-lg scale-110' 
                        : 'border-white/30 hover:border-white/60 hover:scale-105'
                    }`}
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={getImageAlt(image, index)}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ReviewImages;