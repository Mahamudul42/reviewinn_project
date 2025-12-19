import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/entity_model.dart';
import '../config/app_theme.dart';
import 'purple_star_rating.dart';

class EntityCard extends StatefulWidget {
  final Entity entity;
  final VoidCallback onTap;

  const EntityCard({
    super.key,
    required this.entity,
    required this.onTap,
  });

  @override
  State<EntityCard> createState() => _EntityCardState();
}

class _EntityCardState extends State<EntityCard> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: AppTheme.spaceL),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Colors.white,
              _isHovered ? Colors.grey.shade50 : Colors.white,
            ],
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: _isHovered
                ? AppTheme.accentYellow.withOpacity(0.4)
                : AppTheme.accentYellow.withOpacity(0.15),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: AppTheme.accentYellow.withOpacity(_isHovered ? 0.12 : 0.06),
              blurRadius: _isHovered ? 20 : 12,
              offset: Offset(0, _isHovered ? 8 : 4),
              spreadRadius: 0,
            ),
            BoxShadow(
              color: Colors.black.withOpacity(_isHovered ? 0.06 : 0.03),
              blurRadius: _isHovered ? 12 : 8,
              offset: Offset(0, _isHovered ? 4 : 2),
              spreadRadius: 0,
            ),
          ],
        ),
        child: InkWell(
          onTap: widget.onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(AppTheme.spaceL),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Entity Image - Larger and more prominent
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: widget.entity.avatar != null
                        ? CachedNetworkImage(
                            imageUrl: widget.entity.avatar!,
                            width: 100,
                            height: 100,
                            fit: BoxFit.cover,
                            placeholder: (context, url) => Container(
                              width: 100,
                              height: 100,
                              color: AppTheme.backgroundLight,
                              child: Center(
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: AppTheme.primaryPurple,
                                ),
                              ),
                            ),
                            errorWidget: (context, url, error) => Container(
                              width: 100,
                              height: 100,
                              color: AppTheme.backgroundLight,
                              child: Icon(
                                Icons.business_rounded,
                                size: 40,
                                color: AppTheme.textTertiary,
                              ),
                            ),
                          )
                        : Container(
                            width: 100,
                            height: 100,
                            color: AppTheme.backgroundLight,
                            child: Icon(
                              Icons.business_rounded,
                              size: 40,
                              color: AppTheme.textTertiary,
                            ),
                          ),
                  ),
                ),
                const SizedBox(width: AppTheme.spaceL),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Entity Name
                      Text(
                        widget.entity.name,
                        style: AppTheme.headingSmall.copyWith(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 6),

                      // Category Breadcrumb - Root and Final Categories
                      _buildCategoryBreadcrumb(),
                      const SizedBox(height: AppTheme.spaceM),

                      // Rating
                      if (widget.entity.averageRating != null)
                        Row(
                          children: [
                            PurpleStarRating(
                              rating: widget.entity.averageRating!,
                              size: 18,
                              showValue: true,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              '(${widget.entity.reviewCount ?? 0} reviews)',
                              style: AppTheme.bodySmall.copyWith(
                                color: AppTheme.textTertiary,
                              ),
                            ),
                          ],
                        ),

                      // Description
                      if (widget.entity.description != null) ...[
                        const SizedBox(height: AppTheme.spaceS),
                        Text(
                          widget.entity.description!,
                          style: AppTheme.bodyMedium.copyWith(
                            color: AppTheme.textSecondary,
                            height: 1.4,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),

                // Arrow icon
                Icon(
                  Icons.chevron_right_rounded,
                  color: AppTheme.textTertiary,
                  size: 24,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCategoryBreadcrumb() {
    final rootCategory = widget.entity.rootCategoryName;
    final finalCategory = widget.entity.finalCategoryName;
    final rootCategoryId = widget.entity.rootCategoryId;
    final finalCategoryId = widget.entity.finalCategoryId;
    final rootIcon = widget.entity.rootCategoryIcon ?? '📁';
    final finalIcon = widget.entity.finalCategoryIcon ?? '🏷️';

    // If no hierarchical categories, show legacy category
    if (rootCategory == null && finalCategory == null) {
      if (widget.entity.categoryName != null) {
        return Container(
          padding: const EdgeInsets.symmetric(
            horizontal: 10,
            vertical: 4,
          ),
          decoration: BoxDecoration(
            color: AppTheme.accentYellow.withOpacity(0.15),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(
            widget.entity.categoryName!,
            style: AppTheme.labelSmall.copyWith(
              color: AppTheme.accentYellowDark,
              fontWeight: FontWeight.w600,
            ),
          ),
        );
      }
      return const SizedBox.shrink();
    }

    // Check if root and final are the same
    final isSameCategory = rootCategoryId != null &&
                           finalCategoryId != null &&
                           rootCategoryId == finalCategoryId;

    return Wrap(
      spacing: 6,
      runSpacing: 6,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        // Show only one purple badge if root and final are the same
        if (isSameCategory && finalCategory != null)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppTheme.primaryPurple.withOpacity(0.15),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(
                color: AppTheme.primaryPurple.withOpacity(0.3),
                width: 1,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  finalIcon,
                  style: const TextStyle(fontSize: 12),
                ),
                const SizedBox(width: 4),
                Text(
                  finalCategory,
                  style: AppTheme.labelSmall.copyWith(
                    color: AppTheme.primaryPurple,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),

        // Show both categories if they're different
        if (!isSameCategory) ...[
          // Root Category (Blue)
          if (rootCategory != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.infoBlue.withOpacity(0.15),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(
                  color: AppTheme.infoBlue.withOpacity(0.3),
                  width: 1,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    rootIcon,
                    style: const TextStyle(fontSize: 12),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    rootCategory,
                    style: AppTheme.labelSmall.copyWith(
                      color: AppTheme.infoBlue,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),

          // Arrow separator
          if (rootCategory != null && finalCategory != null)
            Text(
              '→',
              style: TextStyle(
                fontSize: 12,
                color: AppTheme.textTertiary,
              ),
            ),

          // Final Category (Green)
          if (finalCategory != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.successGreen.withOpacity(0.15),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(
                  color: AppTheme.successGreen.withOpacity(0.3),
                  width: 1,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    finalIcon,
                    style: const TextStyle(fontSize: 12),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    finalCategory,
                    style: AppTheme.labelSmall.copyWith(
                      color: AppTheme.successGreen,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ],
    );
  }
}
