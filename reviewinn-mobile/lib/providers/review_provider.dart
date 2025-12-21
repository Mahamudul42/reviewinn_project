import 'package:flutter/material.dart';
import '../models/review_model.dart';
import '../services/api_service.dart';
import '../services/mock_data.dart';
import '../config/api_config.dart';
import '../config/app_config.dart';

class ReviewProvider with ChangeNotifier {
  final ApiService _api = ApiService();

  List<Review> _reviews = [];
  List<Review> _entityReviews = [];
  Review? _selectedReview;
  bool _isLoading = false;
  bool _isLoadingMore = false;
  String? _error;

  // Pagination
  int _currentPage = 1;
  static const int _pageSize = 15;
  bool _hasMoreReviews = true;

  List<Review> get reviews => _reviews;
  List<Review> get entityReviews => _entityReviews;
  Review? get selectedReview => _selectedReview;
  bool get isLoading => _isLoading;
  bool get isLoadingMore => _isLoadingMore;
  bool get hasMoreReviews => _hasMoreReviews;
  String? get error => _error;

  // Fetch all reviews with pagination
  Future<void> fetchReviews({Map<String, dynamic>? filters, bool refresh = false}) async {
    print('📱 fetchReviews called - START (refresh: $refresh)');

    if (refresh) {
      _currentPage = 1;
      _reviews = [];
      _hasMoreReviews = true;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    // Check if we should use mock data (configurable in app_config.dart)
    if (AppConfig.useMockData) {
      try {
        print('📱 Loading reviews from database mock data (page $_currentPage)...');
        await Future.delayed(const Duration(milliseconds: 500)); // Simulate loading

        final allReviews = MockData.getMockReviews(0); // Get all reviews
        final startIndex = (_currentPage - 1) * _pageSize;
        final endIndex = startIndex + _pageSize;

        if (startIndex < allReviews.length) {
          final pageReviews = allReviews.sublist(
            startIndex,
            endIndex > allReviews.length ? allReviews.length : endIndex,
          );
          _reviews.addAll(pageReviews);
          _hasMoreReviews = endIndex < allReviews.length;
          print('📱 Loaded ${pageReviews.length} reviews (Total: ${_reviews.length}/${allReviews.length})');
        } else {
          _hasMoreReviews = false;
          print('📱 No more reviews to load');
        }

        _error = null;
        _isLoading = false;
        notifyListeners();
        print('📱 fetchReviews completed - SUCCESS');
        return;
      } catch (e, stackTrace) {
        print('📱 ERROR loading mock data: $e');
        print('📱 Stack trace: $stackTrace');
        _error = 'Error loading mock data: $e';
        _isLoading = false;
        notifyListeners();
        return;
      }
    }

    // Use real API if useMockData is false
    try {
      // Use the homepage reviews endpoint like the React frontend
      String endpoint = '/homepage/reviews?page=1&limit=15';
      if (filters != null && filters.isNotEmpty) {
        final query = Uri(queryParameters: filters).query;
        endpoint = '$endpoint&$query';
      }

      final response = await _api.get(endpoint, includeAuth: false);

      // Handle the response format from backend: { success: true, data: [...], pagination: {...} }
      if (response is Map && response['success'] == true && response.containsKey('data')) {
        final reviewsData = response['data'] as List;
        _reviews = reviewsData.map((json) {
          // Extract entity category data
          final entity = json['entity'];
          String? entityRootCategoryName;
          int? entityRootCategoryId;
          String? entityRootCategoryIcon;
          String? entityFinalCategoryName;
          int? entityFinalCategoryId;
          String? entityFinalCategoryIcon;

          if (entity != null) {
            if (entity['root_category'] != null && entity['root_category'] is Map) {
              entityRootCategoryName = entity['root_category']['name'];
              entityRootCategoryId = entity['root_category']['id'];
              entityRootCategoryIcon = entity['root_category']['icon'];
            } else {
              entityRootCategoryName = entity['root_category_name'];
              entityRootCategoryId = entity['root_category_id'];
              entityRootCategoryIcon = entity['root_category_icon'];
            }

            if (entity['final_category'] != null && entity['final_category'] is Map) {
              entityFinalCategoryName = entity['final_category']['name'];
              entityFinalCategoryId = entity['final_category']['id'];
              entityFinalCategoryIcon = entity['final_category']['icon'];
            } else {
              entityFinalCategoryName = entity['final_category_name'];
              entityFinalCategoryId = entity['final_category_id'];
              entityFinalCategoryIcon = entity['final_category_icon'];
            }
          }

          // Extract group data if present
          int? groupId;
          String? groupName;
          String? groupAvatar;
          String? reviewScope;

          if (json['group'] != null && json['group'] is Map) {
            groupId = json['group']['group_id'];
            groupName = json['group']['name'];
            groupAvatar = json['group']['avatar'];
          } else {
            groupId = json['group_id'];
            groupName = json['group_name'];
            groupAvatar = json['group_avatar'];
          }
          reviewScope = json['review_scope'] ?? 'public';

          // Transform backend format to Flutter model format
          return Review(
            reviewId: json['review_id'],
            title: json['title'] ?? '',
            content: json['content'] ?? '',
            rating: (json['overall_rating'] ?? 0).toDouble(),
            username: json['user']?['name'] ?? 'Anonymous',
            userAvatar: json['user']?['avatar'],
            entityId: entity?['entity_id'] ?? 0,
            entityName: entity?['name'],
            entityAvatar: entity?['avatar'],
            entityRootCategoryName: entityRootCategoryName,
            entityRootCategoryId: entityRootCategoryId,
            entityRootCategoryIcon: entityRootCategoryIcon,
            entityFinalCategoryName: entityFinalCategoryName,
            entityFinalCategoryId: entityFinalCategoryId,
            entityFinalCategoryIcon: entityFinalCategoryIcon,
            entityReviewCount: entity?['review_count'],
            entityAverageRating: entity?['average_rating']?.toDouble(),
            likesCount: json['reaction_count'] ?? 0,
            commentsCount: json['comment_count'] ?? 0,
            createdAt: json['created_at'] != null
                ? DateTime.parse(json['created_at'])
                : DateTime.now(),
            pros: json['pros'] != null ? List<String>.from(json['pros']) : null,
            cons: json['cons'] != null ? List<String>.from(json['cons']) : null,
            images: json['images'] != null ? List<String>.from(json['images']) : null,
            groupId: groupId,
            groupName: groupName,
            groupAvatar: groupAvatar,
            reviewScope: reviewScope,
          );
        }).toList();
      } else if (response is List) {
        _reviews = response.map((json) => Review.fromJson(json)).toList();
      } else if (response is Map && response.containsKey('results')) {
        _reviews = (response['results'] as List)
            .map((json) => Review.fromJson(json))
            .toList();
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      // Fallback to mock data from database if API fails
      if (AppConfig.showDebugInfo) {
        print('API Error: $e - Falling back to mock data from database');
      }
      _reviews = MockData.getMockReviews(0); // Get all reviews (entityId = 0 means all)
      _error = null; // Don't show error when mock data loads successfully
      _isLoading = false;
      notifyListeners();
    }
  }

  // Fetch reviews for a specific entity
  Future<void> fetchEntityReviews(int entityId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.get(
        ApiConfig.entityReviews(entityId),
        includeAuth: false,
      );

      if (response is List) {
        _entityReviews = response.map((json) => Review.fromJson(json)).toList();
      } else if (response is Map && response.containsKey('results')) {
        _entityReviews = (response['results'] as List)
            .map((json) => Review.fromJson(json))
            .toList();
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      // Fallback to mock data if API fails
      _entityReviews = MockData.getMockReviews(entityId);
      _error = null; // Don't show error for reviews, just use mock data
      _isLoading = false;
      notifyListeners();
    }
  }

  // Fetch single review
  Future<void> fetchReview(int reviewId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.get(
        ApiConfig.reviewDetail(reviewId),
        includeAuth: false,
      );
      _selectedReview = Review.fromJson(response);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  // Submit a review
  Future<bool> submitReview(Map<String, dynamic> reviewData) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _api.post(ApiConfig.reviews, body: reviewData);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Load more reviews (pagination)
  Future<void> loadMoreReviews({Map<String, dynamic>? filters}) async {
    if (_isLoadingMore || !_hasMoreReviews) {
      print('📱 loadMoreReviews skipped (isLoading: $_isLoadingMore, hasMore: $_hasMoreReviews)');
      return;
    }

    print('📱 loadMoreReviews called - Loading page ${_currentPage + 1}');
    _isLoadingMore = true;
    _currentPage++;
    notifyListeners();

    await fetchReviews(filters: filters);

    _isLoadingMore = false;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  // Toggle like on a review
  Future<void> toggleLike(int reviewId) async {
    // Find the review in the list
    final index = _reviews.indexWhere((r) => r.reviewId == reviewId);
    if (index == -1) return;

    final review = _reviews[index];
    final wasLiked = review.isLiked ?? false;
    final currentLikes = review.likesCount ?? 0;

    // Optimistic update
    _reviews[index] = review.copyWith(
      isLiked: !wasLiked,
      likesCount: wasLiked ? currentLikes - 1 : currentLikes + 1,
    );
    notifyListeners();

    try {
      // Make API call
      final endpoint = wasLiked ? '/reviews/$reviewId/unlike' : '/reviews/$reviewId/like';
      await _api.post(endpoint, includeAuth: true);
    } catch (e) {
      // Revert on error
      _reviews[index] = review;
      notifyListeners();
      print('Error toggling like: $e');
    }
  }
}
