import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '../../../shared/design-system/components/Button';
import { imgbbService } from '../../../api/services/imgbbService';

interface ImageUploadProps {
  type: 'profile' | 'cover';
  currentImage?: string;
  onImageChange: (file: File | null, previewUrl: string | null) => void;
  error?: string;
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  type,
  currentImage,
  onImageChange,
  error,
  disabled = false
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isProfile = type === 'profile';
  const containerClass = isProfile 
    ? 'w-32 h-32 rounded-full' 
    : 'w-full h-48 rounded-xl';

  const handleFileSelect = useCallback((file: File) => {
    if (!file) return;

    // Use ImgBB service validation for consistency
    const validation = imgbbService.validateImageFile(file);
    if (!validation.valid) {
      console.error('File validation failed:', validation.error);
      return;
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onImageChange(file, url);
  }, [onImageChange]);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageChange(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={`relative ${containerClass} border-2 border-dashed transition-all duration-300 cursor-pointer group overflow-hidden ${
          isDragging
            ? 'border-purple-500 bg-purple-50'
            : error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt={`${type} preview`}
              className={`w-full h-full object-cover ${containerClass}`}
            />
            {/* Overlay for hover effects */}
            <div 
              className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300 ${
                isHovering && !disabled ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white text-gray-700 hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick();
                  }}
                >
                  <Camera className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white text-red-600 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage();
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
            {isProfile ? (
              <>
                <Camera className="w-8 h-8" />
                <span className="text-xs text-center">Add Profile Photo</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-8 h-8" />
                <div className="text-sm text-center px-2">
                  <p className="font-medium">Add Cover Photo</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Drag & drop or click to upload
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Upload progress or loading state could go here */}
      </div>

      {/* File input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Help text */}
      <p className="text-xs text-gray-500">
        {isProfile ? (
          'Recommended: Square image, at least 200x200px. Max 5MB.'
        ) : (
          'Recommended: 16:9 aspect ratio, at least 1200x675px. Max 5MB.'
        )}
      </p>
    </div>
  );
};

export default ImageUpload;