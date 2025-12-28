import 'package:flutter/material.dart';
import '../../config/app_theme.dart';

/// A reusable badge widget for displaying status or labels
class StatusBadge extends StatelessWidget {
  final String label;
  final Color color;
  final IconData? icon;
  final double iconSize;
  final double fontSize;
  final EdgeInsets padding;
  final double borderRadius;
  final double? borderWidth;

  const StatusBadge({
    super.key,
    required this.label,
    required this.color,
    this.icon,
    this.iconSize = 12,
    this.fontSize = 11,
    this.padding = const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
    this.borderRadius = 4,
    this.borderWidth,
  });

  /// Factory for success badge
  factory StatusBadge.success({
    required String label,
    IconData? icon,
  }) {
    return StatusBadge(
      label: label,
      color: AppTheme.successGreen,
      icon: icon,
    );
  }

  /// Factory for error badge
  factory StatusBadge.error({
    required String label,
    IconData? icon,
  }) {
    return StatusBadge(
      label: label,
      color: AppTheme.errorRed,
      icon: icon,
    );
  }

  /// Factory for warning badge
  factory StatusBadge.warning({
    required String label,
    IconData? icon,
  }) {
    return StatusBadge(
      label: label,
      color: AppTheme.accentYellow,
      icon: icon,
    );
  }

  /// Factory for info badge
  factory StatusBadge.info({
    required String label,
    IconData? icon,
  }) {
    return StatusBadge(
      label: label,
      color: AppTheme.infoBlue,
      icon: icon,
    );
  }

  /// Factory for primary badge
  factory StatusBadge.primary({
    required String label,
    IconData? icon,
  }) {
    return StatusBadge(
      label: label,
      color: AppTheme.primaryPurple,
      icon: icon,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(borderRadius),
        border: borderWidth != null
            ? Border.all(
                color: color.withOpacity(0.3),
                width: borderWidth!,
              )
            : null,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(
              icon,
              size: iconSize,
              color: color,
            ),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: fontSize,
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
