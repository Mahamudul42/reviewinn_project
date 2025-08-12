// Export types
export type { EntityListParams, EntitySearchParams } from './entityService';
export type { ReviewListParams } from './reviewService';
export type { UserInteraction, UserInteractionCache } from './userInteractionService';
export type { 
  UserProgress, 
  DailyTask, 
  WeeklyEngagementData, 
  GamificationDashboard 
} from './gamificationService';
export type { 
  HomepageData, 
  HomepageParams, 
  PlatformStats 
} from './homepageService';
export type { 
  User, 
  Message, 
  Conversation, 
  ConversationCreate,
  DirectMessageCreate,
  MessageCreate,
  ReactionCreate,
  MessageSearchQuery
} from './messengerService';
export type {
  CircleListResponse,
  CircleMemberListResponse,
  CircleInviteListResponse,
  CircleSuggestionListResponse,
  CircleInviteResponse,
  CircleActionResponse
} from './circleService';
export type {
  TrendingTopic,
  PopularEntity,
  ActivitySummary,
  ReviewInnRightPanelData
} from './reviewinnRightPanelService';

// Import services
import { entityService as _entityService } from './entityService';
import { ReviewService } from './reviewService';
import { UserService } from './userService';
import { CommentService } from './commentService';
import { userInteractionService } from './userInteractionService';
import { gamificationService } from './gamificationService';
import { homepageService } from './homepageService';
import { messengerService } from './messengerService';
import { circleService } from './circleService';
import { reviewinnRightPanelService } from './reviewinnRightPanelService';

// Export service instances
export const entityService = _entityService;
export const reviewService = new ReviewService();
export const userService = new UserService();
export const commentService = new CommentService();
export { userInteractionService, gamificationService, homepageService, messengerService, circleService, reviewinnRightPanelService };
// entityServiceFactory removed - use entityService directly 