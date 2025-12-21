import 'package:flutter/foundation.dart';
import '../models/review_model.dart';
import '../models/entity_model.dart';

class BookmarkProvider with ChangeNotifier {
  final Set<int> _bookmarkedReviewIds = {};
  final Set<int> _bookmarkedEntityIds = {};
  final Map<int, Review> _bookmarkedReviews = {};
  final Map<int, Entity> _bookmarkedEntities = {};

  Set<int> get bookmarkedReviewIds => _bookmarkedReviewIds;
  Set<int> get bookmarkedEntityIds => _bookmarkedEntityIds;
  List<Review> get bookmarkedReviews => _bookmarkedReviews.values.toList();
  List<Entity> get bookmarkedEntities => _bookmarkedEntities.values.toList();

  bool isReviewBookmarked(int reviewId) => _bookmarkedReviewIds.contains(reviewId);
  bool isEntityBookmarked(int entityId) => _bookmarkedEntityIds.contains(entityId);

  void toggleReviewBookmark(Review review) {
    if (_bookmarkedReviewIds.contains(review.reviewId)) {
      _bookmarkedReviewIds.remove(review.reviewId);
      _bookmarkedReviews.remove(review.reviewId);
    } else {
      _bookmarkedReviewIds.add(review.reviewId);
      _bookmarkedReviews[review.reviewId] = review;
    }
    notifyListeners();
    _saveBookmarks();
  }

  void toggleEntityBookmark(Entity entity) {
    if (_bookmarkedEntityIds.contains(entity.entityId)) {
      _bookmarkedEntityIds.remove(entity.entityId);
      _bookmarkedEntities.remove(entity.entityId);
    } else {
      _bookmarkedEntityIds.add(entity.entityId);
      _bookmarkedEntities[entity.entityId] = entity;
    }
    notifyListeners();
    _saveBookmarks();
  }

  void removeReviewBookmark(int reviewId) {
    _bookmarkedReviewIds.remove(reviewId);
    _bookmarkedReviews.remove(reviewId);
    notifyListeners();
    _saveBookmarks();
  }

  void removeEntityBookmark(int entityId) {
    _bookmarkedEntityIds.remove(entityId);
    _bookmarkedEntities.remove(entityId);
    notifyListeners();
    _saveBookmarks();
  }

  void clearAllBookmarks() {
    _bookmarkedReviewIds.clear();
    _bookmarkedEntityIds.clear();
    _bookmarkedReviews.clear();
    _bookmarkedEntities.clear();
    notifyListeners();
    _saveBookmarks();
  }

  Future<void> _saveBookmarks() async {
    // TODO: Save to local storage or API
    // For now, just in-memory
  }

  Future<void> loadBookmarks() async {
    // TODO: Load from local storage or API
    // For now, just in-memory
  }
}
