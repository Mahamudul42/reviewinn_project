import 'package:flutter/material.dart';
import '../models/badge_model.dart';
import '../config/app_theme.dart';

class BadgeWidget extends StatelessWidget {
  final BadgeModel badge;
  final bool isCompact;
  final VoidCallback? onTap;

  const BadgeWidget({
    super.key,
    required this.badge,
    this.isCompact = true,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    if (isCompact) {
      return _buildCompactBadge();
    } else {
      return _buildDetailedBadge(context);
    }
  }

  Widget _buildCompactBadge() {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: 12,
          vertical: 6,
        ),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: badge.gradientColors,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: badge.gradientColors.first.withOpacity(0.3),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              badge.icon,
              size: 16,
              color: Colors.white,
            ),
            const SizedBox(width: 4),
            Text(
              badge.title,
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailedBadge(BuildContext context) {
    return InkWell(
      onTap: onTap ?? () => _showBadgeDetails(context),
      borderRadius: AppTheme.radiusMedium,
      child: Container(
        padding: const EdgeInsets.all(AppTheme.spaceM),
        decoration: BoxDecoration(
          color: AppTheme.cardBackground,
          borderRadius: AppTheme.radiusMedium,
          border: Border.all(
            color: badge.gradientColors.first.withOpacity(0.3),
            width: 2,
          ),
          boxShadow: [
            BoxShadow(
              color: badge.gradientColors.first.withOpacity(0.1),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Badge Icon with Gradient Background
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: badge.gradientColors,
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: badge.gradientColors.first.withOpacity(0.4),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Icon(
                badge.icon,
                color: Colors.white,
                size: 32,
              ),
            ),
            const SizedBox(height: AppTheme.spaceS),
            // Badge Title
            Text(
              badge.title,
              style: AppTheme.headingSmall.copyWith(
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            // Badge Description
            Text(
              badge.description,
              style: AppTheme.bodySmall.copyWith(
                color: AppTheme.textSecondary,
                fontSize: 11,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            if (badge.earnedDate != null) ...[
              const SizedBox(height: 4),
              Text(
                _formatDate(badge.earnedDate!),
                style: AppTheme.bodySmall.copyWith(
                  color: AppTheme.textTertiary,
                  fontSize: 10,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);
    
    if (difference.inDays < 7) {
      return 'Earned ${difference.inDays} days ago';
    } else if (difference.inDays < 30) {
      return 'Earned ${(difference.inDays / 7).floor()} weeks ago';
    } else if (difference.inDays < 365) {
      return 'Earned ${(difference.inDays / 30).floor()} months ago';
    } else {
      return 'Earned ${(difference.inDays / 365).floor()} years ago';
    }
  }

  void _showBadgeDetails(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(
          borderRadius: AppTheme.radiusMedium,
        ),
        child: Container(
          padding: const EdgeInsets.all(AppTheme.spaceXL),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Large Badge Icon
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: badge.gradientColors,
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: badge.gradientColors.first.withOpacity(0.4),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Icon(
                  badge.icon,
                  color: Colors.white,
                  size: 50,
                ),
              ),
              const SizedBox(height: AppTheme.spaceL),
              // Badge Title
              Text(
                badge.title,
                style: AppTheme.headingLarge.copyWith(
                  fontSize: 24,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppTheme.spaceS),
              // Badge Description
              Text(
                badge.description,
                style: AppTheme.bodyMedium.copyWith(
                  color: AppTheme.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
              if (badge.earnedDate != null) ...[
                const SizedBox(height: AppTheme.spaceM),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppTheme.spaceM,
                    vertical: AppTheme.spaceS,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.backgroundLight,
                    borderRadius: AppTheme.radiusSmall,
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.calendar_today_rounded,
                        size: 16,
                        color: AppTheme.textSecondary,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _formatDate(badge.earnedDate!),
                        style: AppTheme.bodySmall.copyWith(
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: AppTheme.spaceL),
              // Close Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryPurple,
                    padding: const EdgeInsets.symmetric(
                      vertical: AppTheme.spaceM,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: AppTheme.radiusMedium,
                    ),
                  ),
                  child: Text(
                    'Close',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
