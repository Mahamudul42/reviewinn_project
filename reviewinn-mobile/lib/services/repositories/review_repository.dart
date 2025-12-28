import '../../models/review_model.dart';
import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import 'base_repository.dart';

/// Review repository for review-related API calls
/// Example usage in provider:
/// ```dart
/// final reviewRepo = ReviewRepository();
/// final reviews = await reviewRepo.getEntityReviews(entityId);
/// ```
class ReviewRepository extends BaseRepository {
  ReviewRepository({super.apiClient});

  /// Get reviews for an entity
  Future<List<Review>> getEntityReviews(
    String entityId, {
    int page = 1,
    int limit = 20,
    String? rating,
  }) async {
    final response = await apiClient.get<List<Review>>(
      ApiEndpoints.getEntityReviews(entityId),
      queryParams: {
        'page': page.toString(),
        'limit': limit.toString(),
        if (rating != null) 'rating': rating,
      },
      fromJson: (json) => (json['data'] as List)
          .map((reviewJson) => Review.fromJson(reviewJson))
          .toList(),
    );
    return checkResponse(response);
  }

  /// Get single review
  Future<Review> getReview(String reviewId) async {
    final response = await apiClient.get<Review>(
      ApiEndpoints.getReview(reviewId),
      fromJson: (json) => Review.fromJson(json['data']),
    );
    return checkResponse(response);
  }

  /// Create a new review
  Future<Review> createReview({
    required String entityId,
    required int rating,
    String? title,
    String? content,
    List<String>? images,
    List<String>? tags,
  }) async {
    final response = await apiClient.post<Review>(
      ApiEndpoints.createReview,
      body: {
        'entity_id': entityId,
        'rating': rating,
        if (title != null) 'title': title,
        if (content != null) 'content': content,
        if (images != null && images.isNotEmpty) 'images': images,
        if (tags != null && tags.isNotEmpty) 'tags': tags,
      },
      fromJson: (json) => Review.fromJson(json['data']),
    );
    return checkResponse(response);
  }

  /// Update a review
  Future<Review> updateReview(
    String reviewId, {
    int? rating,
    String? title,
    String? content,
    List<String>? images,
    List<String>? tags,
  }) async {
    final response = await apiClient.put<Review>(
      ApiEndpoints.updateReview(reviewId),
      body: {
        if (rating != null) 'rating': rating,
        if (title != null) 'title': title,
        if (content != null) 'content': content,
        if (images != null) 'images': images,
        if (tags != null) 'tags': tags,
      },
      fromJson: (json) => Review.fromJson(json['data']),
    );
    return checkResponse(response);
  }

  /// Delete a review
  Future<void> deleteReview(String reviewId) async {
    final response = await apiClient.delete(
      ApiEndpoints.deleteReview(reviewId),
    );
    checkResponse(response);
  }

  /// Like a review
  Future<void> likeReview(String reviewId) async {
    final response = await apiClient.post(
      ApiEndpoints.likeReview(reviewId),
    );
    checkResponse(response);
  }

  /// Unlike a review
  Future<void> unlikeReview(String reviewId) async {
    final response = await apiClient.delete(
      ApiEndpoints.unlikeReview(reviewId),
    );
    checkResponse(response);
  }
}
