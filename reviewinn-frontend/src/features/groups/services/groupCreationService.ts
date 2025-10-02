/**
 * Group Creation Service
 * Handles group creation with image upload
 */

import { groupsApiService } from './groupsApiService';
import { imageUploadService } from './imageUploadService';
import { getCategoryMapping } from '../utils/groupUtils';

export interface GroupFormData {
  name: string;
  description: string;
  category: string;
  privacy: 'public' | 'private';
  rules: string;
  profileImage: File | null;
  coverImage: File | null;
  profileImageUrl: string | null;
  coverImageUrl: string | null;
}

export const createGroup = async (formData: GroupFormData): Promise<any> => {
  try {
    console.log('🔄 Creating group:', formData.name);
    
    // Upload images if they exist
    let avatarUrl = formData.profileImageUrl;
    let coverImageUrl = formData.coverImageUrl;
    
    if (formData.profileImage) {
      const avatarResponse = await imageUploadService.uploadImage(formData.profileImage, 'profile');
      avatarUrl = avatarResponse.url;
    }
    
    if (formData.coverImage) {
      const coverResponse = await imageUploadService.uploadImage(formData.coverImage, 'cover');
      coverImageUrl = coverResponse.url;
    }

    // Map category names to IDs
    const categoryMapping = getCategoryMapping();

    const groupData = {
      name: formData.name,
      description: formData.description,
      group_type: 'interest_based',
      visibility: formData.privacy,
      avatar_url: avatarUrl,
      cover_image_url: coverImageUrl,
      rules_and_guidelines: formData.rules,
      category_ids: formData.category ? [categoryMapping[formData.category] || 6] : [6],
      allow_public_reviews: true,
      require_approval_for_reviews: false,
      max_members: 1000
    };

    return await groupsApiService.createGroup(groupData);
  } catch (error) {
    console.error('❌ Error creating group:', error);
    throw error;
  }
};