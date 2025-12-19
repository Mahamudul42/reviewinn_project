/// Application Configuration
///
/// Control whether to use mock data or real API
class AppConfig {
  // Set this to true to use mock data, false to use real backend API
  static const bool useMockData = true;

  // Set this to true to show debug info
  static const bool showDebugInfo = true;

  // Animation durations
  static const int defaultAnimationDuration = 300;
  static const int fastAnimationDuration = 150;
  static const int slowAnimationDuration = 500;

  // UI Constants
  static const double borderRadiusSmall = 8.0;
  static const double borderRadiusMedium = 12.0;
  static const double borderRadiusLarge = 16.0;

  static const double paddingSmall = 8.0;
  static const double paddingMedium = 16.0;
  static const double paddingLarge = 24.0;
}
