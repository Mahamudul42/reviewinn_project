import '../models/entity_model.dart';
import '../models/review_model.dart';
import 'real_database_mock.dart';

class MockData {
  static List<Entity> getMockEntities() {
    // Return real data from your PostgreSQL database
    return RealDatabaseMock.getRealEntities();
  }

  static List<Review> getMockReviews(int entityId) {
    // Return real reviews from your PostgreSQL database
    final allReviews = RealDatabaseMock.getRealReviews();
    // Filter reviews for specific entity, or return all if entityId is 0
    if (entityId == 0) {
      return allReviews;
    }
    return allReviews.where((review) => review.entityId == entityId).toList();
  }
}
