/**
 * Image Optimization Service
 * Handles image resizing, format conversion, and upload to ImgBB
 */

import { httpClient } from '../httpClient';
import { IMAGE_CONFIG } from '../../config/imageConfig';

interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  maintainAspectRatio?: boolean;
}

interface ImgBBResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    size: number;
    time: string;
    expiration: string;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    medium: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
  };
  success: boolean;
  status: number;
}

enum UploadType {
  ENTITY = 'entity',
  USER = 'user',
  REVIEW = 'review',
}

class ImageOptimizationService {
  private readonly IMGBB_API_KEY = IMAGE_CONFIG.IMGBB.API_KEY;
  private readonly IMGBB_UPLOAD_URL = IMAGE_CONFIG.IMGBB.UPLOAD_URL;
  
  private readonly DEFAULT_OPTIONS: ImageOptimizationOptions = {
    maxWidth: IMAGE_CONFIG.OPTIMIZATION.MAX_WIDTH,
    maxHeight: IMAGE_CONFIG.OPTIMIZATION.MAX_HEIGHT,
    quality: IMAGE_CONFIG.OPTIMIZATION.QUALITY,
    format: IMAGE_CONFIG.OPTIMIZATION.FORMAT,
    maintainAspectRatio: IMAGE_CONFIG.OPTIMIZATION.MAINTAIN_ASPECT_RATIO,
  };

  /**
   * Resize and optimize image using Canvas API
   */
  private async resizeImage(
    file: File, 
    options: ImageOptimizationOptions = {}
  ): Promise<Blob> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = img;
          
          if (opts.maintainAspectRatio) {
            const aspectRatio = width / height;
            
            if (width > opts.maxWidth!) {
              width = opts.maxWidth!;
              height = width / aspectRatio;
            }
            
            if (height > opts.maxHeight!) {
              height = opts.maxHeight!;
              width = height * aspectRatio;
            }
          } else {
            width = Math.min(width, opts.maxWidth!);
            height = Math.min(height, opts.maxHeight!);
          }

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Configure canvas for better quality
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Draw the resized image
            ctx.drawImage(img, 0, 0, width, height);
          }

          // Convert to desired format with quality
          const mimeType = opts.format === 'webp' ? 'image/webp' : 
                          opts.format === 'jpeg' ? 'image/jpeg' : 'image/png';
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob from canvas'));
              }
            },
            mimeType,
            opts.quality! / 100
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Upload optimized image to ImgBB
   */
  private async uploadToImgBB(blob: Blob, fileName: string, uploadType?: UploadType): Promise<string> {
    try {
      // Convert blob to base64
      const base64 = await this.blobToBase64(blob);
      
      // Get the appropriate API key
      const apiKey = this.getApiKey(uploadType);
      
      // Prepare form data for ImgBB
      const formData = new FormData();
      formData.append('key', apiKey);
      formData.append('image', base64.split(',')[1]); // Remove data:image/... prefix
      formData.append('name', fileName);
      formData.append('expiration', IMAGE_CONFIG.IMGBB.EXPIRATION);

      // Upload to ImgBB
      const response = await fetch(this.IMGBB_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`ImgBB upload failed: ${response.statusText}`);
      }

      const result: ImgBBResponse = await response.json();
      
      if (!result.success) {
        throw new Error('ImgBB upload was not successful');
      }

      // Return the optimized image URL
      return result.data.url;
    } catch (error) {
      console.error('ImgBB upload error:', error);
      throw new Error('Failed to upload image to ImgBB');
    }
  }

  /**
   * Get the appropriate API key for the upload type
   */
  private getApiKey(uploadType?: UploadType): string {
    switch (uploadType) {
      case UploadType.ENTITY:
        return IMAGE_CONFIG.IMGBB.API_KEY_ENTITY;
      case UploadType.USER:
        return IMAGE_CONFIG.IMGBB.API_KEY_USER;
      case UploadType.REVIEW:
        return IMAGE_CONFIG.IMGBB.API_KEY_REVIEW;
      default:
        return IMAGE_CONFIG.IMGBB.API_KEY;
    }
  }

  /**
   * Convert blob to base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Get image dimensions and file info
   */
  private getImageInfo(file: File): Promise<{
    width: number;
    height: number;
    size: number;
    type: string;
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          size: file.size,
          type: file.type,
        });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Main method to optimize and upload image
   */
  async optimizeAndUpload(
    file: File,
    options: ImageOptimizationOptions = {}
  ): Promise<{
    url: string;
    originalInfo: any;
    optimizedInfo: any;
  }> {
    try {
      // Get original image info
      const originalInfo = await this.getImageInfo(file);
      
      // Optimize image
      const optimizedBlob = await this.resizeImage(file, options);
      
      // Create file name
      const timestamp = Date.now();
      const fileName = `entity_${timestamp}.${options.format || 'webp'}`;
      
      // Upload to ImgBB
      const url = await this.uploadToImgBB(optimizedBlob, fileName);
      
      const optimizedInfo = {
        size: optimizedBlob.size,
        type: optimizedBlob.type,
        compressionRatio: ((originalInfo.size - optimizedBlob.size) / originalInfo.size * 100).toFixed(1),
      };

      return {
        url,
        originalInfo,
        optimizedInfo,
      };
    } catch (error) {
      console.error('Image optimization error:', error);
      throw error;
    }
  }

  /**
   * Create responsive image URLs for different screen sizes
   */
  generateResponsiveUrls(baseUrl: string): {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
  } {
    // ImgBB provides different size variants
    const baseUrlWithoutExt = baseUrl.replace(/\.[^/.]+$/, '');
    
    return {
      thumbnail: `${baseUrlWithoutExt}_thumb.webp`, // 150x150
      small: `${baseUrlWithoutExt}_small.webp`,     // 300x300
      medium: `${baseUrlWithoutExt}_medium.webp`,   // 500x500
      large: baseUrl,                               // Original optimized
    };
  }

  /**
   * Validate image file before processing
   */
  validateImage(file: File): {
    isValid: boolean;
    error?: string;
  } {
    if (!IMAGE_CONFIG.VALIDATION.ALLOWED_TYPES.includes(file.type)) {
      const allowedExtensions = IMAGE_CONFIG.VALIDATION.ALLOWED_TYPES
        .map(type => type.split('/')[1].toUpperCase())
        .join(', ');
      return {
        isValid: false,
        error: `Please upload a valid image file (${allowedExtensions})`,
      };
    }

    if (file.size > IMAGE_CONFIG.VALIDATION.MAX_FILE_SIZE) {
      const maxSizeMB = IMAGE_CONFIG.VALIDATION.MAX_FILE_SIZE / 1024 / 1024;
      return {
        isValid: false,
        error: `Image file is too large. Please choose a file under ${maxSizeMB}MB`,
      };
    }

    return { isValid: true };
  }
}

export const imageOptimizationService = new ImageOptimizationService();
export default imageOptimizationService;