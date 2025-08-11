import { httpClient } from '../httpClient';

export interface UserProgress {
  points: number;
  level: number;
  progress_to_next_level: number;
  daily_streak: number;
  published_reviews: number;
  review_target: number;
  total_helpful_votes: number;
  average_rating_given: number;
  entities_reviewed: number;
  last_reviewed?: string;
}

export interface DailyTask {
  task_id?: number;
  label: string;
  complete: boolean;
}

export interface WeeklyEngagementData {
  date: string;
  day: string;
  reviews: number;
  reactions: number;
  comments: number;
  points: number;
}

export interface GamificationDashboard {
  user_progress: UserProgress;
  badges: string[];
  daily_tasks: DailyTask[];
  weekly_chart: WeeklyEngagementData[];
  session_duration: string;
}

export class GamificationService {
  private baseUrl = '/api/v1/gamification';

  async getDashboard(): Promise<GamificationDashboard> {
    try {
      console.log('🎮 Fetching gamification dashboard...');
      const response = await httpClient.get<GamificationDashboard>(`${this.baseUrl}/dashboard`);
      console.log('🎮 Raw response:', response);
      
      // httpClient returns ApiResponse<T> with data field
      if (!response || !response.success) {
        throw new Error(`API request failed: ${response?.message || 'Unknown error'}`);
      }
      
      if (!response.data) {
        throw new Error('No data received from gamification dashboard endpoint');
      }
      
      console.log('🎮 Dashboard data loaded successfully');
      return response.data;
    } catch (error) {
      console.error('🎮 Error fetching gamification dashboard:', error);
      throw error;
    }
  }

  async getUserProgress(): Promise<UserProgress> {
    try {
      const response = await httpClient.get<UserProgress>(`${this.baseUrl}/user-progress`);
      if (!response.data) {
        throw new Error('No data received from user progress endpoint');
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching user progress:', error);
      throw error;
    }
  }

  async getUserBadges(): Promise<string[]> {
    try {
      const response = await httpClient.get<string[]>(`${this.baseUrl}/badges`);
      if (!response.data) {
        throw new Error('No data received from badges endpoint');
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching user badges:', error);
      throw error;
    }
  }

  async getDailyTasks(): Promise<DailyTask[]> {
    try {
      const response = await httpClient.get<DailyTask[]>(`${this.baseUrl}/daily-tasks`);
      if (!response.data) {
        throw new Error('No data received from daily tasks endpoint');
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching daily tasks:', error);
      throw error;
    }
  }

  async updateDailyTask(taskId: number, complete: boolean): Promise<void> {
    try {
      await httpClient.patch(`${this.baseUrl}/daily-tasks/${taskId}`, { complete });
    } catch (error) {
      console.error('Error updating daily task:', error);
      throw error;
    }
  }

  async getWeeklyEngagement(): Promise<WeeklyEngagementData[]> {
    try {
      const response = await httpClient.get<WeeklyEngagementData[]>(`${this.baseUrl}/weekly-engagement`);
      if (!response.data) {
        throw new Error('No data received from weekly engagement endpoint');
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching weekly engagement:', error);
      throw error;
    }
  }
}

export const gamificationService = new GamificationService(); 