import '../../models/user_model.dart';
import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import 'base_repository.dart';

/// User repository for user-related API calls
/// Example usage in provider:
/// ```dart
/// final userRepo = UserRepository();
/// final user = await userRepo.getUserProfile(userId);
/// ```
class UserRepository extends BaseRepository {
  UserRepository({super.apiClient});

  /// Get current user profile
  Future<User> getCurrentUserProfile() async {
    final response = await apiClient.get<User>(
      ApiEndpoints.userProfile,
      fromJson: (json) => User.fromJson(json['data']),
    );
    return checkResponse(response);
  }

  /// Get user profile by ID
  Future<User> getUserProfile(String userId) async {
    final response = await apiClient.get<User>(
      ApiEndpoints.getUserProfile(userId),
      fromJson: (json) => User.fromJson(json['data']),
    );
    return checkResponse(response);
  }

  /// Update current user profile
  Future<User> updateProfile({
    String? displayName,
    String? bio,
    String? location,
  }) async {
    final response = await apiClient.put<User>(
      ApiEndpoints.updateProfile,
      body: {
        if (displayName != null) 'display_name': displayName,
        if (bio != null) 'bio': bio,
        if (location != null) 'location': location,
      },
      fromJson: (json) => User.fromJson(json['data']),
    );
    return checkResponse(response);
  }

  /// Follow a user
  Future<void> followUser(String userId) async {
    final response = await apiClient.post(
      ApiEndpoints.followUser(userId),
    );
    checkResponse(response);
  }

  /// Unfollow a user
  Future<void> unfollowUser(String userId) async {
    final response = await apiClient.delete(
      ApiEndpoints.unfollowUser(userId),
    );
    checkResponse(response);
  }

  /// Get user followers
  Future<List<User>> getUserFollowers(String userId, {int page = 1, int limit = 20}) async {
    final response = await apiClient.get<List<User>>(
      ApiEndpoints.getUserFollowers(userId),
      queryParams: {
        'page': page.toString(),
        'limit': limit.toString(),
      },
      fromJson: (json) => (json['data'] as List)
          .map((userJson) => User.fromJson(userJson))
          .toList(),
    );
    return checkResponse(response);
  }

  /// Get user following
  Future<List<User>> getUserFollowing(String userId, {int page = 1, int limit = 20}) async {
    final response = await apiClient.get<List<User>>(
      ApiEndpoints.getUserFollowing(userId),
      queryParams: {
        'page': page.toString(),
        'limit': limit.toString(),
      },
      fromJson: (json) => (json['data'] as List)
          .map((userJson) => User.fromJson(userJson))
          .toList(),
    );
    return checkResponse(response);
  }
}
