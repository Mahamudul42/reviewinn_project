// Analytics service for tracking and insights
import type { 
  Entity, 
  EntityAnalytics, 
  ReviewTrend, 
  EntityComparison, 
  ComparisonMatrix 
} from '../types';
import { EntityCategory } from '../types';

export interface DashboardStats {
  totalEntities: number;
  totalReviews: number;
  averageRating: number;
  topCategories: Array<{ name: string; count: number }>;
  recentActivity: Array<{ type: string; message: string; timestamp: Date }>;
  trendingEntities: Entity[];
}

export interface SearchAnalytics {
  popularSearches: Array<{ query: string; count: number }>;
  searchTrends: Array<{ period: string; searches: number }>;
  noResultsQueries: string[];
}

class AnalyticsService {
  private static instance: AnalyticsService;

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private constructor() {}

  public async getDashboardStats(): Promise<DashboardStats> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      totalEntities: 1247,
      totalReviews: 5893,
      averageRating: 4.2,
      topCategories: [
        { name: 'Person/Professional', count: 523 },
        { name: 'Company/Institute', count: 398 },
        { name: 'Product', count: 201 },
        { name: 'Location/Place', count: 125 }
      ],
      recentActivity: [
        {
          type: 'review',
          message: 'New review added for Stanford University',
          timestamp: new Date('2024-12-20T10:30:00Z')
        },
        {
          type: 'entity',
          message: 'Tesla Model Y added to products',
          timestamp: new Date('2024-12-20T09:15:00Z')
        },
        {
          type: 'user',
          message: '5 new users joined today',
          timestamp: new Date('2024-12-20T08:45:00Z')
        }
      ],
      trendingEntities: this.generateTrendingEntities()
    };
  }

  public async getEntityAnalytics(entityId: string): Promise<EntityAnalytics> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));

    return {
      entityId,
      views: Math.floor(Math.random() * 1000) + 100,
      reviewTrends: this.generateReviewTrends(),
      ratingDistribution: {
        '1': 5,
        '2': 8,
        '3': 15,
        '4': 35,
        '5': 37
      },
      topKeywords: ['excellent', 'helpful', 'professional', 'responsive', 'knowledgeable'],
      sentiment: this.getRandomSentiment(),
      lastUpdated: new Date()
    };
  }

  public async getSearchAnalytics(): Promise<SearchAnalytics> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      popularSearches: [
        { query: 'Stanford University', count: 245 },
        { query: 'Software Engineer', count: 189 },
        { query: 'Restaurant', count: 156 },
        { query: 'iPhone 15', count: 134 },
        { query: 'Google', count: 98 }
      ],
      searchTrends: [
        { period: '2024-12-01', searches: 1250 },
        { period: '2024-12-08', searches: 1340 },
        { period: '2024-12-15', searches: 1420 },
        { period: '2024-12-22', searches: 1380 }
      ],
      noResultsQueries: [
        'XYZ Corporation',
        'Fake University',
        'Non-existent Product'
      ]
    };
  }

  public async compareEntities(entityIds: string[]): Promise<EntityComparison> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const entities = await this.fetchEntitiesForComparison(entityIds);
    const criteria = ['Overall Rating', 'Review Count', 'Verification Status'];
    const matrix: ComparisonMatrix = {};

    entities.forEach(entity => {
      matrix[entity.id] = {
        'Overall Rating': entity.averageRating || 0,
        'Review Count': entity.reviewCount || 0,
        'Verification Status': Math.random() > 0.5 ? 'Verified' : 'Unverified'
      };
    });

    return {
      entities,
      criteria,
      matrix
    };
  }

  public trackEntityView(entityId: string): void {
    // Track view event
    const viewData = {
      entityId,
      timestamp: new Date(),
      userId: this.getCurrentUserId()
    };

    // Store in localStorage for demo (in real app, send to API)
    const views = this.getStoredViews();
    views.push(viewData);
    localStorage.setItem('entity_views', JSON.stringify(views.slice(-100))); // Keep last 100
  }

  public trackSearch(query: string, resultCount: number): void {
    // Track search event
    const searchData = {
      query,
      resultCount,
      timestamp: new Date(),
      userId: this.getCurrentUserId()
    };

    // Store in localStorage for demo
    const searches = this.getStoredSearches();
    searches.push(searchData);
    localStorage.setItem('searches', JSON.stringify(searches.slice(-100))); // Keep last 100
  }

   
  public getPersonalizedRecommendations(_userId: string): Promise<Entity[]> {
    // Simulate personalized recommendations based on user activity
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(this.generateRecommendations());
      }, 600);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async getAnalytics(filters: any): Promise<any> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const timeRange = filters.timeRange || '30d';
    
    // Mock analytics data based on filters
    return {
      overview: {
        totalReviews: Math.floor(Math.random() * 10000) + 5000,
        totalEntities: Math.floor(Math.random() * 2000) + 1000,
        averageRating: +(Math.random() * 2 + 3).toFixed(1),
        activeUsers: Math.floor(Math.random() * 5000) + 2000,
        reviewsGrowth: +(Math.random() * 40 - 10).toFixed(1),
        entitiesGrowth: +(Math.random() * 20 - 5).toFixed(1),
        ratingTrend: +(Math.random() * 0.4 - 0.2).toFixed(1),
        usersGrowth: +(Math.random() * 30 - 5).toFixed(1)
      },
      reviewsByCategory: [
        { category: EntityCategory.PROFESSIONALS, count: Math.floor(Math.random() * 500) + 300 },
        { category: EntityCategory.COMPANIES, count: Math.floor(Math.random() * 400) + 200 },
        { category: EntityCategory.PRODUCTS, count: Math.floor(Math.random() * 300) + 150 },
        { category: EntityCategory.PLACES, count: Math.floor(Math.random() * 200) + 100 }
      ],
      ratingDistribution: [
        { rating: '5 Stars', count: Math.floor(Math.random() * 300) + 200 },
        { rating: '4 Stars', count: Math.floor(Math.random() * 250) + 150 },
        { rating: '3 Stars', count: Math.floor(Math.random() * 150) + 80 },
        { rating: '2 Stars', count: Math.floor(Math.random() * 80) + 30 },
        { rating: '1 Star', count: Math.floor(Math.random() * 50) + 10 }
      ],
      reviewsOverTime: this.generateTimeSeriesData(timeRange),
      topRatedEntities: this.generateTopEntities(),
      topReviewers: this.generateTopReviewers(),
      recentActivity: []
    };
  }

  private async fetchEntitiesForComparison(entityIds: string[]): Promise<Entity[]> {
    // Mock entities for comparison
    return entityIds.map((id, index) => ({
      id,
      name: `Entity ${index + 1}`,
      category: EntityCategory.PROFESSIONALS,
      subcategory: 'professor',
      description: `Description for entity ${index + 1}`,
      averageRating: 3.5 + Math.random() * 1.5,
      reviewCount: Math.floor(Math.random() * 50) + 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }

  private generateReviewTrends(): ReviewTrend[] {
    const trends: ReviewTrend[] = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      
      trends.push({
        period: date.toISOString().slice(0, 7), // YYYY-MM format
        count: Math.floor(Math.random() * 20) + 5,
        averageRating: 3.0 + Math.random() * 2.0
      });
    }
    
    return trends;
  }

  private generateTrendingEntities(): Entity[] {
    return [
      {
        id: '1',
        name: 'Dr. Sarah Johnson',
        category: EntityCategory.PROFESSIONALS,
        subcategory: 'professor',
        description: 'Computer Science Professor at MIT',
        averageRating: 4.8,
        reviewCount: 45,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Google LLC',
        category: EntityCategory.COMPANIES,
        subcategory: 'technology_company',
        description: 'Multinational technology corporation',
        averageRating: 4.3,
        reviewCount: 289,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  private generateRecommendations(): Entity[] {
    return [
      {
        id: 'rec_1',
        name: 'Stanford University',
        category: EntityCategory.COMPANIES,
        subcategory: 'university',
        description: 'Private research university',
        averageRating: 4.6,
        reviewCount: 156,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  private getRandomSentiment(): 'positive' | 'neutral' | 'negative' {
    const sentiments: Array<'positive' | 'neutral' | 'negative'> = ['positive', 'neutral', 'negative'];
    const weights = [0.6, 0.3, 0.1]; // 60% positive, 30% neutral, 10% negative
    
    const random = Math.random();
    let weightSum = 0;
    
    for (let i = 0; i < weights.length; i++) {
      weightSum += weights[i];
      if (random <= weightSum) {
        return sentiments[i];
      }
    }
    
    return 'neutral';
  }

  private getStoredViews(): Array<{ entityId: string; timestamp: Date; userId?: string }> {
    try {
      const stored = localStorage.getItem('entity_views');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private getStoredSearches(): Array<{ query: string; resultCount: number; timestamp: Date; userId?: string }> {
    try {
      const stored = localStorage.getItem('searches');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private getCurrentUserId(): string | undefined {
    try {
      // Use the unified auth token system instead of direct localStorage access
      const userData = localStorage.getItem('reviewinn_user');
      return userData ? JSON.parse(userData).id : undefined;
    } catch {
      return undefined;
    }
  }

  private generateTimeSeriesData(timeRange: string): Array<{ date: string; reviews: number }> {
    const data = [];
    const daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365, 'all': 365 };
    const days = daysMap[timeRange as keyof typeof daysMap] || 30;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        reviews: Math.floor(Math.random() * 50) + 10
      });
    }
    
    return data;
  }

  private generateTopEntities(): Array<{ name: string; category: string; rating: number; reviewCount: number }> {
    const entities = [
      'Dr. Sarah Johnson', 'TechCorp Inc.', 'Central Library', 'MacBook Pro',
      'Prof. Michael Chen', 'StartupXYZ', 'Main Campus', 'iPhone 15',
      'DataSoft Solutions', 'City Park', 'Samsung Galaxy', 'Coffee Shop'
    ];
    
    return entities.slice(0, 10).map(name => ({
      name,
      category: EntityCategory.PROFESSIONALS,
      rating: +(Math.random() * 2 + 3).toFixed(1),
      reviewCount: Math.floor(Math.random() * 100) + 20
    }));
  }

  private generateTopReviewers(): Array<{ name: string; reviewCount: number; averageRating: number; helpfulVotes: number }> {
    const names = [
      'Alice Smith', 'Bob Johnson', 'Carol Williams', 'David Brown',
      'Eva Davis', 'Frank Miller', 'Grace Wilson', 'Henry Moore'
    ];
    
    return names.map(name => ({
      name,
      reviewCount: Math.floor(Math.random() * 50) + 10,
      averageRating: +(Math.random() * 2 + 3).toFixed(1),
      helpfulVotes: Math.floor(Math.random() * 200) + 50
    }));
  }
}

export const analyticsService = AnalyticsService.getInstance();
