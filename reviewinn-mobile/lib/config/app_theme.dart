import 'package:flutter/material.dart';

// ============================================================================
// CHANGE THIS TO SWITCH THEMES - Available: purple, emerald, teal, coral, cyan, rose
// ============================================================================
const String CURRENT_THEME = 'purple';  // 👈 Change this to test different colors!
// ============================================================================

// ============================================================================
// DARK MODE SETTING
// ============================================================================
bool _isDarkMode = false;  // Global dark mode state

void setDarkMode(bool value) {
  _isDarkMode = value;
}

bool get isDarkMode => _isDarkMode;
// ============================================================================

enum ThemeColor {
  purple,
  emerald,
  teal,
  coral,
  cyan,
  rose,
  orange,
}

class ColorScheme {
  final Color primary;
  final Color primaryDark;
  final Color primaryLight;
  final String name;

  const ColorScheme({
    required this.primary,
    required this.primaryDark,
    required this.primaryLight,
    required this.name,
  });
}

class AppThemeConfig {
  static final Map<String, ColorScheme> themes = {
    'purple': const ColorScheme(
      primary: Color(0xFF7C3AED), // purple-600
      primaryDark: Color(0xFF6D28D9), // purple-700
      primaryLight: Color(0xFF8B5CF6), // purple-500
      name: 'Purple',
    ),
    'emerald': const ColorScheme(
      primary: Color(0xFF10B981), // emerald-500
      primaryDark: Color(0xFF059669), // emerald-600
      primaryLight: Color(0xFF34D399), // emerald-400
      name: 'Emerald Green',
    ),
    'teal': const ColorScheme(
      primary: Color(0xFF14B8A6), // teal-500
      primaryDark: Color(0xFF0D9488), // teal-600
      primaryLight: Color(0xFF2DD4BF), // teal-400
      name: 'Teal',
    ),
    'coral': const ColorScheme(
      primary: Color(0xFFF87171), // red-400 (coral-ish)
      primaryDark: Color(0xFFEF4444), // red-500
      primaryLight: Color(0xFFFCA5A5), // red-300
      name: 'Coral',
    ),
    'cyan': const ColorScheme(
      primary: Color(0xFF06B6D4), // cyan-500
      primaryDark: Color(0xFF0891B2), // cyan-600
      primaryLight: Color(0xFF22D3EE), // cyan-400
      name: 'Cyan',
    ),
    'rose': const ColorScheme(
      primary: Color(0xFFF43F5E), // rose-500
      primaryDark: Color(0xFFE11D48), // rose-600
      primaryLight: Color(0xFFFB7185), // rose-400
      name: 'Rose',
    ),
    'orange': const ColorScheme(
      primary: Color(0xFFF97316), // orange-500
      primaryDark: Color(0xFFEA580C), // orange-600
      primaryLight: Color(0xFFFB923C), // orange-400
      name: 'Orange',
    ),
  };

  static ColorScheme get currentTheme => themes[CURRENT_THEME] ?? themes['purple']!;
}

class AppTheme {
  // Dynamic Primary Colors - Based on selected theme
  static Color get primaryPurple => AppThemeConfig.currentTheme.primary;
  static Color get primaryPurpleDark => AppThemeConfig.currentTheme.primaryDark;
  static Color get primaryPurpleLight => AppThemeConfig.currentTheme.primaryLight;

  // Accent Colors
  static const Color accentYellow = Color(0xFFEAB308); // yellow-500
  static const Color accentYellowLight = Color(0xFFFCD34D); // yellow-300
  static const Color accentYellowDark = Color(0xFFCA8A04); // yellow-600

  // Gradients (Dynamic based on theme)
  static LinearGradient get purpleGradient => LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      AppThemeConfig.currentTheme.primary,
      AppThemeConfig.currentTheme.primaryDark,
    ],
  );

  static const LinearGradient yellowGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFFFEFCE8), // yellow-50
      Color(0xFFFFFFFF), // white
    ],
  );

  static const LinearGradient purpleLightGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFFF3E8FF), // purple-50
      Color(0xFFFFFFFF), // white
    ],
  );

  static const LinearGradient greenGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF10B981), // green-500
      Color(0xFF059669), // green-600
    ],
  );

  // Text Colors
  static Color get textPrimary => _isDarkMode ? const Color(0xFFF9FAFB) : const Color(0xFF1F2937); // gray-800 / gray-50
  static Color get textSecondary => _isDarkMode ? const Color(0xFFD1D5DB) : const Color(0xFF6B7280); // gray-500 / gray-300
  static Color get textTertiary => _isDarkMode ? const Color(0xFF9CA3AF) : const Color(0xFF9CA3AF); // gray-400

  // Background Colors
  static Color get backgroundLight => _isDarkMode ? const Color(0xFF111827) : const Color(0xFFFAFAFA); // gray-900 / gray-50
  static Color get backgroundWhite => _isDarkMode ? const Color(0xFF1F2937) : const Color(0xFFFFFFFF); // gray-800 / white
  static Color get cardBackground => _isDarkMode ? const Color(0xFF1F2937) : const Color(0xFFFFFFFF); // gray-800 / white

  // Border Colors
  static Color get borderLight => _isDarkMode ? const Color(0xFF374151) : const Color(0xFFE5E7EB); // gray-700 / gray-200
  static Color get borderMedium => _isDarkMode ? const Color(0xFF4B5563) : const Color(0xFFD1D5DB); // gray-600 / gray-300
  static Color get border => borderLight; // Alias for borderLight

  // Status Colors
  static const Color successGreen = Color(0xFF10B981); // green-500
  static const Color errorRed = Color(0xFFEF4444); // red-500
  static const Color warningOrange = Color(0xFFF59E0B); // orange-500
  static const Color infoBlue = Color(0xFF3B82F6); // blue-500

  // Shadows
  static List<BoxShadow> get cardShadow => [
    BoxShadow(
      color: Colors.black.withOpacity(0.08),
      blurRadius: 10,
      offset: const Offset(0, 4),
      spreadRadius: 0,
    ),
  ];

  static List<BoxShadow> get cardShadowHover => [
    BoxShadow(
      color: Colors.black.withOpacity(0.12),
      blurRadius: 16,
      offset: const Offset(0, 6),
      spreadRadius: 0,
    ),
  ];

  static List<BoxShadow> get yellowGlowShadow => [
    BoxShadow(
      color: accentYellow.withOpacity(0.3),
      blurRadius: 0,
      spreadRadius: 2,
      offset: const Offset(0, 0),
    ),
    BoxShadow(
      color: Colors.black.withOpacity(0.1),
      blurRadius: 10,
      spreadRadius: 2,
      offset: const Offset(0, 4),
    ),
  ];

  static List<BoxShadow> get purpleGlowShadow => [
    BoxShadow(
      color: AppThemeConfig.currentTheme.primary.withOpacity(0.3),
      blurRadius: 12,
      spreadRadius: 0,
      offset: const Offset(0, 4),
    ),
  ];

  // Text Styles
  static TextStyle get headingLarge => TextStyle(
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: textPrimary,
    letterSpacing: -0.5,
  );

  static TextStyle get headingMedium => TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.bold,
    color: textPrimary,
    letterSpacing: -0.3,
  );

  static TextStyle get headingSmall => TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w700,
    color: textPrimary,
  );

  static TextStyle get bodyLarge => TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.normal,
    color: textPrimary,
    height: 1.6,
  );

  static TextStyle get bodyMedium => TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.normal,
    color: textSecondary,
    height: 1.5,
  );

  static TextStyle get bodySmall => TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.normal,
    color: textTertiary,
  );

  static TextStyle get labelLarge => TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    color: textPrimary,
  );

  static TextStyle get labelMedium => TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    color: textPrimary,
  );

  static TextStyle get labelSmall => TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w600,
    color: textSecondary,
  );

  // Border Radius
  static BorderRadius get radiusSmall => BorderRadius.circular(8);
  static BorderRadius get radiusMedium => BorderRadius.circular(12);
  static BorderRadius get radiusLarge => BorderRadius.circular(16);
  static BorderRadius get radiusXLarge => BorderRadius.circular(20);

  // Spacing
  static const double spaceXS = 4;
  static const double spaceS = 8;
  static const double spaceM = 12;
  static const double spaceL = 16;
  static const double spaceXL = 24;
  static const double spaceXXL = 32;
}
