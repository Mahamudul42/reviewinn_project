/**
 * Entity Image Upload Component
 * Handles image upload for entities with drag & drop, preview, and validation
 */

import React, { useState, useCallback, useRef } from 'react';
import type { DragEvent } from 'react';
import { 
  Upload, 
  Camera, 
  Image as ImageIcon, 
  X, 
  AlertCircle,
  Loader2,
  Check
} from 'lucide-react';
import { Button } from '../../../shared/ui';
import { cn } from '../../../shared/design-system/utils/cn';
import { imageService } from '../../../api/imageService';
import { imageOptimizationService } from '../../../api/services/imageOptimizationService';
import { imgbbService, UploadType } from '../../../api/services/imgbbService';
import { ImageCropper } from './ImageCropper';

interface EntityImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
  currentImage: string | null;
  entityName: string;
  entityType?: string; // For determining if it's a person entity
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  uploadType?: UploadType; // Type of upload (entity, user, review)
}

interface UploadState {
  isDragging: boolean;
  isUploading: boolean;
  error: string | null;
  uploadProgress: number;
  originalSize?: number;
  optimizedSize?: number;
  compressionRatio?: string;
  showCropper: boolean;
  selectedFile: File | null;
}

const EntityImageUpload: React.FC<EntityImageUploadProps> = ({
  onImageUpload,
  currentImage,
  entityName,
  entityType,
  maxFileSize = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  uploadType = UploadType.ENTITY // Default to entity upload type
}) => {
  const [state, setState] = useState<UploadState>({
    isDragging: false,
    isUploading: false,
    error: null,
    uploadProgress: 0,
    showCropper: false,
    selectedFile: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload with optimization
  const handleFileUpload = useCallback(async (file: File) => {
    // Validate file using the optimization service
    const validation = imageOptimizationService.validateImage(file);
    if (!validation.isValid) {
      setState(prev => ({ ...prev, error: validation.error! }));
      return;
    }

    // Show cropper instead of directly uploading
    setState(prev => ({ 
      ...prev, 
      selectedFile: file,
      showCropper: true,
      error: null,
    }));
  }, []);

  // Handle cropped image
  const handleCropComplete = useCallback(async (croppedBlob: Blob) => {
    setState(prev => ({ 
      ...prev, 
      isUploading: true,
      showCropper: false,
      error: null,
    }));

    try {
      // Convert blob to file
      const croppedFile = new File([croppedBlob], 'cropped-image.jpg', { type: 'image/jpeg' });
      
      // Upload using ImgBB with the specified upload type
      const imageUrl = await imgbbService.uploadImage(croppedFile, undefined, uploadType);
      
      onImageUpload(imageUrl);
      setState(prev => ({ 
        ...prev, 
        isUploading: false,
        selectedFile: null,
      }));
    } catch (error) {
      console.error('Image upload failed:', error);
      setState(prev => ({ 
        ...prev, 
        isUploading: false,
        error: error instanceof Error ? error.message : 'Failed to upload image',
      }));
    }
  }, [onImageUpload, uploadType]);

  // Handle cropper cancel
  const handleCropCancel = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      showCropper: false,
      selectedFile: null,
    }));
  }, []);

  // Handle file input change
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  }, [handleFileUpload]);

  // Handle drag events
  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setState(prev => ({ ...prev, isDragging: true }));
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setState(prev => ({ ...prev, isDragging: false }));
  }, []);

  const handleDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setState(prev => ({ ...prev, isDragging: false }));

    const files = Array.from(event.dataTransfer.files);
    const imageFile = files.find(file => acceptedTypes.includes(file.type));

    if (imageFile) {
      handleFileUpload(imageFile);
    } else {
      setState(prev => ({ 
        ...prev, 
        error: 'Please drop a valid image file' 
      }));
    }
  }, [acceptedTypes, handleFileUpload]);

  // Handle remove image
  const handleRemoveImage = useCallback(() => {
    onImageUpload('');
    setState(prev => ({ ...prev, error: null }));
  }, [onImageUpload]);

  // Open file dialog
  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-4">
      {/* Current Image Preview */}
      {currentImage && (
        <div className="relative">
          <div className="bg-neutral-50 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={currentImage}
                  alt={entityName}
                  className="w-24 h-24 rounded-lg object-cover border border-neutral-200 shadow-sm"
                  style={{ maxWidth: '96px', maxHeight: '96px' }}
                />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-neutral-900">Image uploaded successfully</h4>
                <p className="text-sm text-neutral-600">
                  Ready for use
                </p>
              </div>
              <button
                onClick={handleRemoveImage}
                className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                disabled={state.isUploading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-all',
          state.isDragging 
            ? 'border-primary-400 bg-primary-50' 
            : 'border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50',
          state.isUploading && 'opacity-50 pointer-events-none'
        )}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={state.isUploading}
        />

        {/* Upload content */}
        <div className="space-y-4">
          {/* Icon */}
          <div className={cn(
            'w-16 h-16 mx-auto rounded-full flex items-center justify-center',
            state.isDragging ? 'bg-primary-100' : 'bg-neutral-100'
          )}>
            {state.isUploading ? (
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            ) : state.uploadProgress === 100 ? (
              <Check className="w-8 h-8 text-green-600" />
            ) : (
              <Upload className={cn(
                'w-8 h-8',
                state.isDragging ? 'text-primary-600' : 'text-neutral-400'
              )} />
            )}
          </div>

          {/* Text */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              {state.isUploading ? 'Uploading...' : 
               state.uploadProgress === 100 ? 'Upload Complete!' :
               currentImage ? 'Replace Image' : 'Upload Entity Image'}
            </h3>
            
            {!state.isUploading && state.uploadProgress !== 100 && (
              <>
                <p className="text-neutral-600 mb-4">
                  {state.isDragging 
                    ? 'Drop your image here' 
                    : 'Drag and drop an image here, or click to browse'
                  }
                </p>
                <div className="text-sm text-neutral-500">
                  Supports {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} • Max {maxFileSize}MB
                </div>
              </>
            )}

            {/* Upload progress */}
            {state.isUploading && (
              <div className="mt-4">
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${state.uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-neutral-600 mt-2">
                  {Math.round(state.uploadProgress)}% uploaded
                </p>
              </div>
            )}
          </div>

          {/* Upload button */}
          {!state.isUploading && state.uploadProgress !== 100 && (
            <Button
              onClick={openFileDialog}
              variant="purple"
              className="mx-auto"
            >
              <Camera className="w-4 h-4 mr-2" />
              Choose Image
            </Button>
          )}
        </div>
      </div>

      {/* Error display */}
      {state.error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Upload Error</p>
            <p className="text-sm text-red-600">{state.error}</p>
          </div>
          <button
            onClick={() => setState(prev => ({ ...prev, error: null }))}
            className="ml-auto p-1 text-red-500 hover:text-red-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Optimization Info */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
        <div className="flex gap-3">
          <ImageIcon className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-neutral-900 mb-1">Image Requirements</h4>
            <p className="text-sm text-neutral-600">
              Upload a clear, professional image. Supported formats: JPEG, PNG, WebP up to {maxFileSize}MB.
            </p>
          </div>
        </div>
      </div>

      {/* Image Cropper Modal */}
      {state.showCropper && state.selectedFile && (
        <ImageCropper
          imageFile={state.selectedFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          isPersonEntity={entityType?.toLowerCase().includes('professional') || entityType?.toLowerCase().includes('person')}
          aspectRatio={1} // Square crop for profile images
        />
      )}
    </div>
  );
};

export default EntityImageUpload;