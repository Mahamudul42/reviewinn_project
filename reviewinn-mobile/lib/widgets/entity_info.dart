import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/entity_model.dart';
import '../config/app_theme.dart';
import 'purple_star_rating.dart';

/// Reusable Entity Information Display Component
/// Used in: EntityCard, BeautifulReviewCard
///
/// Displays entity information with consistent structure:
/// 1. Entity Avatar
/// 2. Entity Name
/// 3. Category Breadcrumb (Root → Final)
/// 4. Rating & Review Count
/// 5. Description (optional)
class EntityInfo extends StatelessWidget {
  final String? entityName;
  final String? entityAvatar;
  final String? rootCategoryName;
  final String? finalCategoryName;
  final int? rootCategoryId;
  final int? finalCategoryId;
  final String? rootCategoryIcon;
  final String? finalCategoryIcon;
  final double? rating;
  final int? reviewCount;
  final String? description;

  // Customization options
  final double avatarSize;
  final double nameSize;
  final double ratingSize;
  final bool showDescription;
  final bool showAvatar;
  final bool showVerifiedIcon;
  final int? maxDescriptionLines;

  const EntityInfo({
    super.key,
    this.entityName,
    this.entityAvatar,
    this.rootCategoryName,
    this.finalCategoryName,
    this.rootCategoryId,
    this.finalCategoryId,
    this.rootCategoryIcon,
    this.finalCategoryIcon,
    this.rating,
    this.reviewCount,
    this.description,
    this.avatarSize = 100.0,
    this.nameSize = 18.0,
    this.ratingSize = 18.0,
    this.showDescription = true,
    this.showAvatar = true,
    this.showVerifiedIcon = false,
    this.maxDescriptionLines = 2,
  });

  /// Factory constructor from Entity model
  factory EntityInfo.fromEntity(
    Entity entity, {
    double avatarSize = 100.0,
    double nameSize = 18.0,
    double ratingSize = 18.0,
    bool showDescription = true,
    bool showAvatar = true,
    bool showVerifiedIcon = false,
    int? maxDescriptionLines = 2,
  }) {
    return EntityInfo(
      entityName: entity.name,
      entityAvatar: entity.avatar,
      rootCategoryName: entity.rootCategoryName,
      finalCategoryName: entity.finalCategoryName,
      rootCategoryId: entity.rootCategoryId,
      finalCategoryId: entity.finalCategoryId,
      rootCategoryIcon: entity.rootCategoryIcon,
      finalCategoryIcon: entity.finalCategoryIcon,
      rating: entity.averageRating,
      reviewCount: entity.reviewCount,
      description: entity.description,
      avatarSize: avatarSize,
      nameSize: nameSize,
      ratingSize: ratingSize,
      showDescription: showDescription,
      showAvatar: showAvatar,
      showVerifiedIcon: showVerifiedIcon,
      maxDescriptionLines: maxDescriptionLines,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Entity Avatar
        if (showAvatar) ...[
          _buildAvatar(),
          const SizedBox(width: AppTheme.spaceM),
        ],

        // Entity Details
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Entity Name
              _buildName(),
              const SizedBox(height: 6),

              // 2. Category Breadcrumb
              _buildCategoryBadges(),
              const SizedBox(height: 8),

              // 3. Rating & Review Count
              if (rating != null) ...[
                _buildRating(),
                if (showDescription && description != null)
                  const SizedBox(height: AppTheme.spaceS),
              ],

              // 4. Description
              if (showDescription && description != null)
                _buildDescription(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildAvatar() {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: entityAvatar != null
            ? CachedNetworkImage(
                imageUrl: entityAvatar!,
                width: avatarSize,
                height: avatarSize,
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(
                  width: avatarSize,
                  height: avatarSize,
                  color: AppTheme.backgroundLight,
                  child: Center(
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppTheme.primaryPurple,
                    ),
                  ),
                ),
                errorWidget: (context, url, error) => Container(
                  width: avatarSize,
                  height: avatarSize,
                  color: AppTheme.backgroundLight,
                  child: Icon(
                    Icons.business_rounded,
                    size: avatarSize * 0.4,
                    color: AppTheme.primaryPurple.withOpacity(0.4),
                  ),
                ),
              )
            : Container(
                width: avatarSize,
                height: avatarSize,
                decoration: BoxDecoration(
                  color: AppTheme.primaryPurple.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.business_rounded,
                  size: avatarSize * 0.4,
                  color: AppTheme.primaryPurple,
                ),
              ),
      ),
    );
  }

  Widget _buildName() {
    return Row(
      children: [
        Flexible(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Flexible(
                child: Text(
                  entityName ?? 'Unknown Entity',
                  style: AppTheme.labelMedium.copyWith(
                    fontSize: nameSize,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (showVerifiedIcon) ...[
                const SizedBox(width: 4),
                Icon(
                  Icons.verified,
                  size: 16,
                  color: AppTheme.primaryPurple,
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCategoryBadges() {
    final rootIcon = rootCategoryIcon ?? '📁';
    final finalIcon = finalCategoryIcon ?? '🏷️';

    // If no categories, return empty
    if (rootCategoryName == null && finalCategoryName == null) {
      return const SizedBox.shrink();
    }

    // Check if root and final are the same category
    final isSameCategory = rootCategoryId != null &&
                           finalCategoryId != null &&
                           rootCategoryId == finalCategoryId;

    return Wrap(
      spacing: 6,
      runSpacing: 6,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        // Show only one purple badge if same category
        if (isSameCategory && finalCategoryName != null)
          _buildCategoryBadge(
            finalCategoryName!,
            finalIcon,
            AppTheme.primaryPurple,
          ),

        // Show both categories if different
        if (!isSameCategory) ...[
          // Root Category (Blue)
          if (rootCategoryName != null)
            _buildCategoryBadge(
              rootCategoryName!,
              rootIcon,
              AppTheme.infoBlue,
            ),

          // Arrow separator
          if (rootCategoryName != null && finalCategoryName != null)
            Text(
              '→',
              style: TextStyle(
                fontSize: 11,
                color: AppTheme.textTertiary,
              ),
            ),

          // Final Category (Green)
          if (finalCategoryName != null)
            _buildCategoryBadge(
              finalCategoryName!,
              finalIcon,
              AppTheme.successGreen,
            ),
        ],
      ],
    );
  }

  Widget _buildCategoryBadge(String label, String icon, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: color.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            icon,
            style: TextStyle(fontSize: 10),
          ),
          const SizedBox(width: 3),
          Text(
            label,
            style: AppTheme.labelSmall.copyWith(
              color: color,
              fontWeight: FontWeight.w600,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRating() {
    if (rating == null) {
      return const SizedBox.shrink();
    }

    return Row(
      children: [
        PurpleStarRating(
          rating: rating!,
          size: ratingSize,
          showValue: true,
        ),
        if (reviewCount != null) ...[
          const SizedBox(width: 6),
          Text(
            '($reviewCount review${reviewCount! > 1 ? 's' : ''})',
            style: AppTheme.bodySmall.copyWith(
              color: AppTheme.textTertiary,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildDescription() {
    if (description == null) {
      return const SizedBox.shrink();
    }

    return Text(
      description!,
      style: AppTheme.bodyMedium.copyWith(
        color: AppTheme.textSecondary,
        height: 1.4,
      ),
      maxLines: maxDescriptionLines,
      overflow: TextOverflow.ellipsis,
    );
  }
}
