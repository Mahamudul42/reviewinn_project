import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/environment.dart';

/// Network Utilities for handling retries, connectivity, and error handling
class NetworkUtils {
  // Singleton pattern
  static final NetworkUtils _instance = NetworkUtils._internal();
  factory NetworkUtils() => _instance;
  NetworkUtils._internal();

  /// Execute HTTP request with retry logic and exponential backoff
  static Future<T> executeWithRetry<T>(
    Future<T> Function() request, {
    int? maxRetries,
    Duration? initialDelay,
    bool enableLogging = true,
  }) async {
    int retries = maxRetries ?? Environment.maxRetries;
    Duration delay = initialDelay ?? Environment.retryDelay;
    
    for (int attempt = 0; attempt <= retries; attempt++) {
      try {
        if (enableLogging && Environment.enableLogging) {
          debugPrint('🔄 Network request attempt ${attempt + 1}/${retries + 1}');
        }
        
        return await request();
      } catch (e) {
        // Don't retry on last attempt
        if (attempt == retries) {
          if (enableLogging && Environment.enableLogging) {
            debugPrint('❌ Network request failed after ${attempt + 1} attempts: $e');
          }
          rethrow;
        }

        // Check if error is retryable
        if (!_isRetryableError(e)) {
          if (enableLogging && Environment.enableLogging) {
            debugPrint('🚫 Non-retryable error: $e');
          }
          rethrow;
        }

        // Wait before retry with exponential backoff
        final waitTime = delay * (attempt + 1);
        if (enableLogging && Environment.enableLogging) {
          debugPrint('⏳ Retrying in ${waitTime.inSeconds}s...');
        }
        await Future.delayed(waitTime);
      }
    }
    
    throw Exception('Maximum retries exceeded');
  }

  /// Check if error is retryable
  static bool _isRetryableError(dynamic error) {
    if (error is SocketException) {
      return true; // Network issues
    }
    if (error is TimeoutException) {
      return true; // Timeout
    }
    if (error is HttpException) {
      return true; // HTTP errors
    }
    if (error is http.ClientException) {
      return true; // Client errors
    }
    
    // Check for specific error messages
    final errorMessage = error.toString().toLowerCase();
    if (errorMessage.contains('connection refused') ||
        errorMessage.contains('connection reset') ||
        errorMessage.contains('network is unreachable') ||
        errorMessage.contains('connection timed out')) {
      return true;
    }
    
    return false;
  }

  /// Check if device has network connectivity
  static Future<bool> hasInternetConnection() async {
    try {
      // Try to lookup a reliable domain
      final result = await InternetAddress.lookup('google.com')
          .timeout(const Duration(seconds: 5));
      return result.isNotEmpty && result[0].rawAddress.isNotEmpty;
    } catch (e) {
      if (Environment.enableLogging) {
        debugPrint('🌐 No internet connection: $e');
      }
      return false;
    }
  }

  /// Check if specific API is reachable
  static Future<bool> isApiReachable() async {
    try {
      final url = Uri.parse(Environment.apiBaseUrl);
      final response = await http.head(url).timeout(const Duration(seconds: 10));
      return response.statusCode < 500; // API is reachable if not server error
    } catch (e) {
      if (Environment.enableLogging) {
        debugPrint('🔌 API unreachable: $e');
      }
      return false;
    }
  }

  /// Get user-friendly error message
  static String getErrorMessage(dynamic error) {
    if (error is SocketException) {
      return 'No internet connection. Please check your network.';
    }
    if (error is TimeoutException) {
      return 'Request timed out. Please try again.';
    }
    if (error is HttpException) {
      return 'Unable to connect to server. Please try again later.';
    }
    
    // Check for specific error patterns
    final errorMessage = error.toString().toLowerCase();
    if (errorMessage.contains('connection refused')) {
      return 'Server is not responding. Please try again later.';
    }
    if (errorMessage.contains('connection reset')) {
      return 'Connection was interrupted. Please try again.';
    }
    if (errorMessage.contains('network is unreachable')) {
      return 'Network is unreachable. Please check your connection.';
    }
    
    return 'An error occurred. Please try again.';
  }

  /// Debounce function calls (useful for search)
  static Timer? _debounceTimer;
  static void debounce(
    VoidCallback callback, {
    Duration delay = const Duration(milliseconds: 500),
  }) {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(delay, callback);
  }

  /// Throttle function calls (useful for scroll events)
  static DateTime? _lastThrottleTime;
  static void throttle(
    VoidCallback callback, {
    Duration delay = const Duration(milliseconds: 500),
  }) {
    final now = DateTime.now();
    if (_lastThrottleTime == null ||
        now.difference(_lastThrottleTime!) > delay) {
      _lastThrottleTime = now;
      callback();
    }
  }

  /// Cancel any pending debounce/throttle
  static void cancelPending() {
    _debounceTimer?.cancel();
    _lastThrottleTime = null;
  }
}

/// Network Response Wrapper
class NetworkResponse<T> {
  final T? data;
  final String? error;
  final int? statusCode;
  final bool isSuccess;

  NetworkResponse({
    this.data,
    this.error,
    this.statusCode,
    this.isSuccess = false,
  });

  factory NetworkResponse.success(T data, {int? statusCode}) {
    return NetworkResponse(
      data: data,
      isSuccess: true,
      statusCode: statusCode,
    );
  }

  factory NetworkResponse.failure(String error, {int? statusCode}) {
    return NetworkResponse(
      error: error,
      isSuccess: false,
      statusCode: statusCode,
    );
  }
}
