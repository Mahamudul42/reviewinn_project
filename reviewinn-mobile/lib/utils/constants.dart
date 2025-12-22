/// App-wide constants
class AppConstants {
  // App Info
  static const String appName = 'ReviewInn';
  static const String appVersion = '1.0.0';
  static const String appBuildNumber = '1';

  // Storage Keys
  static const String keyAuthToken = 'auth_token';
  static const String keyUserId = 'user_id';
  static const String keyUserData = 'user_data';
  static const String keyOnboardingCompleted = 'onboarding_completed';
  static const String keyThemeMode = 'theme_mode';
  static const String keyLanguage = 'language';
  static const String keyNotificationsEnabled = 'notifications_enabled';

  // Pagination
  static const int defaultPageSize = 15;
  static const int maxPageSize = 50;

  // Timeouts (in seconds)
  static const int defaultTimeout = 30;
  static const int longTimeout = 60;
  static const int shortTimeout = 10;

  // Image Limits
  static const int maxImageSizeMB = 10;
  static const int maxImagesPerReview = 10;
  static const int imageQuality = 85; // 0-100

  // Text Limits
  static const int maxReviewTitleLength = 200;
  static const int maxReviewContentLength = 5000;
  static const int maxBioLength = 160;
  static const int maxCommentLength = 500;

  // Rating
  static const double minRating = 0.0;
  static const double maxRating = 5.0;

  // URLs
  static const String termsOfServiceUrl = 'https://reviewinn.com/terms';
  static const String privacyPolicyUrl = 'https://reviewinn.com/privacy';
  static const String supportEmail = 'support@reviewinn.com';
  static const String websiteUrl = 'https://reviewinn.com';

  // Social Media
  static const String twitterUrl = 'https://twitter.com/reviewinn';
  static const String facebookUrl = 'https://facebook.com/reviewinn';
  static const String instagramUrl = 'https://instagram.com/reviewinn';

  // Error Messages
  static const String errorGeneric = 'Something went wrong. Please try again.';
  static const String errorNetwork = 'No internet connection. Please check your network.';
  static const String errorServer = 'Server error. Please try again later.';
  static const String errorUnauthorized = 'Session expired. Please login again.';
  static const String errorNotFound = 'Resource not found.';
  static const String errorTimeout = 'Request timed out. Please try again.';

  // Success Messages
  static const String successReviewPosted = 'Review posted successfully!';
  static const String successReviewUpdated = 'Review updated successfully!';
  static const String successReviewDeleted = 'Review deleted successfully!';
  static const String successProfileUpdated = 'Profile updated successfully!';
  static const String successPasswordChanged = 'Password changed successfully!';

  // Cache Duration (in hours)
  static const int cacheReviews = 1;
  static const int cacheEntities = 6;
  static const int cacheUserProfile = 24;
  static const int cacheSettings = 168; // 1 week

  // Animation Durations (in milliseconds)
  static const int animationFast = 150;
  static const int animationNormal = 300;
  static const int animationSlow = 500;

  // Debounce/Throttle (in milliseconds)
  static const int searchDebounce = 500;
  static const int scrollThrottle = 200;
  static const int apiCallThrottle = 1000;

  // Retry Configuration
  static const int maxRetries = 3;
  static const int retryDelaySeconds = 2;

  // Regular Expressions
  static final RegExp emailRegex = RegExp(
    r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
  );
  static final RegExp usernameRegex = RegExp(r'^[a-zA-Z0-9_]{3,30}$');
  static final RegExp urlRegex = RegExp(
    r'^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$',
  );

  // Date Formats
  static const String dateFormatFull = 'MMMM d, yyyy';
  static const String dateFormatShort = 'MMM d';
  static const String dateFormatWithTime = 'MMM d, yyyy h:mm a';
  static const String timeFormat = 'h:mm a';
}
