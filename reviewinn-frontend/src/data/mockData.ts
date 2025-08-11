/**
 * Mock data for the Review Application
 * This file contains sample data for testing and development purposes
 */

import type { Review, Entity, User } from '../types';
import { EntityCategory } from '../types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=3b82f6&color=ffffff',
    level: 5,
    points: 1250,
    badges: [
      { id: 'first_review', name: 'First Review', description: 'Wrote your first review', icon: 'award' },
      { id: 'week_warrior', name: 'Week Warrior', description: 'Active for 7 consecutive days', icon: 'shield' },
      { id: 'helpful_reviewer', name: 'Helpful Reviewer', description: 'Received 10+ helpful votes', icon: 'heart' }
    ],
    createdAt: '2023-01-15',
    bio: 'Software engineer passionate about technology and education',
    username: 'johndoe',
    isVerified: true,
    preferences: {
      notifications: { email: true, reviewReplies: true },
      privacy: { profileVisible: true, showContexts: true }
    },
    stats: {
      totalReviews: 23,
      totalHelpfulVotes: 156,
      averageRatingGiven: 4.2,
      entitiesReviewed: 15,
      streakDays: 7
    },
    following: ['2', '3'],
    followers: ['4', '5']
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=8b5cf6&color=ffffff',
    level: 8,
    points: 3200,
    badges: [
      { id: 'top_reviewer', name: 'Top Reviewer', description: 'Among top 10% of reviewers', icon: 'crown' },
      { id: 'month_warrior', name: 'Month Warrior', description: 'Active for 30 consecutive days', icon: 'shield' },
      { id: 'verified_expert', name: 'Verified Expert', description: 'Verified professional status', icon: 'check-circle' }
    ],
    createdAt: '2022-11-20',
    bio: 'Product manager with 10+ years of experience',
    username: 'janesmith',
    isVerified: true,
    preferences: {
      notifications: { email: true, reviewReplies: true },
      privacy: { profileVisible: true, showContexts: true }
    },
    stats: {
      totalReviews: 45,
      totalHelpfulVotes: 289,
      averageRatingGiven: 4.5,
      entitiesReviewed: 28,
      streakDays: 12
    },
    following: ['1', '3'],
    followers: ['1', '4', '5']
  },
  {
    id: '3',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    avatar: 'https://ui-avatars.com/api/?name=Bob+Wilson&background=10b981&color=ffffff',
    level: 3,
    points: 450,
    badges: [
      { id: 'first_review', name: 'First Review', description: 'Wrote your first review', icon: 'award' }
    ],
    createdAt: '2023-05-12',
    bio: 'Student exploring different career paths',
    username: 'bobwilson',
    isVerified: false,
    preferences: {
      notifications: { email: true, reviewReplies: false },
      privacy: { profileVisible: true, showContexts: false }
    },
    stats: {
      totalReviews: 8,
      totalHelpfulVotes: 23,
      averageRatingGiven: 3.8,
      entitiesReviewed: 6,
      streakDays: 3
    },
    following: ['1'],
    followers: ['2']
  }
];

// Mock Entities
export const mockEntities: Entity[] = [
  {
    id: '1',
    name: 'Dr. Sarah Chen',
    description: 'Associate Professor of Computer Science at Stanford University',
    category: EntityCategory.PROFESSIONALS,
    subcategory: 'academic_researcher',
    avatar: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=8b5cf6&color=ffffff',
    isVerified: true,
    context: {
      role: 'Associate Professor',
      organization: 'Stanford University',
      location: 'Stanford, CA',
      isCurrent: true
    },
    relatedEntityIds: ['2'],
    averageRating: 4.7,
    reviewCount: 23,
    createdAt: '2023-01-15',
    updatedAt: '2024-01-10'
  },
  {
    id: '2',
    name: 'Stanford University',
    description: 'Private research university in Stanford, California',
    category: EntityCategory.COMPANIES,
    subcategory: 'university',
    avatar: 'https://ui-avatars.com/api/?name=Stanford+University&background=3b82f6&color=ffffff',
    isVerified: true,
    context: {
      role: 'Student',
      organization: 'Stanford University',
      location: 'Stanford, CA',
      isCurrent: true
    },
    relatedEntityIds: ['1', '3'],
    averageRating: 4.5,
    reviewCount: 45,
    createdAt: '2022-11-20',
    updatedAt: '2024-01-08'
  },
  {
    id: '3',
    name: 'San Francisco',
    description: 'Major city in Northern California',
    category: EntityCategory.PLACES,
    subcategory: 'city',
    avatar: 'https://ui-avatars.com/api/?name=San+Francisco&background=10b981&color=ffffff',
    isVerified: true,
    context: {
      role: 'Resident',
      organization: 'City of San Francisco',
      location: 'San Francisco, CA',
      isCurrent: true
    },
    relatedEntityIds: ['2'],
    averageRating: 4.2,
    reviewCount: 78,
    createdAt: '2023-05-12',
    updatedAt: '2024-01-05'
  },
  {
    id: '4',
    name: 'Tesla Model Y',
    description: 'Electric compact SUV manufactured by Tesla',
    category: EntityCategory.PRODUCTS,
    subcategory: 'electric_vehicle',
    avatar: 'https://ui-avatars.com/api/?name=Tesla+Model+Y&background=ef4444&color=ffffff',
    isVerified: true,
    context: {
      role: 'Owner',
      organization: 'Tesla Inc.',
      location: 'Global',
      isCurrent: true
    },
    relatedEntityIds: ['5'],
    averageRating: 4.3,
    reviewCount: 156,
    createdAt: '2023-10-30',
    updatedAt: '2024-01-12'
  },
  {
    id: '5',
    name: 'Google LLC',
    description: 'Multinational technology company',
    category: EntityCategory.COMPANIES,
    subcategory: 'tech_company',
    avatar: 'https://ui-avatars.com/api/?name=Google+LLC&background=4285f4&color=ffffff',
    isVerified: true,
    context: {
      role: 'Software Engineer',
      organization: 'Google LLC',
      location: 'Mountain View, CA',
      isCurrent: true
    },
    relatedEntityIds: ['3'],
    averageRating: 4.1,
    reviewCount: 67,
    createdAt: '2022-12-05',
    updatedAt: '2024-01-09'
  }
];

// Mock Reviews
export const mockReviews: Review[] = [
  {
    id: '1',
    entityId: '1',
    reviewerId: '1',
    reviewerName: 'John Doe',
    reviewerAvatar: 'https://ui-avatars.com/api/?name=John+Doe&background=3b82f6&color=ffffff',
    category: EntityCategory.PROFESSIONALS,
    title: 'Exceptional Professor - Highly Recommended',
    content: 'Dr. Rodriguez is absolutely brilliant! Her Machine Learning course was challenging but incredibly rewarding. She explains complex concepts clearly and is always available during office hours. The assignments were practical and really helped solidify the theoretical knowledge. Would definitely recommend her courses to anyone interested in AI.',
    overallRating: 5,
    criteria: {
      teaching: 5,
      accessibility: 4,
      expertise: 5,
      clarity: 5
    },
    ratings: {
      teaching: 5,
      accessibility: 4,
      expertise: 5,
      clarity: 5
    },
    pros: ['Clear explanations', 'Available during office hours', 'Practical assignments'],
    cons: ['Can be challenging for beginners'],
    isAnonymous: false,
    isVerified: true,
    helpfulCount: 23,
    reactions: {
      like: 15,
      insightful: 8
    },
    createdAt: '2024-01-10',
    updatedAt: '2024-01-10'
  },
  {
    id: '2',
    entityId: '2',
    reviewerId: '2',
    reviewerName: 'Sarah Chen',
    reviewerAvatar: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=8b5cf6&color=ffffff',
    category: EntityCategory.COMPANIES,
    title: 'Great startup culture but work-life balance needs improvement',
    content: 'TechStart has an amazing team and the product vision is exciting. The office environment is modern and collaborative. However, the work-life balance can be challenging with tight deadlines and high expectations. Management is supportive but sometimes unrealistic about timelines. Great place for learning and growth if you can handle the pace.',
    overallRating: 4,
    criteria: {
      culture: 4,
      management: 3,
      workLifeBalance: 2,
      compensation: 4,
      growth: 5
    },
    ratings: {
      culture: 4,
      management: 3,
      workLifeBalance: 2,
      compensation: 4,
      growth: 5
    },
    pros: ['Great team', 'Modern office', 'Learning opportunities'],
    cons: ['Poor work-life balance', 'Unrealistic deadlines'],
    isAnonymous: false,
    isVerified: true,
    helpfulCount: 45,
    reactions: {
      like: 28,
      insightful: 15
    },
    createdAt: '2024-01-08',
    updatedAt: '2024-01-08'
  },
  {
    id: '3',
    entityId: '3',
    reviewerId: '3',
    reviewerName: 'Mike Johnson',
    reviewerAvatar: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=10b981&color=ffffff',
    category: EntityCategory.PLACES,
    title: 'Perfect spot for coffee meetings',
    content: 'Blue Bottle in Mission District is my go-to spot for coffee meetings. The single-origin pour-overs are consistently excellent, and the minimalist interior creates a calm atmosphere perfect for conversations. Can get busy during peak hours, but the quality is always worth the wait. Prices are on the higher side but justified by the quality.',
    overallRating: 5,
    criteria: {
      ambiance: 5,
      service: 4,
      quality: 5,
      value: 3
    },
    ratings: {
      ambiance: 5,
      service: 4,
      quality: 5,
      value: 3
    },
    pros: ['Excellent coffee', 'Great atmosphere', 'Perfect for meetings'],
    cons: ['Expensive', 'Gets crowded'],
    isAnonymous: false,
    isVerified: false,
    helpfulCount: 34,
    reactions: {
      like: 42,
      insightful: 6
    },
    createdAt: '2024-01-05',
    updatedAt: '2024-01-05'
  }
];

// Mock Comments for Reviews
export const mockComments = [
  {
    id: '1',
    reviewId: '1',
    userId: '2',
    username: 'sarah_chen',
    avatar: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=8b5cf6&color=ffffff',
    content: 'Thanks for the detailed review! I\'m considering her ML course next semester.',
    createdAt: '2024-01-11',
    likes: 3
  },
  {
    id: '2',
    reviewId: '2',
    userId: '1',
    username: 'john_doe',
    avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=3b82f6&color=ffffff',
    content: 'This matches my experience at similar startups. The growth opportunities definitely make up for the intense pace.',
    createdAt: '2024-01-09',
    likes: 8
  }
];

// Export all mock data as default
export default {
  users: mockUsers,
  entities: mockEntities,
  reviews: mockReviews,
  comments: mockComments
};
