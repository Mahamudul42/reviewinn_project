import 'package:flutter/material.dart';
import '../config/app_theme.dart';

class PurpleStarRating extends StatelessWidget {
  final double rating;
  final int maxRating;
  final double size;
  final bool showValue;
  final Color? filledColor;
  final Color? emptyColor;

  const PurpleStarRating({
    super.key,
    required this.rating,
    this.maxRating = 5,
    this.size = 20,
    this.showValue = true,
    this.filledColor,
    this.emptyColor,
  });

  @override
  Widget build(BuildContext context) {
    final filled = filledColor ?? AppTheme.primaryPurple; // Use theme color
    final empty = emptyColor ?? const Color(0xFFE5E7EB); // Light gray

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Stars
        ...List.generate(maxRating, (index) {
          final starValue = index + 1;
          final isFilled = rating >= starValue;
          final isPartiallyFilled = rating > index && rating < starValue;

          return Container(
            margin: EdgeInsets.only(right: index < maxRating - 1 ? 2 : 0),
            child: Stack(
              children: [
                // Base star (empty or filled)
                _buildStar(
                  isFilled || isPartiallyFilled ? filled : empty,
                  isFilled,
                ),

                // Partial fill for fractional ratings
                if (isPartiallyFilled)
                  ClipRect(
                    clipper: _StarClipper(rating - index),
                    child: _buildStar(filled, true),
                  ),
              ],
            ),
          );
        }),

        // Rating value
        if (showValue) ...[
          const SizedBox(width: 6),
          Text(
            rating.toStringAsFixed(1),
            style: TextStyle(
              fontSize: size * 0.8,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildStar(Color color, bool isFilled) {
    return Container(
      width: size,
      height: size,
      child: CustomPaint(
        size: Size(size, size),
        painter: _StarPainter(color),
      ),
    );
  }
}

class _StarPainter extends CustomPainter {
  final Color color;

  _StarPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final fillPaint = Paint()
      ..color = color
      ..style = PaintingStyle.fill
      ..isAntiAlias = true; // Smooth edges

    final strokePaint = Paint()
      ..color = color.withOpacity(0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.5
      ..isAntiAlias = true;

    final path = Path();

    // Star path (5-pointed star with smoother design)
    final w = size.width;
    final h = size.height;
    final cx = w / 2;
    final cy = h / 2;

    // Outer radius (slightly smaller for better proportions)
    final outerRadius = w / 2.1;
    // Inner radius (adjusted for more balanced star)
    final innerRadius = w / 4.5;

    for (int i = 0; i < 5; i++) {
      // Outer point
      final outerAngle = (i * 72 - 90) * 3.14159 / 180;
      final outerX = cx + outerRadius * cos(outerAngle);
      final outerY = cy + outerRadius * sin(outerAngle);

      if (i == 0) {
        path.moveTo(outerX, outerY);
      } else {
        path.lineTo(outerX, outerY);
      }

      // Inner point
      final innerAngle = (i * 72 + 36 - 90) * 3.14159 / 180;
      final innerX = cx + innerRadius * cos(innerAngle);
      final innerY = cy + innerRadius * sin(innerAngle);
      path.lineTo(innerX, innerY);
    }

    path.close();

    // Draw filled star
    canvas.drawPath(path, fillPaint);
    // Draw subtle outline
    canvas.drawPath(path, strokePaint);
  }

  @override
  bool shouldRepaint(_StarPainter oldDelegate) => oldDelegate.color != color;

  double cos(double radians) => radians.cos();
  double sin(double radians) => radians.sin();
}

extension on double {
  double cos() => _cos(this);
  double sin() => _sin(this);
}

double _cos(double radians) {
  // Simple cosine approximation
  while (radians > 3.14159) {
    radians -= 2 * 3.14159;
  }
  while (radians < -3.14159) {
    radians += 2 * 3.14159;
  }

  final x = radians;
  return 1 - (x * x) / 2 + (x * x * x * x) / 24 - (x * x * x * x * x * x) / 720;
}

double _sin(double radians) {
  return _cos(radians - 3.14159 / 2);
}

class _StarClipper extends CustomClipper<Rect> {
  final double percentage;

  _StarClipper(this.percentage);

  @override
  Rect getClip(Size size) {
    return Rect.fromLTWH(0, 0, size.width * percentage, size.height);
  }

  @override
  bool shouldReclip(_StarClipper oldClipper) => oldClipper.percentage != percentage;
}
