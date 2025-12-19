import 'package:flutter/material.dart';
import '../models/entity_model.dart';
import '../services/api_service.dart';
import '../services/mock_data.dart';
import '../config/api_config.dart';

class EntityProvider with ChangeNotifier {
  final ApiService _api = ApiService();

  List<Entity> _entities = [];
  Entity? _selectedEntity;
  bool _isLoading = false;
  String? _error;

  List<Entity> get entities => _entities;
  Entity? get selectedEntity => _selectedEntity;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Fetch entities
  Future<void> fetchEntities({Map<String, dynamic>? filters}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      String endpoint = ApiConfig.entities;
      if (filters != null && filters.isNotEmpty) {
        final query = Uri(queryParameters: filters).query;
        endpoint = '$endpoint?$query';
      }

      final response = await _api.get(endpoint, includeAuth: false);

      if (response is List) {
        _entities = response.map((json) => Entity.fromJson(json)).toList();
      } else if (response is Map && response.containsKey('results')) {
        _entities = (response['results'] as List)
            .map((json) => Entity.fromJson(json))
            .toList();
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      // Fallback to mock data if API fails
      _entities = MockData.getMockEntities();
      _error = null; // Don't show error when mock data loads successfully
      _isLoading = false;
      notifyListeners();
    }
  }

  // Fetch single entity
  Future<void> fetchEntity(int entityId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.get(
        ApiConfig.entityDetail(entityId),
        includeAuth: false,
      );
      _selectedEntity = Entity.fromJson(response);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      // Fallback to mock data if API fails
      final mockEntities = MockData.getMockEntities();
      _selectedEntity = mockEntities.firstWhere(
        (entity) => entity.entityId == entityId,
        orElse: () => mockEntities.first,
      );
      _error = null; // Don't show error when mock data loads successfully
      _isLoading = false;
      notifyListeners();
    }
  }

  // Search entities
  Future<List<Entity>> searchEntities(String query) async {
    try {
      final response = await _api.get(
        '${ApiConfig.entitySearch}?query=$query',
        includeAuth: false,
      );

      if (response is List) {
        return response.map((json) => Entity.fromJson(json)).toList();
      } else if (response is Map && response.containsKey('results')) {
        return (response['results'] as List)
            .map((json) => Entity.fromJson(json))
            .toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
