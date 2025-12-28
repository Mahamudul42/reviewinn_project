import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../config/app_colors.dart';

/// A base card widget with consistent styling across the app
class BaseCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;
  final EdgeInsets? margin;
  final Color? backgroundColor;
  final double borderRadius;
  final Color? borderColor;
  final double? borderWidth;
  final bool withShadow;
  final VoidCallback? onTap;
  final Gradient? gradient;

  const BaseCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.margin = const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
    this.backgroundColor,
    this.borderRadius = 16,
    this.borderColor,
    this.borderWidth,
    this.withShadow = true,
    this.onTap,
    this.gradient,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    final cardWidget = Container(
      margin: margin,
      padding: padding,
      decoration: BoxDecoration(
        color: gradient == null ? (backgroundColor ?? colors.cardBackground) : null,
        gradient: gradient,
        borderRadius: BorderRadius.circular(borderRadius),
        border: borderColor != null || borderWidth != null
            ? Border.all(
                color: borderColor ?? colors.border,
                width: borderWidth ?? 1,
              )
            : null,
        boxShadow: withShadow
            ? [
                BoxShadow(
                  color: colors.shadow,
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
      ),
      child: child,
    );

    if (onTap != null) {
      return InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(borderRadius),
        child: cardWidget,
      );
    }

    return cardWidget;
  }
}

/// A card with gradient background
class GradientCard extends StatelessWidget {
  final Widget child;
  final List<Color> gradientColors;
  final EdgeInsets? padding;
  final EdgeInsets? margin;
  final double borderRadius;
  final Color? borderColor;
  final double? borderWidth;
  final VoidCallback? onTap;

  const GradientCard({
    super.key,
    required this.child,
    required this.gradientColors,
    this.padding = const EdgeInsets.all(16),
    this.margin = const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
    this.borderRadius = 16,
    this.borderColor,
    this.borderWidth = 1.5,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return BaseCard(
      padding: padding,
      margin: margin,
      borderRadius: borderRadius,
      borderColor: borderColor,
      borderWidth: borderWidth,
      onTap: onTap,
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: gradientColors,
      ),
      child: child,
    );
  }
}
