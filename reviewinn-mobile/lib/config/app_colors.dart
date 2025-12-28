import 'package:flutter/material.dart';

/// Theme-aware color system
/// Usage: Access via AppColors.of(context) or use the extension context.colors
class AppColors {
  final bool isDark;

  const AppColors({required this.isDark});

  // Background colors
  Color get background => isDark ? const Color(0xFF1F2937) : const Color(0xFFF9FAFB);
  Color get backgroundLight => isDark ? const Color(0xFF374151) : const Color(0xFFF5F5F5);
  Color get cardBackground => isDark ? const Color(0xFF374151) : Colors.white;
  Color get surface => isDark ? const Color(0xFF4B5563) : Colors.white;

  // Text colors
  Color get textPrimary => isDark ? Colors.white : const Color(0xFF1F2937);
  Color get textSecondary => isDark ? const Color(0xFFD1D5DB) : const Color(0xFF6B7280);
  Color get textTertiary => isDark ? const Color(0xFF9CA3AF) : const Color(0xFF9CA3AF);

  // Border colors
  Color get border => isDark ? const Color(0xFF4B5563) : const Color(0xFFE5E7EB);
  Color get borderLight => isDark ? const Color(0xFF374151) : const Color(0xFFF3F4F6);

  // Divider colors
  Color get divider => isDark ? const Color(0xFF374151) : const Color(0xFFE5E7EB);

  // Icon colors
  Color get iconPrimary => isDark ? Colors.white : const Color(0xFF1F2937);
  Color get iconSecondary => isDark ? const Color(0xFF9CA3AF) : const Color(0xFF6B7280);

  // Overlay colors
  Color get overlay => isDark ? Colors.black.withOpacity(0.7) : Colors.black.withOpacity(0.5);
  Color get modalBarrier => isDark ? Colors.black.withOpacity(0.8) : Colors.black.withOpacity(0.6);

  // Semantic colors (same in both themes)
  Color get primary => const Color(0xFF7C3AED); // Purple
  Color get primaryLight => const Color(0xFF8B5CF6);
  Color get success => const Color(0xFF10B981); // Green
  Color get error => const Color(0xFFEF4444); // Red
  Color get warning => const Color(0xFFF59E0B); // Yellow/Orange
  Color get warningDark => const Color(0xFFD97706);
  Color get info => const Color(0xFF3B82F6); // Blue

  // Gradient colors
  LinearGradient get primaryGradient => LinearGradient(
        colors: [primary, primaryLight],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );

  LinearGradient get backgroundGradient => LinearGradient(
        colors: isDark
            ? [const Color(0xFF1F2937), const Color(0xFF111827)]
            : [const Color(0xFFF9FAFB), Colors.white],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );

  // Shadow colors
  Color get shadow => isDark
      ? Colors.black.withOpacity(0.3)
      : Colors.black.withOpacity(0.1);

  Color get shadowHeavy => isDark
      ? Colors.black.withOpacity(0.5)
      : Colors.black.withOpacity(0.15);

  // Input colors
  Color get inputFill => isDark ? const Color(0xFF374151) : const Color(0xFFF9FAFB);
  Color get inputBorder => isDark ? const Color(0xFF4B5563) : const Color(0xFFE5E7EB);
  Color get inputFocusBorder => primary;

  // Shimmer colors (for loading states)
  Color get shimmerBase => isDark ? const Color(0xFF374151) : const Color(0xFFE5E7EB);
  Color get shimmerHighlight => isDark ? const Color(0xFF4B5563) : const Color(0xFFF3F4F6);

  /// Helper method to get AppColors from context
  static AppColors of(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    return AppColors(isDark: brightness == Brightness.dark);
  }
}

/// Extension on BuildContext for easy access to colors
extension AppColorsExtension on BuildContext {
  AppColors get colors => AppColors.of(this);
}
