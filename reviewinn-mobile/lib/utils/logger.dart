import 'package:flutter/foundation.dart';
import '../config/environment.dart';

/// Centralized logging utility
/// Helps with debugging and can be integrated with crash reporting
class Logger {
  // ANSI color codes for terminal
  static const String _reset = '\x1B[0m';
  static const String _red = '\x1B[31m';
  static const String _green = '\x1B[32m';
  static const String _yellow = '\x1B[33m';
  static const String _blue = '\x1B[34m';
  static const String _magenta = '\x1B[35m';
  static const String _cyan = '\x1B[36m';

  /// Log info message
  static void info(String message, {String? tag}) {
    if (!Environment.enableLogging) return;
    final prefix = tag != null ? '[$tag] ' : '';
    debugPrint('$_blue📘 INFO: $prefix$message$_reset');
  }

  /// Log success message
  static void success(String message, {String? tag}) {
    if (!Environment.enableLogging) return;
    final prefix = tag != null ? '[$tag] ' : '';
    debugPrint('$_green✅ SUCCESS: $prefix$message$_reset');
  }

  /// Log warning message
  static void warning(String message, {String? tag}) {
    if (!Environment.enableLogging) return;
    final prefix = tag != null ? '[$tag] ' : '';
    debugPrint('$_yellow⚠️  WARNING: $prefix$message$_reset');
  }

  /// Log error message
  static void error(String message, {String? tag, dynamic error, StackTrace? stackTrace}) {
    if (!Environment.enableLogging) return;
    final prefix = tag != null ? '[$tag] ' : '';
    debugPrint('$_red❌ ERROR: $prefix$message$_reset');
    if (error != null) {
      debugPrint('$_red   └─ Error: $error$_reset');
    }
    if (stackTrace != null) {
      debugPrint('$_red   └─ Stack: ${stackTrace.toString().split('\n').take(5).join('\n')}$_reset');
    }
  }

  /// Log debug message
  static void debug(String message, {String? tag}) {
    if (!Environment.enableLogging || !Environment.isDev) return;
    final prefix = tag != null ? '[$tag] ' : '';
    debugPrint('$_cyan🔧 DEBUG: $prefix$message$_reset');
  }

  /// Log API request
  static void apiRequest(String method, String endpoint, {Map<String, dynamic>? body}) {
    if (!Environment.enableLogging) return;
    debugPrint('$_magenta🌐 API Request: $method $endpoint$_reset');
    if (body != null && body.isNotEmpty) {
      debugPrint('$_magenta   └─ Body: $body$_reset');
    }
  }

  /// Log API response
  static void apiResponse(int statusCode, String endpoint, {dynamic data}) {
    if (!Environment.enableLogging) return;
    final color = statusCode >= 200 && statusCode < 300 ? _green : _red;
    debugPrint('$color🌐 API Response: $statusCode $endpoint$_reset');
    if (data != null && Environment.isDev) {
      final dataStr = data.toString();
      final preview = dataStr.length > 200 ? '${dataStr.substring(0, 200)}...' : dataStr;
      debugPrint('$color   └─ Data: $preview$_reset');
    }
  }

  /// Log navigation event
  static void navigation(String from, String to) {
    if (!Environment.enableLogging) return;
    debugPrint('$_blue🧭 Navigation: $from → $to$_reset');
  }

  /// Log user action
  static void userAction(String action, {Map<String, dynamic>? details}) {
    if (!Environment.enableLogging) return;
    debugPrint('$_cyan👤 User Action: $action$_reset');
    if (details != null && details.isNotEmpty) {
      debugPrint('$_cyan   └─ Details: $details$_reset');
    }
  }

  /// Log performance metric
  static void performance(String operation, Duration duration) {
    if (!Environment.enableLogging) return;
    final ms = duration.inMilliseconds;
    final color = ms < 100 ? _green : (ms < 500 ? _yellow : _red);
    debugPrint('$color⚡ Performance: $operation took ${ms}ms$_reset');
  }

  /// Log cache hit/miss
  static void cache(String key, bool hit) {
    if (!Environment.enableLogging || !Environment.isDev) return;
    final status = hit ? '✅ HIT' : '❌ MISS';
    debugPrint('$_cyan💾 Cache $status: $key$_reset');
  }

  /// Start timer for performance tracking
  static DateTime startTimer(String operation) {
    if (Environment.enableLogging) {
      debugPrint('$_yellow⏱️  Timer START: $operation$_reset');
    }
    return DateTime.now();
  }

  /// End timer and log duration
  static void endTimer(String operation, DateTime startTime) {
    final duration = DateTime.now().difference(startTime);
    performance(operation, duration);
  }

  /// Log separator for better readability
  static void separator() {
    if (!Environment.enableLogging) return;
    debugPrint('$_cyan${'─' * 60}$_reset');
  }

  /// Log section header
  static void section(String title) {
    if (!Environment.enableLogging) return;
    debugPrint('');
    debugPrint('$_cyan╔${'═' * 58}╗$_reset');
    debugPrint('$_cyan║  $title${' ' * (56 - title.length)}║$_reset');
    debugPrint('$_cyan╚${'═' * 58}╝$_reset');
  }
}
