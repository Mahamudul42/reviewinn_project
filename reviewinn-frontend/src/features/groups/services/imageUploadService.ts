import { imgbbService, UploadType } from '../../../api/services/imgbbService';
import { imageOptimizationService } from '../../../api/services/imageOptimizationService';

export interface ImageUploadResponse {
  url: string;
  size: number;
  format: string;
}

export interface ImageUploadOptions {
  maxSizeBytes?: number;
  allowedFormats?: string[];
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

class GroupImageUploadService {
  private readonly defaultOptions: ImageUploadOptions = {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    quality: 0.8,
    maxWidth: 1200,
    maxHeight: 800
  };

  async uploadImage(
    file: File, 
    type: 'profile' | 'cover',
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResponse> {
    const config = { ...this.defaultOptions, ...options };
    
    // Validate file using the optimization service
    const validation = imageOptimizationService.validateImage(file);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid image file');
    }

    try {
      // Optimize image if needed
      let optimizedFile = file;
      if (type === 'cover') {
        optimizedFile = await this.optimizeImage(file, config);
      }

      // Upload using ImgBB service with GROUP upload type
      const imageUrl = await imgbbService.uploadImage(optimizedFile, `group-${type}-${Date.now()}`, UploadType.GROUP);
      
      return {
        url: imageUrl,
        size: optimizedFile.size,
        format: optimizedFile.type.split('/')[1]
      };
    } catch (error) {
      console.error('Group image upload error:', error);
      throw new Error('Failed to upload image. Please try again.');
    }
  }

  // Optimize image for better performance and smaller file size
  private async optimizeImage(file: File, options: ImageUploadOptions): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        const maxWidth = options.maxWidth || 1200;
        const maxHeight = options.maxHeight || 800;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name, {
                type: 'image/jpeg', // Convert to JPEG for better compression
                lastModified: Date.now()
              });
              resolve(optimizedFile);
            } else {
              resolve(file); // Fallback to original file
            }
          },
          'image/jpeg',
          options.quality || 0.8
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Utility function to create a preview URL for immediate display
  createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  // Clean up preview URLs to prevent memory leaks
  revokePreviewUrl(url: string): void {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
}

export const groupImageUploadService = new GroupImageUploadService();
export { groupImageUploadService as imageUploadService }; // Keep backwards compatibility