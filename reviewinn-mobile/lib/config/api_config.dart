class ApiConfig {
  // Change this to your backend URL
  // For development: Use your computer's IP address (not localhost) when running on a physical device
  // For production: Use your production API URL
  static const String baseUrl = 'http://localhost:8000/api/v1';

  // Timeout configurations
  static const Duration connectionTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);

  // API Endpoints
  static const String login = '/auth-production/login';
  static const String register = '/auth-production/register';
  static const String logout = '/auth-production/logout';
  static const String profile = '/auth-production/profile';

  // Entities
  static const String entities = '/entities';
  static String entityDetail(int id) => '/entities/$id';
  static String entityReviews(int id) => '/entities/$id/reviews';

  // Reviews
  static const String reviews = '/reviews';
  static String reviewDetail(int id) => '/reviews/$id';

  // Search
  static const String search = '/search';
  static const String entitySearch = '/entities/search';

  // Groups
  static const String groups = '/groups';
  static String groupDetail(String id) => '/groups/$id';

  // User
  static String userProfile(int id) => '/users/$id';
  static const String currentUser = '/users/me';

  // Get base URL with proper formatting
  static String get apiBaseUrl {
    return baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
  }

  // Helper to build full URL
  static String buildUrl(String endpoint) {
    final cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/$endpoint';
    return '$apiBaseUrl$cleanEndpoint';
  }
}
