/// Environment Configuration
/// 
/// Run with different environments:
/// flutter run --dart-define=ENVIRONMENT=dev
/// flutter run --dart-define=ENVIRONMENT=staging
/// flutter run --dart-define=ENVIRONMENT=prod
/// 
/// Or set default in VS Code launch.json:
/// "args": ["--dart-define=ENVIRONMENT=dev"]

class Environment {
  // Get environment from build arguments
  static const String _environment = String.fromEnvironment(
    'ENVIRONMENT',
    defaultValue: 'dev',
  );

  // Environment-specific API URLs
  static String get apiBaseUrl {
    switch (_environment) {
      case 'prod':
        return const String.fromEnvironment(
          'API_URL',
          defaultValue: 'https://api.reviewinn.com/api/v1',
        );
      case 'staging':
        return const String.fromEnvironment(
          'API_URL',
          defaultValue: 'https://staging-api.reviewinn.com/api/v1',
        );
      case 'dev':
      default:
        return const String.fromEnvironment(
          'API_URL',
          defaultValue: 'http://localhost:8000/api/v1',
        );
    }
  }

  // Get current environment name
  static String get name => _environment;

  // Environment checks
  static bool get isDev => _environment == 'dev';
  static bool get isStaging => _environment == 'staging';
  static bool get isProd => _environment == 'prod';

  // Feature flags based on environment
  static bool get useMockData => const bool.fromEnvironment(
        'USE_MOCK_DATA',
        defaultValue: true,
      ) || isDev;

  static bool get enableLogging => !isProd;
  static bool get enableDebugBanner => isDev;

  // Timeout configurations
  static Duration get connectionTimeout {
    if (isProd) {
      return const Duration(seconds: 30);
    }
    return const Duration(seconds: 60); // Longer timeout for dev
  }

  static Duration get receiveTimeout {
    if (isProd) {
      return const Duration(seconds: 30);
    }
    return const Duration(seconds: 60);
  }

  // API retry configuration
  static int get maxRetries => isProd ? 3 : 1;
  static Duration get retryDelay => const Duration(seconds: 1);

  // Print environment info
  static void printInfo() {
    if (enableLogging) {
      print('🌍 Environment: $name');
      print('🔗 API Base URL: $apiBaseUrl');
      print('📊 Mock Data: $useMockData');
      print('🔧 Logging Enabled: $enableLogging');
      print('⏱️ Connection Timeout: ${connectionTimeout.inSeconds}s');
      print('🔄 Max Retries: $maxRetries');
    }
  }
}
