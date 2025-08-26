// Export types
export type { EntityListParams, EntitySearchParams } from './entityService';
export type { ReviewListParams } from './reviewService';
export type { UserInteraction, UserInteractionCache } from './userInteractionService';
export type { 
  HomepageData, 
  HomepageParams, 
  PlatformStats 
} from './homepageService';
export type { 
  ProfessionalUser, 
  ProfessionalMessage, 
  ProfessionalConversation, 
  ConversationCreateRequest,
  MessageSendRequest,
  MessageEditRequest,
  ReactionRequest
} from './professionalMessagingService';
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
import { homepageService } from './homepageService';
import { professionalMessagingService } from './professionalMessagingService';
import { circleService } from './circleService';
import { reviewinnRightPanelService } from './reviewinnRightPanelService';
import { enterpriseNotificationService } from './enterpriseNotificationService';

// Export service instances
export const entityService = _entityService;
export const reviewService = new ReviewService();
export const userService = new UserService();
export const commentService = new CommentService();
export { userInteractionService, homepageService, professionalMessagingService, circleService, reviewinnRightPanelService, enterpriseNotificationService };
// entityServiceFactory removed - use entityService directly 