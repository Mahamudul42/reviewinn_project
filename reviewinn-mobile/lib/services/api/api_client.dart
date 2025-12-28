import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'api_endpoints.dart';

/// HTTP client wrapper for API calls
/// Usage: ApiClient.instance.get(ApiEndpoints.userProfile)
class ApiClient {
  // Singleton instance
  static final ApiClient _instance = ApiClient._internal();
  static ApiClient get instance => _instance;

  ApiClient._internal();

  // Auth token storage
  String? _authToken;

  void setAuthToken(String? token) {
    _authToken = token;
  }

  String? get authToken => _authToken;

  /// Build headers with auth token
  Map<String, String> _buildHeaders({Map<String, String>? additionalHeaders}) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (_authToken != null) {
      headers['Authorization'] = 'Bearer $_authToken';
    }

    if (additionalHeaders != null) {
      headers.addAll(additionalHeaders);
    }

    return headers;
  }

  /// Build full URL
  String _buildUrl(String endpoint) {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    return '${ApiEndpoints.baseUrl}$endpoint';
  }

  /// Handle API response
  ApiResponse<T> _handleResponse<T>(
    http.Response response,
    T Function(dynamic json)? fromJson,
  ) {
    final statusCode = response.statusCode;

    try {
      final jsonBody = response.body.isNotEmpty ? json.decode(response.body) : null;

      if (statusCode >= 200 && statusCode < 300) {
        // Success
        final data = fromJson != null && jsonBody != null ? fromJson(jsonBody) : jsonBody as T?;
        return ApiResponse<T>(
          success: true,
          statusCode: statusCode,
          data: data,
        );
      } else {
        // Error
        final errorMessage = jsonBody?['message'] ?? jsonBody?['error'] ?? 'Request failed';
        return ApiResponse<T>(
          success: false,
          statusCode: statusCode,
          errorMessage: errorMessage,
        );
      }
    } catch (e) {
      return ApiResponse<T>(
        success: false,
        statusCode: statusCode,
        errorMessage: 'Failed to parse response: $e',
      );
    }
  }

  /// GET request
  Future<ApiResponse<T>> get<T>(
    String endpoint, {
    Map<String, String>? queryParams,
    Map<String, String>? headers,
    T Function(dynamic json)? fromJson,
  }) async {
    try {
      var url = _buildUrl(endpoint);

      if (queryParams != null && queryParams.isNotEmpty) {
        final query = queryParams.entries
            .map((e) => '${Uri.encodeComponent(e.key)}=${Uri.encodeComponent(e.value)}')
            .join('&');
        url = '$url?$query';
      }

      final response = await http.get(
        Uri.parse(url),
        headers: _buildHeaders(additionalHeaders: headers),
      );

      return _handleResponse<T>(response, fromJson);
    } on SocketException {
      return ApiResponse<T>(
        success: false,
        errorMessage: 'No internet connection',
      );
    } catch (e) {
      return ApiResponse<T>(
        success: false,
        errorMessage: 'Request failed: $e',
      );
    }
  }

  /// POST request
  Future<ApiResponse<T>> post<T>(
    String endpoint, {
    Map<String, dynamic>? body,
    Map<String, String>? headers,
    T Function(dynamic json)? fromJson,
  }) async {
    try {
      final url = _buildUrl(endpoint);
      final response = await http.post(
        Uri.parse(url),
        headers: _buildHeaders(additionalHeaders: headers),
        body: body != null ? json.encode(body) : null,
      );

      return _handleResponse<T>(response, fromJson);
    } on SocketException {
      return ApiResponse<T>(
        success: false,
        errorMessage: 'No internet connection',
      );
    } catch (e) {
      return ApiResponse<T>(
        success: false,
        errorMessage: 'Request failed: $e',
      );
    }
  }

  /// PUT request
  Future<ApiResponse<T>> put<T>(
    String endpoint, {
    Map<String, dynamic>? body,
    Map<String, String>? headers,
    T Function(dynamic json)? fromJson,
  }) async {
    try {
      final url = _buildUrl(endpoint);
      final response = await http.put(
        Uri.parse(url),
        headers: _buildHeaders(additionalHeaders: headers),
        body: body != null ? json.encode(body) : null,
      );

      return _handleResponse<T>(response, fromJson);
    } on SocketException {
      return ApiResponse<T>(
        success: false,
        errorMessage: 'No internet connection',
      );
    } catch (e) {
      return ApiResponse<T>(
        success: false,
        errorMessage: 'Request failed: $e',
      );
    }
  }

  /// DELETE request
  Future<ApiResponse<T>> delete<T>(
    String endpoint, {
    Map<String, String>? headers,
    T Function(dynamic json)? fromJson,
  }) async {
    try {
      final url = _buildUrl(endpoint);
      final response = await http.delete(
        Uri.parse(url),
        headers: _buildHeaders(additionalHeaders: headers),
      );

      return _handleResponse<T>(response, fromJson);
    } on SocketException {
      return ApiResponse<T>(
        success: false,
        errorMessage: 'No internet connection',
      );
    } catch (e) {
      return ApiResponse<T>(
        success: false,
        errorMessage: 'Request failed: $e',
      );
    }
  }

  /// PATCH request
  Future<ApiResponse<T>> patch<T>(
    String endpoint, {
    Map<String, dynamic>? body,
    Map<String, String>? headers,
    T Function(dynamic json)? fromJson,
  }) async {
    try {
      final url = _buildUrl(endpoint);
      final response = await http.patch(
        Uri.parse(url),
        headers: _buildHeaders(additionalHeaders: headers),
        body: body != null ? json.encode(body) : null,
      );

      return _handleResponse<T>(response, fromJson);
    } on SocketException {
      return ApiResponse<T>(
        success: false,
        errorMessage: 'No internet connection',
      );
    } catch (e) {
      return ApiResponse<T>(
        success: false,
        errorMessage: 'Request failed: $e',
      );
    }
  }
}

/// API Response wrapper
class ApiResponse<T> {
  final bool success;
  final int? statusCode;
  final T? data;
  final String? errorMessage;

  ApiResponse({
    required this.success,
    this.statusCode,
    this.data,
    this.errorMessage,
  });

  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden => statusCode == 403;
  bool get isNotFound => statusCode == 404;
  bool get isServerError => statusCode != null && statusCode! >= 500;
}
