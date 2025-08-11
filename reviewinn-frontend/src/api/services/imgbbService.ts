/**
 * ImgBB Image Upload Service
 * Free image hosting service for unlimited uploads
 * Perfect for review images (50KB-500KB range)
 */

interface ImgBBResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: number;
    height: number;
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
    delete_url: string;
  };
  success: boolean;
  status: number;
}

// Upload type enum
export enum UploadType {
  ENTITY = 'entity',
  USER = 'user',
  REVIEW = 'review'
}

class ImgBBService {
  private readonly API_KEY_ENTITY = import.meta.env.VITE_IMGBB_API_KEY_ENTITY || import.meta.env.VITE_IMGBB_API_KEY
  private readonly API_KEY_USER = import.meta.env.VITE_IMGBB_API_KEY_USER || import.meta.env.VITE_IMGBB_API_KEY
  private readonly API_KEY_REVIEW = import.meta.env.VITE_IMGBB_API_KEY_REVIEW || import.meta.env.VITE_IMGBB_API_KEY
  private readonly API_KEY = import.meta.env.VITE_IMGBB_API_KEY
  private readonly BASE_URL = 'https://api.imgbb.com/1/upload';

  constructor() {
    if (!this.API_KEY && !this.API_KEY_ENTITY && !this.API_KEY_USER && !this.API_KEY_REVIEW) {
      console.warn('ImgBB API key not found. Please add VITE_IMGBB_API_KEY or specific keys to your .env file.');
    }
  }

  /**
   * Get the appropriate API key for the upload type
   */
  private getApiKey(uploadType?: UploadType): string {
    switch (uploadType) {
      case UploadType.ENTITY:
        return this.API_KEY_ENTITY || this.API_KEY;
      case UploadType.USER:
        return this.API_KEY_USER || this.API_KEY;
      case UploadType.REVIEW:
        return this.API_KEY_REVIEW || this.API_KEY;
      default:
        return this.API_KEY;
    }
  }

  /**
   * Upload image file to ImgBB
   * @param file - Image file to upload
   * @param name - Optional name for the image
   * @param uploadType - Type of upload (entity, user, review)
   * @returns Promise<string> - Returns the direct image URL
   */
  async uploadImage(file: File, name?: string, uploadType?: UploadType): Promise<string> {
    const apiKey = this.getApiKey(uploadType);
    
    if (!apiKey) {
      throw new Error('ImgBB API key not configured. Please add VITE_IMGBB_API_KEY or specific keys to your .env file.');
    }

    // Validate file size (max 32MB for ImgBB, but we'll be more restrictive)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('Image file size must be less than 5MB');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only JPEG, PNG, GIF, and WebP images are supported');
    }

    try {
      const formData = new FormData();
      formData.append('key', apiKey);
      formData.append('image', file);
      
      if (name) {
        formData.append('name', name);
      }

      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result: ImgBBResponse = await response.json();

      if (!result.success) {
        throw new Error('Image upload failed');
      }

      // Return the direct image URL
      return result.data.display_url;
    } catch (error) {
      console.error('ImgBB upload error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to upload image');
    }
  }

  /**
   * Upload multiple images concurrently
   * @param files - Array of image files to upload
   * @param onProgress - Optional progress callback
   * @param uploadType - Type of upload (entity, user, review)
   * @returns Promise<string[]> - Returns array of image URLs
   */
  async uploadMultipleImages(
    files: File[], 
    onProgress?: (completed: number, total: number) => void,
    uploadType?: UploadType
  ): Promise<string[]> {
    const apiKey = this.getApiKey(uploadType);
    
    if (!apiKey) {
      throw new Error('ImgBB API key not configured. Please add VITE_IMGBB_API_KEY or specific keys to your .env file.');
    }

    const uploadPromises = files.map(async (file, index) => {
      try {
        const url = await this.uploadImage(file, undefined, uploadType);
        onProgress?.(index + 1, files.length);
        return url;
      } catch (error) {
        console.error(`Failed to upload file ${file.name}:`, error);
        throw error;
      }
    });

    return Promise.all(uploadPromises);
  }

  /**
   * Validate image file before upload
   * @param file - File to validate
   * @returns Validation result
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Only JPEG, PNG, GIF, and WebP images are supported' };
    }

    return { valid: true };
  }

  /**
   * Check if ImgBB service is available
   * @returns boolean
   */
  isAvailable(): boolean {
    return !!(this.API_KEY || this.API_KEY_ENTITY || this.API_KEY_USER || this.API_KEY_REVIEW);
  }
}

export const imgbbService = new ImgBBService();
export default imgbbService;