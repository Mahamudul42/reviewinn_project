import type { Entity, Review, SearchResult, SearchFilters } from '../types';
import { EntityCategory } from '../types';

// Mock data for development
export const mockEntities: Entity[] = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson - Professor at MIT',
    category: EntityCategory.PROFESSIONALS,
    subcategory: 'educator',
    description: 'Computer Science Professor specializing in Machine Learning',
    context: {
      role: 'Professor',
      organization: 'MIT',
      department: 'Computer Science',
      location: 'Cambridge, MA'
    },
    relatedEntityIds: ['1b'], // Could link to "Dr. Sarah Johnson - Consultant at TechCorp"
    averageRating: 4.5,
    reviewCount: 23,
    createdAt: '2023-01-15T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
    imageUrl: 'https://images.pexels.com/photos/3376790/pexels-photo-3376790.jpeg'
  },
  {
    id: '1b',
    name: 'Dr. Sarah Johnson - Consultant at TechCorp',
    category: EntityCategory.PROFESSIONALS,
    subcategory: 'consultant',
    description: 'AI/ML Consultant for TechCorp',
    context: {
      role: 'Senior AI Consultant',
      organization: 'TechCorp Solutions',
      department: 'AI Research Division',
      location: 'San Francisco, CA'
    },
    relatedEntityIds: ['1'], // Links back to professor role
    averageRating: 4.3,
    reviewCount: 8,
    createdAt: '2023-01-15T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
    imageUrl: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg'
  },
  {
    id: '2',
    name: 'Google Inc.',
    category: EntityCategory.COMPANIES,
    subcategory: 'tech_company',
    description: 'Multinational technology company',
    averageRating: 4.2,
    reviewCount: 1250,
    createdAt: '2023-01-20T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
    imageUrl: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg'
  },
  {
    id: '3',
    name: 'iPhone 15 Pro',
    category: EntityCategory.PRODUCTS,
    subcategory: 'software',
    description: 'Latest iPhone with advanced camera system',
    averageRating: 4.7,
    reviewCount: 892,
    createdAt: '2023-09-12T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
    imageUrl: 'https://images.pexels.com/photos/3376790/pexels-photo-3376790.jpeg'
  },
  {
    id: '4',
    name: 'Central Park',
    category: EntityCategory.PLACES,
    subcategory: 'consulting',
    description: 'Iconic urban park in Manhattan, New York City',
    context: {
      role: 'Public Park',
      organization: 'NYC Parks Department',
      location: 'Manhattan, NY'
    },
    averageRating: 4.6,
    reviewCount: 500,
    createdAt: '2023-02-10T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
    imageUrl: 'https://images.pexels.com/photos/3376790/pexels-photo-3376790.jpeg'
  },
  {
    id: '5',
    name: 'The Shawshank Redemption',
    category: EntityCategory.PRODUCTS,
    subcategory: 'software',
    description: 'Classic drama film about hope and friendship',
    averageRating: 4.8,
    reviewCount: 2500,
    createdAt: '2023-03-15T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
    imageUrl: 'https://images.pexels.com/photos/3376790/pexels-photo-3376790.jpeg'
  },
  {
    id: '6',
    name: 'Dr. Michael Chen - Cardiologist at Stanford Hospital',
    category: EntityCategory.PROFESSIONALS,
    subcategory: 'doctor',
    description: 'Interventional Cardiologist with 15+ years experience',
    context: {
      role: 'Interventional Cardiologist',
      organization: 'Stanford Hospital',
      department: 'Cardiology',
      location: 'Stanford, CA'
    },
    averageRating: 4.7,
    reviewCount: 45,
    createdAt: '2023-04-12T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
    imageUrl: 'https://images.pexels.com/photos/3376790/pexels-photo-3376790.jpeg'
  },
  {
    id: '7',
    name: 'Professor Lisa Wang - Data Science at Berkeley',
    category: EntityCategory.PROFESSIONALS,
    subcategory: 'educator',
    description: 'Associate Professor of Data Science and Statistics',
    context: {
      role: 'Associate Professor',
      organization: 'UC Berkeley',
      department: 'Statistics',
      location: 'Berkeley, CA'
    },
    averageRating: 4.4,
    reviewCount: 32,
    createdAt: '2023-05-20T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z'
  },
  {
    id: '8',
    name: 'Microsoft Corporation',
    category: EntityCategory.COMPANIES,
    subcategory: 'tech_company',
    description: 'Technology corporation specializing in software and cloud services',
    averageRating: 4.1,
    reviewCount: 980,
    createdAt: '2023-01-25T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z'
  },
  {
    id: '9',
    name: 'Tesla Model Y',
    category: EntityCategory.PRODUCTS,
    subcategory: 'software',
    description: 'Electric compact luxury crossover SUV',
    averageRating: 4.3,
    reviewCount: 567,
    createdAt: '2023-06-10T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z'
  },
  {
    id: '10',
    name: 'Starbucks Coffee - Downtown Seattle',
    category: EntityCategory.PLACES,
    subcategory: 'consulting',
    description: 'Original Starbucks store at Pike Place Market',
    context: {
      role: 'Coffee Shop',
      organization: 'Starbucks Corporation',
      location: 'Seattle, WA'
    },
    averageRating: 4.2,
    reviewCount: 234,
    createdAt: '2023-07-08T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z'
  },
  {
    id: '11',
    name: 'Netflix',
    category: EntityCategory.PRODUCTS,
    subcategory: 'software',
    description: 'Video streaming service with original content',
    averageRating: 4.0,
    reviewCount: 1890,
    createdAt: '2023-08-15T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z'
  },
  {
    id: '12',
    name: 'Harvard University',
    category: EntityCategory.COMPANIES,
    subcategory: 'tech_company',
    description: 'Private Ivy League research university in Cambridge, Massachusetts',
    averageRating: 4.6,
    reviewCount: 678,
    createdAt: '2023-02-28T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z'
  },
  {
    id: '13',
    name: 'Dr. Emily Rodriguez - Dermatologist at Mayo Clinic',
    category: EntityCategory.PROFESSIONALS,
    subcategory: 'doctor',
    description: 'Board-certified dermatologist specializing in skin cancer treatment',
    context: {
      role: 'Senior Dermatologist',
      organization: 'Mayo Clinic',
      department: 'Dermatology',
      location: 'Rochester, MN',
      startDate: new Date('2018-03-01'),
      isCurrent: true
    },
    averageRating: 4.8,
    reviewCount: 156,
    createdAt: new Date('2023-03-20').toISOString(),
    updatedAt: new Date('2024-12-01').toISOString(),
    imageUrl: 'https://images.pexels.com/photos/3376790/pexels-photo-3376790.jpeg'
  },
  {
    id: '14',
    name: 'Prof. David Kim - Economics at Stanford',
    category: EntityCategory.PROFESSIONALS,
    subcategory: 'educator',
    description: 'Economics professor known for behavioral economics research',
    context: {
      role: 'Professor',
      organization: 'Stanford University',
      department: 'Economics',
      location: 'Stanford, CA',
      startDate: new Date('2012-09-01'),
      isCurrent: true
    },
    averageRating: 4.4,
    reviewCount: 89,
    createdAt: new Date('2023-04-12').toISOString(),
    updatedAt: new Date('2024-12-01').toISOString()
  },
  {
    id: '15',
    name: 'Microsoft',
    category: EntityCategory.COMPANIES,
    subcategory: 'tech_company',
    description: 'Multinational technology corporation',
    averageRating: 4.3,
    reviewCount: 2100,
    createdAt: new Date('2023-01-10').toISOString(),
    updatedAt: new Date('2024-12-01').toISOString(),
    imageUrl: 'https://images.pexels.com/photos/3376790/pexels-photo-3376790.jpeg'
  },
  {
    id: '16',
    name: 'Blue Bottle Coffee - Mission District',
    category: EntityCategory.PLACES,
    subcategory: 'coffee_shop',
    description: 'Specialty coffee shop known for single-origin pour-overs and minimalist interior design',
    context: {
      role: 'Coffee Shop',
      organization: 'Blue Bottle Coffee',
      location: 'Mission District, San Francisco, CA'
    },
    averageRating: 4.5,
    reviewCount: 89,
    createdAt: new Date('2023-03-15').toISOString(),
    updatedAt: new Date('2024-12-01').toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600&h=400&fit=crop'
  },
  {
    id: '17',
    name: 'MacBook Pro M3',
    category: EntityCategory.PRODUCTS,
    subcategory: 'software',
    description: 'Professional laptop with M3 chip for creative professionals',
    averageRating: 4.6,
    reviewCount: 445,
    createdAt: new Date('2023-10-30').toISOString(),
    updatedAt: new Date('2024-12-01').toISOString(),
    imageUrl: 'https://images.pexels.com/photos/3376790/pexels-photo-3376790.jpeg'
  },
  {
    id: '17',
    name: 'Golden Gate Park',
    category: EntityCategory.PLACES,
    subcategory: 'consulting',
    description: 'Large urban park in San Francisco with diverse attractions',
    context: {
      role: 'Public Park',
      organization: 'San Francisco Recreation and Parks',
      location: 'San Francisco, CA',
      isCurrent: true
    },
    averageRating: 4.5,
    reviewCount: 320,
    createdAt: new Date('2023-05-22').toISOString(),
    updatedAt: new Date('2024-12-01').toISOString(),
    imageUrl: 'https://images.pexels.com/photos/3376790/pexels-photo-3376790.jpeg'
  },
  {
    id: '18',
    name: 'Adobe Photoshop',
    category: EntityCategory.PRODUCTS,
    subcategory: 'software',
    description: 'Professional photo editing and graphic design software',
    averageRating: 4.2,
    reviewCount: 1567,
    createdAt: new Date('2023-02-14').toISOString(),
    updatedAt: new Date('2024-12-01').toISOString(),
    imageUrl: 'https://images.pexels.com/photos/3376790/pexels-photo-3376790.jpeg'
  },
  {
    id: '19',
    name: 'Dr. James Wilson - Orthopedic Surgeon at Johns Hopkins',
    category: EntityCategory.PROFESSIONALS,
    subcategory: 'doctor',
    description: 'Orthopedic surgeon specializing in sports medicine',
    context: {
      role: 'Orthopedic Surgeon',
      organization: 'Johns Hopkins Hospital',
      department: 'Orthopedics',
      location: 'Baltimore, MD',
      startDate: new Date('2016-07-01'),
      isCurrent: true
    },
    averageRating: 4.7,
    reviewCount: 203,
    createdAt: new Date('2023-06-18').toISOString(),
    updatedAt: new Date('2024-12-01').toISOString(),
    imageUrl: 'https://images.pexels.com/photos/3376790/pexels-photo-3376790.jpeg'
  },
  {
    id: '20',
    name: 'Prof. Lisa Chen - Computer Science at Berkeley',
    category: EntityCategory.PROFESSIONALS,
    subcategory: 'educator',
    description: 'Computer Science professor specializing in cybersecurity',
    context: {
      role: 'Associate Professor',
      organization: 'UC Berkeley',
      department: 'Computer Science',
      location: 'Berkeley, CA',
      startDate: new Date('2019-08-15'),
      isCurrent: true
    },
    averageRating: 4.6,
    reviewCount: 67,
    createdAt: new Date('2023-07-05').toISOString(),
    updatedAt: new Date('2024-12-01').toISOString(),
    imageUrl: 'https://images.pexels.com/photos/3376790/pexels-photo-3376790.jpeg'
  },
  {
    id: '21',
    name: 'Spotify',
    category: EntityCategory.PRODUCTS,
    subcategory: 'software',
    description: 'Music streaming platform with personalized playlists',
    averageRating: 4.4,
    reviewCount: 2890,
    createdAt: new Date('2023-03-08').toISOString(),
    updatedAt: new Date('2024-12-01').toISOString(),
    imageUrl: 'https://images.pexels.com/photos/3376790/pexels-photo-3376790.jpeg'
  },
  {
    id: '22',
    name: 'Amazon',
    category: EntityCategory.COMPANIES,
    subcategory: 'tech_company',
    description: 'Multinational technology and e-commerce company',
    averageRating: 3.8,
    reviewCount: 3200,
    createdAt: new Date('2023-01-25').toISOString(),
    updatedAt: new Date('2024-12-01').toISOString(),
    imageUrl: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg'
  },
  {
    id: '23',
    name: 'The Metropolitan Museum of Art',
    category: EntityCategory.PLACES,
    subcategory: 'consulting',
    description: 'World-renowned art museum in New York City',
    context: {
      role: 'Art Museum',
      organization: 'The Metropolitan Museum of Art',
      location: 'New York, NY',
      isCurrent: true
    },
    averageRating: 4.7,
    reviewCount: 856,
    createdAt: new Date('2023-04-30').toISOString(),
    updatedAt: new Date('2024-12-01').toISOString(),
    imageUrl: 'https://images.pexels.com/photos/3376790/pexels-photo-3376790.jpeg'
  },
  {
    id: '24',
    name: 'Tesla Model Y',
    category: EntityCategory.PRODUCTS,
    subcategory: 'software',
    description: 'Electric compact luxury crossover SUV',
    averageRating: 4.4,
    reviewCount: 734,
    createdAt: new Date('2023-08-22').toISOString(),
    updatedAt: new Date('2024-12-01').toISOString(),
    imageUrl: 'https://images.pexels.com/photos/3376790/pexels-photo-3376790.jpeg'
  },
  {
    id: '25',
    name: 'Dr. Maria Gonzalez - Pediatrician at Children\'s Hospital',
    category: EntityCategory.PROFESSIONALS,
    subcategory: 'doctor',
    description: 'Board-certified pediatrician with 15 years of experience',
    context: {
      role: 'Senior Pediatrician',
      organization: 'Children\'s Hospital of Philadelphia',
      department: 'Pediatrics',
      location: 'Philadelphia, PA',
      startDate: new Date('2009-06-01'),
      isCurrent: true
    },
    averageRating: 4.9,
    reviewCount: 298,
    createdAt: new Date('2023-09-10').toISOString(),
    updatedAt: new Date('2024-12-01').toISOString(),
    imageUrl: 'https://images.pexels.com/photos/3376790/pexels-photo-3376790.jpeg'
  },
  // Additional entities for infinite scroll
  ...Array.from({ length: 50 }, (_, i) => ({
    id: `entity-${26 + i}`,
    name: `Sample Entity ${26 + i}`,
    category: [EntityCategory.PROFESSIONALS, EntityCategory.COMPANIES, EntityCategory.PLACES, EntityCategory.PRODUCTS][i % 4],
    subcategory: ['professional', 'company', 'location', 'product'][i % 4],
    description: `This is a sample entity for testing infinite scroll functionality. Entity number ${26 + i}.`,
    averageRating: 3.5 + Math.random() * 1.5,
    reviewCount: Math.floor(Math.random() * 100) + 5,
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  } as Entity))
];

export const mockReviews: Review[] = [
  {
    id: 'r1',
    entityId: '1',
    reviewerId: 'u1',
    reviewerName: 'John Smith',
    category: EntityCategory.PROFESSIONALS,
    title: 'Excellent Teaching Quality',
    content: 'Excellent professor! Very knowledgeable and always willing to help students. The course material was well-organized and the professor made complex topics easy to understand.',
    overallRating: 4.5,
    criteria: {
      teaching_quality: 5,
      availability: 4,
      expertise: 5,
      communication: 4
    },
    ratings: {
      teaching_quality: 5,
      availability: 4,
      expertise: 5,
      communication: 4
    },
    pros: [
      'Clear explanations',
      'Always available for questions',
      'Well-structured course material'
    ],
    cons: [
      'Sometimes moves too fast through material'
    ],
    isAnonymous: false,
    isVerified: true,
    helpfulCount: 12,
    createdAt: new Date('2024-11-15').toISOString(),
    updatedAt: new Date('2024-11-15').toISOString()
  },
  {
    id: 'r2',
    entityId: '1b',
    reviewerId: 'u2',
    reviewerName: 'Jane Doe',
    category: EntityCategory.PROFESSIONALS,
    title: 'Great AI Consultant',
    content: 'Excellent consultant with deep AI knowledge. Helped our team implement effective ML solutions.',
    overallRating: 4.3,
    criteria: {
      expertise: 5,
      communication: 4,
      reliability: 4,
      value: 4
    },
    ratings: {
      expertise: 5,
      communication: 4,
      reliability: 4,
      value: 4
    },
    pros: [
      'Deep technical expertise',
      'Clear communication',
      'Delivers on time'
    ],
    cons: [
      'Can be expensive'
    ],
    isAnonymous: false,
    isVerified: true,
    helpfulCount: 5,
    createdAt: new Date('2024-11-20').toISOString(),
    updatedAt: new Date('2024-11-20').toISOString()
  },
  {
    id: 'r3',
    entityId: '2', // Google Inc.
    reviewerId: 'u3',
    reviewerName: 'Alice Johnson',
    category: EntityCategory.COMPANIES,
    title: 'Great Work Environment',
    content: 'Google provides an excellent work environment with amazing benefits and growth opportunities. The company culture is innovative and collaborative.',
    overallRating: 4.4,
    criteria: {
      work_environment: 5,
      management: 4,
      benefits: 5,
      growth_opportunities: 4
    },
    ratings: {
      work_environment: 5,
      management: 4,
      benefits: 5,
      growth_opportunities: 4
    },
    pros: [
      'Amazing benefits',
      'Smart colleagues',
      'Innovation-focused',
      'Good work-life balance'
    ],
    cons: [
      'High performance expectations',
      'Can be competitive'
    ],
    isAnonymous: false,
    isVerified: true,
    helpfulCount: 8,
    createdAt: new Date('2024-11-18').toISOString(),
    updatedAt: new Date('2024-11-18').toISOString()
  },
  {
    id: 'r4',
    entityId: '3', // iPhone 15 Pro
    reviewerId: 'u4',
    reviewerName: 'Mike Chen',
    category: EntityCategory.PRODUCTS,
    title: 'Impressive Camera System',
    content: 'The iPhone 15 Pro has an outstanding camera system. The new titanium design feels premium and the performance is excellent for all tasks.',
    overallRating: 4.6,
    criteria: {
      quality: 5,
      value: 4,
      usability: 5,
      satisfaction: 4
    },
    ratings: {
      quality: 5,
      value: 4,
      usability: 5,
      satisfaction: 4
    },
    pros: [
      'Excellent camera quality',
      'Premium titanium build',
      'Fast performance',
      'Great battery life'
    ],
    cons: [
      'Expensive',
      'No major design changes'
    ],
    isAnonymous: false,
    isVerified: true,
    helpfulCount: 15,
    createdAt: new Date('2024-11-22').toISOString(),
    updatedAt: new Date('2024-11-22').toISOString()
  },
  {
    id: 'r5',
    entityId: '1', // Dr. Sarah Johnson - Professor at MIT
    reviewerId: 'u5',
    reviewerName: 'Emma Wilson',
    category: EntityCategory.PROFESSIONALS,
    title: 'Inspiring Mentor',
    content: 'Dr. Johnson is not just an excellent teacher but also an inspiring mentor. Her guidance helped me secure a research position and grow as a computer scientist.',
    overallRating: 4.8,
    criteria: {
      teaching_quality: 5,
      availability: 5,
      expertise: 5,
      communication: 4
    },
    ratings: {
      teaching_quality: 5,
      availability: 5,
      expertise: 5,
      communication: 4
    },
    pros: [
      'Excellent research guidance',
      'Very approachable',
      'Industry connections',
      'Inspiring teaching style'
    ],
    cons: [
      'High expectations for research students'
    ],
    isAnonymous: false,
    isVerified: true,
    helpfulCount: 20,
    createdAt: new Date('2024-11-25').toISOString(),
    updatedAt: new Date('2024-11-25').toISOString()
  },
  {
    id: 'r6',
    entityId: '1b', // Dr. Sarah Johnson - Consultant at TechCorp
    reviewerId: 'u6',
    reviewerName: 'David Rodriguez',
    category: EntityCategory.PROFESSIONALS,
    title: 'Outstanding AI Consultant',
    content: 'Dr. Johnson helped transform our AI strategy. Her deep technical knowledge combined with practical business understanding made the difference.',
    overallRating: 4.7,
    criteria: {
      expertise: 5,
      communication: 5,
      reliability: 4,
      value: 4
    },
    ratings: {
      expertise: 5,
      communication: 5,
      reliability: 4,
      value: 4
    },
    pros: [
      'Deep AI expertise',
      'Strategic thinking',
      'Clear communication',
      'Results-oriented'
    ],
    cons: [
      'Premium pricing',
      'Limited availability'
    ],
    isAnonymous: false,
    isVerified: true,
    helpfulCount: 12,
    createdAt: new Date('2024-11-26').toISOString(),
    updatedAt: new Date('2024-11-26').toISOString()
  },
  {
    id: 'r7',
    entityId: '4', // Central Park
    reviewerId: 'u7',
    reviewerName: 'Sarah Lee',
    category: EntityCategory.PLACES,
    title: 'Perfect for Weekend Walks',
    content: 'Central Park is a beautiful escape from the city bustle. Great for jogging, picnics, and just relaxing. Well-maintained with plenty of activities.',
    overallRating: 4.5,
    criteria: {
      facilities: 4,
      accessibility: 5,
      environment: 5,
      value: 4
    },
    ratings: {
      facilities: 4,
      accessibility: 5,
      environment: 5,
      value: 4
    },
    pros: [
      'Beautiful scenery',
      'Multiple activities',
      'Well maintained',
      'Free access'
    ],
    cons: [
      'Can get crowded',
      'Limited parking'
    ],
    isAnonymous: false,
    isVerified: true,
    helpfulCount: 18,
    createdAt: new Date('2024-11-24').toISOString(),
    updatedAt: new Date('2024-11-24').toISOString()
  },
  {
    id: 'r8',
    entityId: '5', // The Shawshank Redemption
    reviewerId: 'u8',
    reviewerName: 'Tom Anderson',
    category: EntityCategory.PRODUCTS,
    title: 'Timeless Masterpiece',
    content: 'One of the greatest films ever made. Incredible storytelling, outstanding performances, and a message that stays with you forever.',
    overallRating: 5.0,
    criteria: {
      quality: 5,
      value: 5,
      usability: 5,
      satisfaction: 5
    },
    ratings: {
      quality: 5,
      value: 5,
      usability: 5,
      satisfaction: 5
    },
    pros: [
      'Outstanding story',
      'Brilliant acting',
      'Emotional depth',
      'Rewatchable'
    ],
    cons: [],
    isAnonymous: false,
    isVerified: true,
    helpfulCount: 35,
    createdAt: new Date('2024-11-23').toISOString(),
    updatedAt: new Date('2024-11-23').toISOString()
  },
  {
    id: 'r9',
    entityId: '6', // Dr. Michael Chen - Cardiologist
    reviewerId: 'u9',
    reviewerName: 'Patricia Miller',
    category: EntityCategory.PROFESSIONALS,
    title: 'Life-Saving Care',
    content: 'Dr. Chen performed my cardiac catheterization with exceptional skill. His expertise and compassionate care made a difficult time much easier.',
    overallRating: 4.9,
    criteria: {
      expertise: 5,
      communication: 5,
      bedside_manner: 5,
      availability: 4
    },
    ratings: {
      expertise: 5,
      communication: 5,
      bedside_manner: 5,
      availability: 4
    },
    pros: [
      'World-class expertise',
      'Excellent bedside manner',
      'Clear explanations',
      'Compassionate care'
    ],
    cons: [
      'Busy schedule, hard to get appointments'
    ],
    isAnonymous: false,
    isVerified: true,
    helpfulCount: 28,
    createdAt: new Date('2024-11-28').toISOString(),
    updatedAt: new Date('2024-11-28').toISOString()
  },
  {
    id: 'r10',
    entityId: '7', // Professor Lisa Wang - Data Science
    reviewerId: 'u10',
    reviewerName: 'Kevin Zhang',
    category: EntityCategory.PROFESSIONALS,
    title: 'Outstanding Data Science Professor',
    content: 'Prof. Wang makes complex statistical concepts accessible and engaging. Her real-world examples and hands-on projects really enhanced my learning.',
    overallRating: 4.6,
    criteria: {
      teaching_quality: 5,
      availability: 4,
      expertise: 5,
      communication: 4
    },
    ratings: {
      teaching_quality: 5,
      availability: 4,
      expertise: 5,
      communication: 4
    },
    pros: [
      'Engaging lectures',
      'Practical projects',
      'Industry experience',
      'Fair grading'
    ],
    cons: [
      'High workload',
      'Fast-paced course'
    ],
    isAnonymous: false,
    isVerified: true,
    helpfulCount: 16,
    createdAt: new Date('2024-11-29').toISOString(),
    updatedAt: new Date('2024-11-29').toISOString()
  },
  {
    id: 'r11',
    entityId: '8', // Microsoft Corporation
    reviewerId: 'u11',
    reviewerName: 'Jennifer Park',
    category: EntityCategory.COMPANIES,
    title: 'Great Company Culture',
    content: 'Microsoft has really transformed its culture in recent years. Excellent work-life balance, strong emphasis on growth, and supportive management.',
    overallRating: 4.3,
    criteria: {
      work_environment: 4,
      management: 4,
      benefits: 5,
      growth_opportunities: 4
    },
    ratings: {
      work_environment: 4,
      management: 4,
      benefits: 5,
      growth_opportunities: 4
    },
    pros: [
      'Excellent benefits',
      'Work-life balance',
      'Growth mindset',
      'Diverse teams'
    ],
    cons: [
      'Large bureaucracy',
      'Slow decision making'
    ],
    isAnonymous: false,
    isVerified: true,
    helpfulCount: 22,
    createdAt: new Date('2024-12-01').toISOString(),
    updatedAt: new Date('2024-12-01').toISOString()
  },
  {
    id: 'r12',
    entityId: '9', // Tesla Model Y
    reviewerId: 'u12',
    reviewerName: 'Robert Kim',
    category: EntityCategory.PRODUCTS,
    title: 'Impressive Electric SUV',
    content: 'The Model Y delivers on performance and efficiency. Great tech features, spacious interior, and the Supercharger network is unbeatable.',
    overallRating: 4.4,
    criteria: {
      quality: 4,
      value: 4,
      usability: 5,
      satisfaction: 4
    },
    ratings: {
      quality: 4,
      value: 4,
      usability: 5,
      satisfaction: 4
    },
    pros: [
      'Excellent performance',
      'Great tech features',
      'Supercharger network',
      'Spacious interior'
    ],
    cons: [
      'Build quality inconsistencies',
      'Expensive repairs'
    ],
    isAnonymous: false,
    isVerified: true,
    helpfulCount: 31,
    createdAt: new Date('2024-12-02').toISOString(),
    updatedAt: new Date('2024-12-02').toISOString()
  },
  {
    id: 'r13',
    entityId: '10', // Starbucks Coffee
    reviewerId: 'u13',
    reviewerName: 'Monica Davis',
    category: EntityCategory.PLACES,
    title: 'Historic Coffee Experience',
    content: 'The original Starbucks is a must-visit! Great atmosphere, friendly staff, and you can feel the history. Coffee quality is consistently good.',
    overallRating: 4.2,
    criteria: {
      facilities: 4,
      accessibility: 4,
      environment: 5,
      value: 3
    },
    ratings: {
      facilities: 4,
      accessibility: 4,
      environment: 5,
      value: 3
    },
    pros: [
      'Historic significance',
      'Great atmosphere',
      'Quality coffee',
      'Friendly staff'
    ],
    cons: [
      'Always crowded',
      'Expensive',
      'Limited seating'
    ],
    isAnonymous: false,
    isVerified: true,
    helpfulCount: 14,
    createdAt: new Date('2024-12-03').toISOString(),
    updatedAt: new Date('2024-12-03').toISOString()
  },
  {
    id: 'r14',
    entityId: '11', // Netflix
    reviewerId: 'u14',
    reviewerName: 'Chris Taylor',
    category: EntityCategory.PRODUCTS,
    title: 'Great Content Library',
    content: 'Netflix continues to deliver quality original content alongside a vast library of shows and movies. The recommendation algorithm works well.',
    overallRating: 4.1,
    criteria: {
      quality: 4,
      value: 4,
      usability: 4,
      satisfaction: 4
    },
    ratings: {
      quality: 4,
      value: 4,
      usability: 4,
      satisfaction: 4
    },
    pros: [
      'Great original content',
      'User-friendly interface',
      'Good recommendations',
      'Multiple device support'
    ],
    cons: [
      'Content removal',
      'Price increases',
      'Too many options'
    ],
    isAnonymous: false,
    isVerified: true,
    helpfulCount: 27,
    createdAt: new Date('2024-12-04').toISOString(),
    updatedAt: new Date('2024-12-04').toISOString()
  },
  {
    id: 'r15',
    entityId: '12', // Harvard University
    reviewerId: 'u15',
    reviewerName: 'Rachel Green',
    category: EntityCategory.COMPANIES,
    title: 'World-Class Education',
    content: 'Harvard provides an unparalleled educational experience. Brilliant professors, motivated peers, and incredible resources. The network is invaluable.',
    overallRating: 4.7,
    criteria: {
      education_quality: 5,
      facilities: 5,
      faculty: 5,
      opportunities: 4
    },
    ratings: {
      education_quality: 5,
      facilities: 5,
      faculty: 5,
      opportunities: 4
    },
    pros: [
      'World-renowned faculty',
      'Amazing facilities',
      'Strong alumni network',
      'Research opportunities'
    ],
    cons: [
      'Extremely competitive',
      'Very expensive',
      'High pressure environment'
    ],
    isAnonymous: false,
    isVerified: true,
    helpfulCount: 45,
    createdAt: new Date('2024-12-05').toISOString(),
    updatedAt: new Date('2024-12-05').toISOString()
  },
  {
    id: 'r16',
    entityId: '13', // Dr. Emily Rodriguez
    reviewerId: 'u16',
    reviewerName: 'Mark Johnson',
    category: EntityCategory.PROFESSIONALS,
    title: 'Outstanding Dermatologist',
    content: 'Dr. Rodriguez is fantastic! She caught my skin cancer early and handled the treatment with great care. Very knowledgeable and compassionate.',
    overallRating: 4.9,
    criteria: {
      treatment_effectiveness: 5,
      wait_time: 4,
      communication: 5,
      professionalism: 5
    },
    ratings: {
      treatment_effectiveness: 5,
      wait_time: 4,
      communication: 5,
      professionalism: 5
    },
    pros: [
      'Excellent diagnostic skills',
      'Very caring',
      'Thorough examinations',
      'Clear communication'
    ],
    cons: [
      'Appointments hard to get'
    ],
    isAnonymous: false,
    isVerified: true,
    helpfulCount: 23,
    createdAt: new Date('2024-12-06').toISOString(),
    updatedAt: new Date('2024-12-06').toISOString()
  },
  {
    id: 'r17',
    entityId: '14', // Prof. David Kim
    reviewerId: 'u17',
    reviewerName: 'Sarah Wilson',
    category: EntityCategory.PROFESSIONALS,
    title: 'Engaging Economics Professor',
    content: 'Professor Kim makes economics fascinating! His behavioral economics course changed how I think about decision-making. Great real-world examples.',
    overallRating: 4.4,
    criteria: {
      teaching_quality: 5,
      availability: 3,
      expertise: 5,
      communication: 4
    },
    ratings: {
      teaching_quality: 5,
      availability: 3,
      expertise: 5,
      communication: 4
    },
    pros: [
      'Makes complex topics clear',
      'Great real-world examples',
      'Thought-provoking lectures',
      'Up-to-date with research'
    ],
    cons: [
      'Limited office hours',
      'Tough grader'
    ],
    isAnonymous: false,
    isVerified: true,
    helpfulCount: 18,
    createdAt: new Date('2024-12-07').toISOString(),
    updatedAt: new Date('2024-12-07').toISOString()
  },
  {
    id: 'r18',
    entityId: '15', // Microsoft
    reviewerId: 'u18',
    reviewerName: 'Alex Chen',
    category: EntityCategory.COMPANIES,
    title: 'Great Work Culture',
    content: 'Microsoft has really transformed its culture. Great work-life balance, excellent benefits, and supportive management. The Azure projects are exciting.',
    overallRating: 4.3,
    criteria: {
      work_environment: 4,
      management: 4,
      benefits: 5,
      growth_opportunities: 4
    },
    ratings: {
      work_environment: 4,
      management: 4,
      benefits: 5,
      growth_opportunities: 4
    },
    pros: [
      'Excellent benefits',
      'Good work-life balance',
      'Innovative projects',
      'Supportive culture'
    ],
    cons: [
      'Large bureaucracy',
      'Slow decision making'
    ],
    isAnonymous: false,
    isVerified: true,
    helpfulCount: 31,
    createdAt: new Date('2024-12-08').toISOString(),
    updatedAt: new Date('2024-12-08').toISOString()
  },
  {
    id: 'r19',
    entityId: '16', // MacBook Pro M3
    reviewerId: 'u19',
    reviewerName: 'Jennifer Lee',
    category: EntityCategory.PRODUCTS,
    title: 'Perfect for Creative Work',
    content: 'The M3 MacBook Pro is a powerhouse! Video editing is lightning fast, battery life is incredible, and the display is gorgeous. Worth every penny.',
    overallRating: 4.7,
    criteria: {
      quality: 5,
      value: 4,
      usability: 5,
      satisfaction: 5
    },
    ratings: {
      quality: 5,
      value: 4,
      usability: 5,
      satisfaction: 5
    },
    pros: [
      'Blazing fast performance',
      'Amazing battery life',
      'Beautiful display',
      'Silent operation'
    ],
    cons: [
      'Expensive',
      'Limited ports'
    ],
    isAnonymous: false,
    isVerified: true,
    helpfulCount: 42,
    createdAt: new Date('2024-12-09').toISOString(),
    updatedAt: new Date('2024-12-09').toISOString()
  },
  {
    id: 'r20',
    entityId: '17', // Golden Gate Park
    reviewerId: 'u20',
    reviewerName: 'Mike Davis',
    category: EntityCategory.PLACES,
    title: 'Beautiful Urban Oasis',
    content: 'Golden Gate Park is amazing! So many different areas to explore - gardens, museums, lakes. Perfect for family outings and peaceful walks.',
    overallRating: 4.6,
    criteria: {
      facilities: 5,
      accessibility: 4,
      environment: 5
    },
    ratings: {
      facilities: 5,
      accessibility: 4,
      environment: 5
    },
    pros: [
      'Diverse attractions',
      'Beautiful gardens',
      'Great for families',
      'Well maintained'
    ],
    cons: [
      'Parking can be difficult',
      'Crowded on weekends'
    ],
    isAnonymous: false,
    isVerified: true,
    helpfulCount: 29,
    createdAt: new Date('2024-12-10').toISOString(),
    updatedAt: new Date('2024-12-10').toISOString()
  },
  {
    id: 'r21',
    entityId: '21', // Spotify
    reviewerId: 'u21',
    reviewerName: 'Emily Brown',
    category: EntityCategory.PRODUCTS,
    title: 'Best Music Streaming Service',
    content: 'Spotify\'s discovery features are unmatched! The playlists are spot-on and I\'ve found so many new artists. Interface could use some work though.',
    overallRating: 4.5,
    criteria: {
      quality: 4,
      value: 5,
      usability: 4,
      satisfaction: 5
    },
    ratings: {
      quality: 4,
      value: 5,
      usability: 4,
      satisfaction: 5
    },
    pros: [
      'Great music discovery',
      'Excellent playlists',
      'Good value',
      'Works everywhere'
    ],
    cons: [
      'Interface can be cluttered',
      'Ads in free version'
    ],
    isAnonymous: false,
    isVerified: true,
    helpfulCount: 37,
    createdAt: new Date('2024-12-11').toISOString(),
    updatedAt: new Date('2024-12-11').toISOString()
  },
  {
    id: 'r22',
    entityId: '25', // Dr. Maria Gonzalez
    reviewerId: 'u22',
    reviewerName: 'Lisa Thompson',
    category: EntityCategory.PROFESSIONALS,
    title: 'Wonderful Pediatrician',
    content: 'Dr. Gonzalez has been our family pediatrician for 8 years. She\'s amazing with kids and always takes time to explain everything. Highly recommend!',
    overallRating: 4.9,
    criteria: {
      treatment_effectiveness: 5,
      wait_time: 5,
      communication: 5,
      professionalism: 5
    },
    ratings: {
      treatment_effectiveness: 5,
      wait_time: 5,
      communication: 5,
      professionalism: 5
    },
    pros: [
      'Excellent with children',
      'Very patient',
      'Thorough examinations',
      'Always available for questions'
    ],
    cons: [],
    isAnonymous: false,
    isVerified: true,
    helpfulCount: 56,
    createdAt: new Date('2024-12-12').toISOString(),
    updatedAt: new Date('2024-12-12').toISOString()
  },
  {
    id: 'r23',
    entityId: '23', // The Metropolitan Museum
    reviewerId: 'u23',
    reviewerName: 'Robert Kim',
    category: EntityCategory.PLACES,
    title: 'World-Class Art Collection',
    content: 'The Met is absolutely incredible! Could spend weeks here. The Egyptian wing is my favorite. Get there early to avoid crowds.',
    overallRating: 4.8,
    criteria: {
      facilities: 5,
      accessibility: 4,
      environment: 5
    },
    ratings: {
      facilities: 5,
      accessibility: 4,
      environment: 5
    },
    pros: [
      'Incredible collection',
      'Beautiful building',
      'Excellent curation',
      'Audio guides'
    ],
    cons: [
      'Can be overwhelming',
      'Very crowded'
    ],
    isAnonymous: false,
    isVerified: true,
    helpfulCount: 44,
    createdAt: new Date('2024-12-13').toISOString(),
    updatedAt: new Date('2024-12-13').toISOString()
  },
  {
    id: 'r24',
    entityId: '24', // Tesla Model Y
    reviewerId: 'u24',
    reviewerName: 'David Wilson',
    category: EntityCategory.PRODUCTS,
    title: 'Great Electric SUV',
    content: 'Love my Model Y! The acceleration is fun, autopilot works well on highways, and the charging network is excellent. Some build quality issues though.',
    overallRating: 4.3,
    criteria: {
      quality: 4,
      value: 4,
      usability: 5,
      satisfaction: 4
    },
    ratings: {
      quality: 4,
      value: 4,
      usability: 5,
      satisfaction: 4
    },
    pros: [
      'Excellent performance',
      'Great charging network',
      'Advanced technology',
      'Low running costs'
    ],
    cons: [
      'Build quality issues',
      'Service center waits',
      'Expensive options'
    ],
    isAnonymous: false,
    isVerified: true,
    helpfulCount: 33,
    createdAt: new Date('2024-12-14').toISOString(),
    updatedAt: new Date('2024-12-14').toISOString()
  },
  // Additional reviews for infinite scroll
  ...Array.from({ length: 100 }, (_, i) => ({
    id: `review-${i + 100}`,
    entityId: mockEntities[Math.floor(Math.random() * Math.min(mockEntities.length, 25))].id,
    reviewerId: `reviewer-${i + 100}`,
    reviewerName: `User ${i + 100}`,
    category: [EntityCategory.PROFESSIONALS, EntityCategory.COMPANIES, EntityCategory.PLACES, EntityCategory.PRODUCTS][i % 4],
    title: `Review ${i + 100} - ${['Great experience', 'Good service', 'Could be better', 'Excellent quality', 'Very satisfied'][i % 5]}`,
    content: `This is a detailed review number ${i + 100}. ${['The experience was fantastic and exceeded my expectations.', 'Good overall experience with some room for improvement.', 'Average service, nothing special but gets the job done.', 'Outstanding quality and professional service throughout.', 'Highly recommend to anyone looking for quality service.'][i % 5]} ${Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, j) => `Additional detail ${j + 1} about this review.`).join(' ')}`,
    overallRating: Math.floor(Math.random() * 5) + 1,
    criteria: {
      quality: Math.floor(Math.random() * 5) + 1,
      value: Math.floor(Math.random() * 5) + 1,
      service: Math.floor(Math.random() * 5) + 1
    },
    ratings: {
      quality: Math.floor(Math.random() * 5) + 1,
      value: Math.floor(Math.random() * 5) + 1,
      service: Math.floor(Math.random() * 5) + 1
    },
    pros: [`Pro ${i + 1}`, `Another positive aspect`, `Great feature`].slice(0, Math.floor(Math.random() * 3) + 1),
    cons: [`Con ${i + 1}`, `Area for improvement`, `Minor issue`].slice(0, Math.floor(Math.random() * 2)),
    isAnonymous: Math.random() > 0.7,
    isVerified: Math.random() > 0.6,
    helpfulCount: Math.floor(Math.random() * 20),
    createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(), // Random date within last 90 days
    updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() // Random recent update
  } as Review))
];

// Simulated API functions
export const searchEntities = async (query: string, filters?: SearchFilters): Promise<SearchResult> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const normalizedQuery = query.toLowerCase().trim();
  const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 0);
  
  let filteredEntities = mockEntities.filter(entity => {
    const searchText = [
      entity.name,
      entity.description,
      entity.context?.organization,
      entity.context?.location,
      entity.subcategory
    ].filter(Boolean).join(' ').toLowerCase();
    
    // Check if query matches exactly
    if (searchText.includes(normalizedQuery)) {
      return true;
    }
    
    // Check if all query words are present
    if (queryWords.every(word => searchText.includes(word))) {
      return true;
    }
    
    // Check for partial matches (at least 50% of words match)
    if (queryWords.length > 1) {
      const matchingWords = queryWords.filter(word => searchText.includes(word));
      return matchingWords.length >= Math.ceil(queryWords.length * 0.5);
    }
    
    return false;
  });
  
  // Sort by relevance (exact matches first, then partial matches)
  filteredEntities.sort((a, b) => {
    const aText = [a.name, a.description, a.context?.organization].filter(Boolean).join(' ').toLowerCase();
    const bText = [b.name, b.description, b.context?.organization].filter(Boolean).join(' ').toLowerCase();
    
    const aExact = aText.includes(normalizedQuery);
    const bExact = bText.includes(normalizedQuery);
    
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    
    // If both or neither are exact matches, sort by name
    return a.name.localeCompare(b.name);
  });

  // Apply filters
  if (filters) {
    if (filters.category) {
      filteredEntities = filteredEntities.filter(entity => entity.category === filters.category);
    }
    if (filters.rating) {
      filteredEntities = filteredEntities.filter(entity => {
        const rating = entity.averageRating || 0;
        return rating >= (filters.rating!.min || 0) && rating <= (filters.rating!.max || 5);
      });
    }
    if (filters.verified) {
      // Mock verification filter - in real app this would check entity verification status
      filteredEntities = filteredEntities.filter(() => Math.random() > 0.3);
    }
    if (filters.hasReviews) {
      filteredEntities = filteredEntities.filter(entity => (entity.reviewCount || 0) > 0);
    }
  }

  // Apply sorting
  if (filters?.sortBy) {
    filteredEntities.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'rating':
          aValue = a.averageRating || 0;
          bValue = b.averageRating || 0;
          break;
        case 'reviewCount':
          aValue = a.reviewCount || 0;
          bValue = b.reviewCount || 0;
          break;
        case 'createdAt':
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  return {
    entities: filteredEntities,
    total: filteredEntities.length,
    hasMore: false
  };
};

export const getEntityById = async (id: string): Promise<Entity | null> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockEntities.find(entity => entity.id === id) || null;
};

export const getEntityReviews = async (entityId: string): Promise<Review[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockReviews.filter(review => review.entityId === entityId);
};

export const getReviewsForEntity = async (entityId: string, limit: number = 10, offset: number = 0): Promise<Review[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockReviews
    .filter(review => review.entityId === entityId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(offset, offset + limit);
};

export const createEntity = async (entityData: Partial<Entity>): Promise<Entity> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const newEntity: Entity = {
    id: Date.now().toString(),
    name: entityData.name || '',
    category: entityData.category || EntityCategory.PROFESSIONALS,
    subcategory: entityData.subcategory || '',
    description: entityData.description || '',
    context: entityData.context,
    relatedEntityIds: entityData.relatedEntityIds || [],
    averageRating: 0,
    reviewCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  mockEntities.push(newEntity);
  return newEntity;
};

export const createReview = async (reviewData: Partial<Review>): Promise<Review> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const newReview: Review = {
    id: Date.now().toString(),
    entityId: reviewData.entityId || '',
    reviewerId: 'current-user', // In real app, get from auth
    reviewerName: reviewData.reviewerName || 'Anonymous User',
    category: reviewData.category || EntityCategory.PROFESSIONALS,
    title: reviewData.title || 'Review',
    content: reviewData.content || '',
    overallRating: reviewData.overallRating || 3,
    criteria: reviewData.criteria,
    ratings: reviewData.ratings || {},
    pros: reviewData.pros,
    cons: reviewData.cons,
    isAnonymous: reviewData.isAnonymous || false,
    isVerified: false,
    helpfulCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  mockReviews.push(newReview);
  
  // Update entity review count and average rating
  const entity = mockEntities.find(e => e.id === newReview.entityId);
  if (entity) {
    entity.reviewCount = (entity.reviewCount || 0) + 1;
    // Simple average calculation (in real app, this would be more sophisticated)
    const entityReviews = mockReviews.filter(r => r.entityId === entity.id);
    const totalRating = entityReviews.reduce((sum, review) => {
      const avgRating = Object.values(review.ratings).reduce((a, b) => a + b, 0) / Object.values(review.ratings).length;
      return sum + avgRating;
    }, 0);
    entity.averageRating = totalRating / entityReviews.length;
    entity.updatedAt = new Date().toISOString();
  }

  return newReview;
};

export const getRecentReviews = async (limit: number = 10, offset: number = 0): Promise<Review[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Get all reviews with their associated entities
  const reviewsWithEntities = mockReviews.map(review => ({
    ...review,
    entity: mockEntities.find(entity => entity.id === review.entityId)
  })).filter(review => review.entity); // Only include reviews with valid entities
  
  // Sort by creation date (newest first) and apply pagination
  return reviewsWithEntities
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(offset, offset + limit);
};

export const getReviewsByCategory = async (category?: EntityCategory, limit: number = 10, offset: number = 0): Promise<Review[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  if (!category) {
    return getRecentReviews(limit, offset);
  }
  
  return mockReviews
    .filter(review => review.category === category)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(offset, offset + limit);
};

export const getRelatedEntities = async (entityIds: string[]): Promise<Entity[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockEntities.filter(entity => entityIds.includes(entity.id));
};

// Helper function to group entities by person
export const groupEntitiesByPerson = (entities: Entity[]): Array<{
  personName: string;
  entities: Entity[];
  isPerson: boolean;
}> => {
  const groups: Record<string, Entity[]> = {};
  const nonPersonEntities: Entity[] = [];

  entities.forEach(entity => {
    if (entity.category === EntityCategory.PROFESSIONALS) {
      // Extract person name (everything before " - ")
      const personName = entity.name.split(' - ')[0];
      if (!groups[personName]) {
        groups[personName] = [];
      }
      groups[personName].push(entity);
    } else {
      nonPersonEntities.push(entity);
    }
  });

  const result = Object.entries(groups).map(([personName, entities]) => ({
    personName,
    entities: entities.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0)), // Sort by review count
    isPerson: true
  }));

  // Add non-person entities as individual groups
  nonPersonEntities.forEach(entity => {
    result.push({
      personName: entity.name,
      entities: [entity],
      isPerson: false
    });
  });

  return result;
};

// New API functions for sidebar statistics
export interface MostDiscussedReview extends Review {
  commentCount?: number;
}

export interface CategoryStatistics {
  name: string;
  displayName: string;
  reviewCount: number;
  totalReactions: number;
  averageRating: number;
  growth: number;
}

export const getMostDiscussedReviews = async (limit: number = 3): Promise<{reviews: MostDiscussedReview[], total: number}> => {
  try {
    const response = await fetch(`/api/v1/reviews/most-discussed?limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch most discussed reviews');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching most discussed reviews:', error);
    // Return mock data as fallback
    const mockMostDiscussed: MostDiscussedReview[] = [
      {
        id: 'review-1',
        entityId: '1',
        reviewerId: 'user-1',
        reviewerName: 'Alex Thompson',
        reviewerAvatar: 'https://ui-avatars.com/api/?name=Alex+Thompson&background=3b82f6&color=ffffff',
        category: EntityCategory.PROFESSIONALS,
        content: 'Outstanding professor! Her ML course changed my career trajectory completely.',
        overallRating: 5,
        ratings: { teaching: 5, expertise: 5, approachability: 4 },
        criteria: {},
        pros: ['Excellent teaching', 'Clear explanations'],
        cons: ['Sometimes moves fast'],
        isAnonymous: false,
        isVerified: true,
        comments: [
          { id: '1', reviewId: 'review-1', userId: 'user-1', userName: 'Student 1', content: 'I agree!', authorName: 'Student 1', createdAt: new Date(), reactions: {}, userReaction: undefined },
          { id: '2', reviewId: 'review-1', userId: 'user-2', userName: 'Student 2', content: 'Best professor ever', authorName: 'Student 2', createdAt: new Date(), reactions: {}, userReaction: undefined },
          { id: '3', reviewId: 'review-1', userId: 'user-3', userName: 'Student 3', content: 'Changed my life too', authorName: 'Student 3', createdAt: new Date(), reactions: {}, userReaction: undefined },
          { id: '4', reviewId: 'review-1', userId: 'user-4', userName: 'Student 4', content: 'Amazing insights', authorName: 'Student 4', createdAt: new Date(), reactions: {}, userReaction: undefined },
          { id: '5', reviewId: 'review-1', userId: 'user-5', userName: 'Student 5', content: 'Highly recommended', authorName: 'Student 5', createdAt: new Date(), reactions: {}, userReaction: undefined }
        ],
        reactions: { like: 15, helpful: 8, insightful: 3 },
        total_reactions: 26,
        createdAt: '2024-11-15T14:30:00Z',
        commentCount: 5
      },
      {
        id: 'review-2',
        entityId: '2',
        reviewerId: 'user-2',
        reviewerName: 'Maria Garcia',
        reviewerAvatar: 'https://ui-avatars.com/api/?name=Maria+Garcia&background=10b981&color=ffffff',
        category: EntityCategory.COMPANIES,
        content: 'Great work environment, but the work-life balance could be better.',
        overallRating: 4,
        ratings: { culture: 4, compensation: 5, growth: 4 },
        criteria: {},
        pros: ['Good culture', 'Great pay'],
        cons: ['Long hours'],
        isAnonymous: false,
        isVerified: true,
        comments: [
          { id: '6', reviewId: 'review-2', userId: 'user-6', userName: 'Employee 1', content: 'Same experience here', authorName: 'Employee 1', createdAt: new Date(), reactions: {}, userReaction: undefined },
          { id: '7', reviewId: 'review-2', userId: 'user-7', userName: 'Employee 2', content: 'Depends on the team', authorName: 'Employee 2', createdAt: new Date(), reactions: {}, userReaction: undefined },
          { id: '8', reviewId: 'review-2', userId: 'user-8', userName: 'Employee 3', content: 'Management matters', authorName: 'Employee 3', createdAt: new Date(), reactions: {}, userReaction: undefined },
          { id: '9', reviewId: 'review-2', userId: 'user-9', userName: 'Employee 4', content: 'Good benefits though', authorName: 'Employee 4', createdAt: new Date(), reactions: {}, userReaction: undefined }
        ],
        reactions: { like: 12, helpful: 6 },
        total_reactions: 18,
        createdAt: '2024-11-20T09:15:00Z',
        commentCount: 4
      },
      {
        id: 'review-3',
        entityId: '3',
        reviewerId: 'user-3',
        reviewerName: 'John Smith',
        reviewerAvatar: 'https://ui-avatars.com/api/?name=John+Smith&background=f59e0b&color=ffffff',
        category: EntityCategory.PRODUCTS,
        content: 'Camera quality is amazing, but battery life is disappointing.',
        overallRating: 4,
        ratings: { camera: 5, battery: 2, performance: 4 },
        criteria: {},
        pros: ['Amazing camera', 'Great performance'],
        cons: ['Poor battery life'],
        isAnonymous: false,
        isVerified: true,
        comments: [
          { id: '10', reviewId: 'review-3', userId: 'user-10', userName: 'User 1', content: 'Battery drains fast', authorName: 'User 1', createdAt: new Date(), reactions: {}, userReaction: undefined },
          { id: '11', reviewId: 'review-3', userId: 'user-11', userName: 'User 2', content: 'Photos are incredible', authorName: 'User 2', createdAt: new Date(), reactions: {}, userReaction: undefined },
          { id: '12', reviewId: 'review-3', userId: 'user-12', userName: 'User 3', content: 'Mixed feelings', authorName: 'User 3', createdAt: new Date(), reactions: {}, userReaction: undefined }
        ],
        reactions: { like: 8, helpful: 4 },
        total_reactions: 12,
        createdAt: '2024-11-25T16:45:00Z',
        commentCount: 3
      }
    ];
    
    return {
      reviews: mockMostDiscussed.slice(0, limit),
      total: mockMostDiscussed.length
    };
  }
};

export const getCategoryStatistics = async (): Promise<{categories: CategoryStatistics[]}> => {
  try {
    const response = await fetch('/api/v1/categories/statistics');
    if (!response.ok) {
      throw new Error('Failed to fetch category statistics');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching category statistics:', error);
    // Return mock data as fallback
    return {
      categories: [
        {
          name: 'professionals',
          displayName: 'Professionals',
          reviewCount: 156,
          totalReactions: 892,
          averageRating: 4.3,
          growth: 12.5
        },
        {
          name: 'companies',
          displayName: 'Companies',
          reviewCount: 243,
          totalReactions: 1456,
          averageRating: 4.1,
          growth: 8.2
        },
        {
          name: 'products',
          displayName: 'Products',
          reviewCount: 189,
          totalReactions: 1123,
          averageRating: 4.4,
          growth: 15.3
        },
        {
          name: 'places',
          displayName: 'Places',
          reviewCount: 98,
          totalReactions: 567,
          averageRating: 4.2,
          growth: 6.7
        }
      ]
    };
  }
};

// Service object for easy imports
export const sidebarService = {
  getMostDiscussedReviews,
  getCategoryStatistics
};
