import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../config/app_colors.dart';

/// A reusable widget for displaying statistics with icon
class StatDisplay extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final Color? iconColor;
  final double iconSize;
  final TextStyle? valueStyle;
  final TextStyle? labelStyle;

  const StatDisplay({
    super.key,
    required this.icon,
    required this.value,
    required this.label,
    this.iconColor,
    this.iconSize = 18,
    this.valueStyle,
    this.labelStyle,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          icon,
          size: iconSize,
          color: iconColor ?? colors.iconSecondary,
        ),
        const SizedBox(width: 4),
        Text(
          value,
          style: valueStyle ?? AppTheme.bodySmall.copyWith(
            color: colors.textSecondary,
          ),
        ),
        if (label.isNotEmpty) ...[
          const SizedBox(width: 2),
          Text(
            label,
            style: labelStyle ?? AppTheme.bodySmall.copyWith(
              color: colors.textSecondary,
            ),
          ),
        ],
      ],
    );
  }
}

/// A vertical stat display (value on top, label below)
class VerticalStatDisplay extends StatelessWidget {
  final String value;
  final String label;
  final Color? valueColor;
  final TextStyle? valueStyle;
  final TextStyle? labelStyle;

  const VerticalStatDisplay({
    super.key,
    required this.value,
    required this.label,
    this.valueColor,
    this.valueStyle,
    this.labelStyle,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          value,
          style: valueStyle ?? AppTheme.headingSmall.copyWith(
            fontSize: 20,
            color: valueColor ?? colors.primary,
          ),
        ),
        Text(
          label,
          style: labelStyle ?? AppTheme.bodySmall.copyWith(
            color: colors.textSecondary,
          ),
        ),
      ],
    );
  }
}
