// Pexels image service for entity avatars and visuals

// Static image URLs for consistent display
const STATIC_IMAGES = {
  person: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
  company: 'https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
  location: 'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
  product: 'https://images.pexels.com/photos/4158/apple-iphone-smartphone-desk.jpg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop'
};

// Generate consistent images based on entity type
export const getEntityImage = (entity: any): string => {
  const { category } = entity;
  
  switch (category) {
    case 'person_professional':
      return STATIC_IMAGES.person;
      
    case 'company_institute':
      return STATIC_IMAGES.company;
      
    case 'location_place':
      return STATIC_IMAGES.location;
      
    case 'product':
      return STATIC_IMAGES.product;
      
    default:
      return STATIC_IMAGES.company; // Default fallback
  }
};

// Generate consistent avatar for a person (same image for all affiliations)
export const getPersonAvatar = (): string => {
  // Always return the same person image for consistency across affiliations
  return STATIC_IMAGES.person;
};

// Get themed images for different entity subcategories (using static images)
export const getSubcategoryImage = (category: string): string => {
  // Map subcategories to main categories for consistent theming
  switch (category) {
    case 'person_professional':
      return STATIC_IMAGES.person;
    case 'company_institute':
      return STATIC_IMAGES.company;
    case 'location_place':
      return STATIC_IMAGES.location;
    case 'product':
      return STATIC_IMAGES.product;
    default:
      return STATIC_IMAGES.company;
  }
};

// Fallback image URLs for when Pexels is not available
export const getFallbackImage = (category: string, size: string = '300x200'): string => {
  const [width, height] = size.split('x');
  
  const fallbackColors: Record<string, string> = {
    'person_professional': '4F46E5', // Indigo
    'company_institute': '059669',   // Emerald
    'location_place': 'DC2626',      // Red
    'product': 'C2410C'              // Orange
  };
  
  const color = fallbackColors[category] || '6B7280';
  return `https://via.placeholder.com/${width}x${height}/${color}/FFFFFF?text=${category}`;
};

// Image upload using ImgBB service
export const uploadImage = async (formData: FormData): Promise<string> => {
  // This function is deprecated - use the dedicated ImgBB service instead
  // Import and use: import { imgbbService, UploadType } from '../services/imgbbService'
  
  const file = formData.get('image') as File;
  if (file) {
    // For development/demo, create a local object URL for preview
    console.warn('Using mock upload - replace with imgbbService.uploadImage() in production');
    return URL.createObjectURL(file);
  }
  
  // Fallback to a default image
  return STATIC_IMAGES.person;
};

// Image service object for easier importing
export const imageService = {
  uploadImage,
  getEntityImage,
  getPersonAvatar,
  getSubcategoryImage,
  getFallbackImage,
};
