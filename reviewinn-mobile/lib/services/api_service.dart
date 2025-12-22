import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../config/environment.dart';
import '../services/storage_service.dart';
import '../utils/network_utils.dart';
import '../utils/logger.dart';

class ApiService {
  final StorageService _storage = StorageService();

  // Get headers with auth token
  Future<Map<String, String>> _getHeaders({bool includeAuth = true}) async {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (includeAuth) {
      final token = await _storage.getToken();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    return headers;
  }

  // Generic GET request
  Future<dynamic> get(String endpoint, {bool includeAuth = true}) async {
    final url = Uri.parse(ApiConfig.buildUrl(endpoint));
    final startTime = Logger.startTimer('GET $endpoint');
    
    try {
      Logger.apiRequest('GET', endpoint);
      
      return await NetworkUtils.executeWithRetry(() async {
        final headers = await _getHeaders(includeAuth: includeAuth);
        
        final response = await http
            .get(url, headers: headers)
            .timeout(Environment.connectionTimeout);

        final result = _handleResponse(response);
        Logger.apiResponse(response.statusCode, endpoint);
        Logger.endTimer('GET $endpoint', startTime);
        return result;
      });
    } catch (e) {
      Logger.error('GET request failed', tag: 'ApiService', error: e);
      throw _handleError(e);
    }
  }

  // Generic POST request
  Future<dynamic> post(
    String endpoint, {
    Map<String, dynamic>? body,
    bool includeAuth = true,
  }) async {
    final url = Uri.parse(ApiConfig.buildUrl(endpoint));
    final startTime = Logger.startTimer('POST $endpoint');
    
    try {
      Logger.apiRequest('POST', endpoint, body: body);
      
      return await NetworkUtils.executeWithRetry(() async {
        final headers = await _getHeaders(includeAuth: includeAuth);
        
        final response = await http
            .post(
              url,
              headers: headers,
              body: body != null ? json.encode(body) : null,
            )
            .timeout(Environment.connectionTimeout);

        final result = _handleResponse(response);
        Logger.apiResponse(response.statusCode, endpoint);
        Logger.endTimer('POST $endpoint', startTime);
        return result;
      }, maxRetries: 1); // Don't retry POST by default (not idempotent)
    } catch (e) {
      Logger.error('POST request failed', tag: 'ApiService', error: e);
      throw _handleError(e);
    }
  }

  // Generic PUT request
  Future<dynamic> put(
    String endpoint, {
    Map<String, dynamic>? body,
    bool includeAuth = true,
  }) async {
    try {
      final url = Uri.parse(ApiConfig.buildUrl(endpoint));
      final headers = await _getHeaders(includeAuth: includeAuth);

      final response = await http
          .put(
            url,
            headers: headers,
            body: body != null ? json.encode(body) : null,
          )
          .timeout(ApiConfig.connectionTimeout);

      return _handleResponse(response);
    } catch (e) {
      throw _handleError(e);
    }
  }

  // Generic DELETE request
  Future<dynamic> delete(String endpoint, {bool includeAuth = true}) async {
    try {
      final url = Uri.parse(ApiConfig.buildUrl(endpoint));
      final headers = await _getHeaders(includeAuth: includeAuth);

      final response = await http
          .delete(url, headers: headers)
          .timeout(ApiConfig.connectionTimeout);

      return _handleResponse(response);
    } catch (e) {
      throw _handleError(e);
    }
  }

  // Handle API response
  dynamic _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return null;
      return json.decode(response.body);
    } else {
      throw ApiException(
        statusCode: response.statusCode,
        message: _extractErrorMessage(response),
      );
    }
  }

  // Extract error message from response
  String _extractErrorMessage(http.Response response) {
    try {
      final body = json.decode(response.body);
      if (body is Map && body.containsKey('message')) {
        return body['message'];
      }
      if (body is Map && body.containsKey('error')) {
        return body['error'];
      }
      if (body is Map && body.containsKey('detail')) {
        return body['detail'];
      }
      return 'Request failed with status: ${response.statusCode}';
    } catch (e) {
      return 'Request failed with status: ${response.statusCode}';
    }
  }

  // Handle errors
  String _handleError(dynamic error) {
    if (error is ApiException) {
      return error.message;
    }
    return NetworkUtils.getErrorMessage(error);
  }
}

// Custom API Exception
class ApiException implements Exception {
  final int statusCode;
  final String message;

  ApiException({required this.statusCode, required this.message});

  @override
  String toString() => message;
}
