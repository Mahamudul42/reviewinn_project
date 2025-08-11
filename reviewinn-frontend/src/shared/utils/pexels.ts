import { EntityCategory } from '../../types';

// Pexels image URLs for different categories
const PEXELS_IMAGES: Record<EntityCategory, string[]> = {
  [EntityCategory.PROFESSIONALS]: [
    'https://images.pexels.com/photos/1138903/pexels-photo-1138903.jpeg',
    'https://images.pexels.com/photos/1138904/pexels-photo-1138904.jpeg',
    'https://images.pexels.com/photos/1138905/pexels-photo-1138905.jpeg',
  ],
  [EntityCategory.COMPANIES]: [
    'https://images.pexels.com/photos/1138906/pexels-photo-1138906.jpeg',
    'https://images.pexels.com/photos/1138907/pexels-photo-1138907.jpeg',
    'https://images.pexels.com/photos/1138908/pexels-photo-1138908.jpeg',
  ],
  [EntityCategory.PLACES]: [
    'https://images.pexels.com/photos/1138909/pexels-photo-1138909.jpeg',
    'https://images.pexels.com/photos/1138910/pexels-photo-1138910.jpeg',
    'https://images.pexels.com/photos/1138911/pexels-photo-1138911.jpeg',
  ],
  [EntityCategory.PRODUCTS]: [
    'https://images.pexels.com/photos/1138912/pexels-photo-1138912.jpeg',
    'https://images.pexels.com/photos/1138913/pexels-photo-1138913.jpeg',
    'https://images.pexels.com/photos/1138914/pexels-photo-1138914.jpeg',
  ]
};

// Fallback images for any category
const FALLBACK_IMAGES = [
  'https://images.pexels.com/photos/3376790/pexels-photo-3376790.jpeg',
  'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg',
  'https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg'
];

/**
 * Get a random Pexels image URL for a specific category
 */
export const getRandomPexelsImage = (category: EntityCategory): string => {
  const categoryImages = PEXELS_IMAGES[category] || FALLBACK_IMAGES;
  const randomIndex = Math.floor(Math.random() * categoryImages.length);
  return categoryImages[randomIndex];
};

/**
 * Get a random Pexels image URL for any category
 */
export const getRandomImage = (): string => {
  const randomIndex = Math.floor(Math.random() * FALLBACK_IMAGES.length);
  return FALLBACK_IMAGES[randomIndex];
};

/**
 * Get a specific Pexels image by index for a category
 */
export const getPexelsImage = (category: EntityCategory, index: number): string => {
  const categoryImages = PEXELS_IMAGES[category] || FALLBACK_IMAGES;
  return categoryImages[index % categoryImages.length];
}; 