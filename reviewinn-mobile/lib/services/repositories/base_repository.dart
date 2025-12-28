import '../api/api_client.dart';

/// Base repository class with common functionality
/// All repositories should extend this class
abstract class BaseRepository {
  final ApiClient apiClient;

  BaseRepository({ApiClient? apiClient})
      : apiClient = apiClient ?? ApiClient.instance;

  /// Handle repository errors consistently
  Exception handleError(ApiResponse response) {
    if (response.isUnauthorized) {
      return UnauthorizedException(response.errorMessage ?? 'Unauthorized');
    } else if (response.isForbidden) {
      return ForbiddenException(response.errorMessage ?? 'Forbidden');
    } else if (response.isNotFound) {
      return NotFoundException(response.errorMessage ?? 'Not found');
    } else if (response.isServerError) {
      return ServerException(response.errorMessage ?? 'Server error');
    } else {
      return ApiException(response.errorMessage ?? 'Request failed');
    }
  }

  /// Check if response is successful, throw exception if not
  T checkResponse<T>(ApiResponse<T> response) {
    if (response.success && response.data != null) {
      return response.data!;
    }
    throw handleError(response);
  }
}

/// Custom exceptions
class ApiException implements Exception {
  final String message;
  ApiException(this.message);

  @override
  String toString() => message;
}

class UnauthorizedException extends ApiException {
  UnauthorizedException(super.message);
}

class ForbiddenException extends ApiException {
  ForbiddenException(super.message);
}

class NotFoundException extends ApiException {
  NotFoundException(super.message);
}

class ServerException extends ApiException {
  ServerException(super.message);
}

class NetworkException extends ApiException {
  NetworkException(super.message);
}
