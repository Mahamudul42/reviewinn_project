/**
 * Image Configuration
 * Configure image optimization and upload settings
 */

export const IMAGE_CONFIG = {
  // ImgBB API Configuration
  IMGBB: {
    // Separate API keys for different use cases
    API_KEY_ENTITY: import.meta.env.VITE_IMGBB_API_KEY_ENTITY || import.meta.env.VITE_IMGBB_API_KEY || 'your-imgbb-api-key-here',
    API_KEY_USER: import.meta.env.VITE_IMGBB_API_KEY_USER || import.meta.env.VITE_IMGBB_API_KEY || 'your-imgbb-api-key-here',
    API_KEY_REVIEW: import.meta.env.VITE_IMGBB_API_KEY_REVIEW || import.meta.env.VITE_IMGBB_API_KEY || 'your-imgbb-api-key-here',
    
    // Fallback to single key for backward compatibility
    API_KEY: import.meta.env.VITE_IMGBB_API_KEY || 'your-imgbb-api-key-here',
    
    UPLOAD_URL: 'https://api.imgbb.com/1/upload',
    EXPIRATION: '15552000', // 6 months in seconds
  },

  // Image Optimization Settings
  OPTIMIZATION: {
    MAX_WIDTH: 800,
    MAX_HEIGHT: 600,
    QUALITY: 75,
    FORMAT: 'webp' as const,
    MAINTAIN_ASPECT_RATIO: true,
  },

  // File Validation
  VALIDATION: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  },

  // Responsive Image Sizes
  RESPONSIVE_SIZES: {
    THUMBNAIL: 150,
    SMALL: 300,
    MEDIUM: 500,
    LARGE: 800,
  },

  // Display Settings
  DISPLAY: {
    PREVIEW_SIZE: 96, // 24 * 4 (w-24 h-24 in Tailwind)
    ENTITY_CARD_SIZE: 200,
    DETAIL_PAGE_SIZE: 400,
  },
} as const;

export default IMAGE_CONFIG;