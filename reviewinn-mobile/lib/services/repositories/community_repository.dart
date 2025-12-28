import '../../models/community_post_model.dart';
import '../../models/comment_model.dart';
import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import 'base_repository.dart';

/// Community repository for community post-related API calls
/// Example usage in provider:
/// ```dart
/// final communityRepo = CommunityRepository();
/// final posts = await communityRepo.getCommunityPosts();
/// ```
class CommunityRepository extends BaseRepository {
  CommunityRepository({super.apiClient});

  /// Get community posts
  Future<List<CommunityPost>> getCommunityPosts({
    int page = 1,
    int limit = 20,
    String? sortBy, // 'latest', 'trending', 'popular'
    String? tag,
  }) async {
    final response = await apiClient.get<List<CommunityPost>>(
      ApiEndpoints.communityPosts,
      queryParams: {
        'page': page.toString(),
        'limit': limit.toString(),
        if (sortBy != null) 'sort_by': sortBy,
        if (tag != null) 'tag': tag,
      },
      fromJson: (json) => (json['data'] as List)
          .map((postJson) => CommunityPost.fromJson(postJson))
          .toList(),
    );
    return checkResponse(response);
  }

  /// Get single community post
  Future<CommunityPost> getCommunityPost(String postId) async {
    final response = await apiClient.get<CommunityPost>(
      ApiEndpoints.getCommunityPost(postId),
      fromJson: (json) => CommunityPost.fromJson(json['data']),
    );
    return checkResponse(response);
  }

  /// Create a community post
  Future<CommunityPost> createCommunityPost({
    required String title,
    required String content,
    List<String>? images,
    List<String>? tags,
    String? entityId,
  }) async {
    final response = await apiClient.post<CommunityPost>(
      ApiEndpoints.createCommunityPost,
      body: {
        'title': title,
        'content': content,
        if (images != null && images.isNotEmpty) 'images': images,
        if (tags != null && tags.isNotEmpty) 'tags': tags,
        if (entityId != null) 'entity_id': entityId,
      },
      fromJson: (json) => CommunityPost.fromJson(json['data']),
    );
    return checkResponse(response);
  }

  /// Like a community post
  Future<void> likeCommunityPost(String postId) async {
    final response = await apiClient.post(
      ApiEndpoints.likeCommunityPost(postId),
    );
    checkResponse(response);
  }

  /// Unlike a community post (DELETE like)
  Future<void> unlikeCommunityPost(String postId) async {
    final response = await apiClient.delete(
      ApiEndpoints.likeCommunityPost(postId),
    );
    checkResponse(response);
  }

  /// Get comments for a community post
  Future<List<Comment>> getPostComments(String postId, {int page = 1, int limit = 50}) async {
    final response = await apiClient.get<List<Comment>>(
      ApiEndpoints.getCommunityPostComments(postId),
      queryParams: {
        'page': page.toString(),
        'limit': limit.toString(),
      },
      fromJson: (json) => (json['data'] as List)
          .map((commentJson) => Comment.fromJson(commentJson))
          .toList(),
    );
    return checkResponse(response);
  }

  /// Add comment to a community post
  Future<Comment> addComment(String postId, String content, {String? parentCommentId}) async {
    final response = await apiClient.post<Comment>(
      ApiEndpoints.getCommunityPostComments(postId),
      body: {
        'content': content,
        if (parentCommentId != null) 'parent_comment_id': parentCommentId,
      },
      fromJson: (json) => Comment.fromJson(json['data']),
    );
    return checkResponse(response);
  }
}
