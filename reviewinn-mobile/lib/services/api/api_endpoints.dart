/// API endpoint constants for the application
/// Usage: ApiEndpoints.login, ApiEndpoints.getReviews(entityId)
class ApiEndpoints {
  // Base URL - Update this when connecting to real backend
  static const String baseUrl = 'https://api.reviewinn.com/v1';

  // Auth endpoints
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String refreshToken = '/auth/refresh';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';

  // User endpoints
  static const String userProfile = '/users/me';
  static String getUserProfile(String userId) => '/users/$userId';
  static const String updateProfile = '/users/me';
  static const String uploadAvatar = '/users/me/avatar';
  static String followUser(String userId) => '/users/$userId/follow';
  static String unfollowUser(String userId) => '/users/$userId/unfollow';
  static String getUserFollowers(String userId) => '/users/$userId/followers';
  static String getUserFollowing(String userId) => '/users/$userId/following';

  // Entity endpoints
  static const String entities = '/entities';
  static String getEntity(String entityId) => '/entities/$entityId';
  static const String searchEntities = '/entities/search';
  static String getEntityReviews(String entityId) => '/entities/$entityId/reviews';
  static String getEntityQuestions(String entityId) => '/entities/$entityId/questions';

  // Review endpoints
  static const String reviews = '/reviews';
  static String getReview(String reviewId) => '/reviews/$reviewId';
  static const String createReview = '/reviews';
  static String updateReview(String reviewId) => '/reviews/$reviewId';
  static String deleteReview(String reviewId) => '/reviews/$reviewId';
  static String likeReview(String reviewId) => '/reviews/$reviewId/like';
  static String unlikeReview(String reviewId) => '/reviews/$reviewId/unlike';
  static String getReviewComments(String reviewId) => '/reviews/$reviewId/comments';

  // Question & Answer endpoints
  static const String questions = '/questions';
  static String getQuestion(String questionId) => '/questions/$questionId';
  static const String askQuestion = '/questions';
  static String getQuestionAnswers(String questionId) => '/questions/$questionId/answers';
  static String submitAnswer(String questionId) => '/questions/$questionId/answers';
  static String voteAnswer(String answerId) => '/answers/$answerId/vote';

  // Circle endpoints
  static const String circles = '/circles';
  static String getCircle(String circleId) => '/circles/$circleId';
  static const String myCircle = '/circles/me';
  static String inviteToCircle(String userId) => '/circles/invites';
  static String acceptInvite(String inviteId) => '/circles/invites/$inviteId/accept';
  static String rejectInvite(String inviteId) => '/circles/invites/$inviteId/reject';
  static String removeFromCircle(String userId) => '/circles/members/$userId';

  // Group endpoints
  static const String groups = '/groups';
  static String getGroup(String groupId) => '/groups/$groupId';
  static const String createGroup = '/groups';
  static String joinGroup(String groupId) => '/groups/$groupId/join';
  static String leaveGroup(String groupId) => '/groups/$groupId/leave';
  static String getGroupPosts(String groupId) => '/groups/$groupId/posts';

  // Community endpoints
  static const String communityPosts = '/community/posts';
  static String getCommunityPost(String postId) => '/community/posts/$postId';
  static const String createCommunityPost = '/community/posts';
  static String likeCommunityPost(String postId) => '/community/posts/$postId/like';
  static String getCommunityPostComments(String postId) => '/community/posts/$postId/comments';

  // Message endpoints
  static const String conversations = '/messages/conversations';
  static String getConversation(String conversationId) => '/messages/conversations/$conversationId';
  static String sendMessage(String conversationId) => '/messages/conversations/$conversationId/messages';
  static const String createConversation = '/messages/conversations';

  // Notification endpoints
  static const String notifications = '/notifications';
  static String markNotificationRead(String notificationId) => '/notifications/$notificationId/read';
  static const String markAllNotificationsRead = '/notifications/read-all';

  // Upload endpoints
  static const String uploadImage = '/uploads/image';
  static const String uploadImages = '/uploads/images';
}
