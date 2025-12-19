import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/entity_model.dart';
import '../models/review_model.dart';

class DatabaseService {
  // Direct PostgreSQL query via psql command
  static Future<List<Entity>> getEntitiesFromDatabase() async {
    try {
      // This would need to be implemented with a proper backend API
      // For now, return empty to fall back to mock data
      return [];
    } catch (e) {
      return [];
    }
  }

  // Try backend API first
  static Future<List<Entity>> getEntities() async {
    try {
      final response = await http
          .get(
            Uri.parse('http://localhost:8000/api/v1/entities?limit=20'),
          )
          .timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => Entity.fromJson(json)).toList();
      }
    } catch (e) {
      // Fallback to database or mock data
    }
    return [];
  }

  static Future<List<Review>> getReviews() async {
    try {
      final response = await http
          .get(
            Uri.parse('http://localhost:8000/api/v1/reviews?limit=20'),
          )
          .timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => Review.fromJson(json)).toList();
      }
    } catch (e) {
      // Fallback
    }
    return [];
  }
}
