import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/app_theme.dart';
import '../../config/app_colors.dart';
import '../../models/review_model.dart';

/// Beautiful preview card for review links shared in community posts
class ReviewLinkPreview extends StatelessWidget {
  final Review review;
  final VoidCallback? onTap;

  const ReviewLinkPreview({
    super.key,
    required this.review,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(top: 12),
        decoration: BoxDecoration(
          color: colors.cardBackground,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: AppTheme.primaryPurple.withOpacity(0.3),
            width: 2,
          ),
          boxShadow: [
            BoxShadow(
              color: AppTheme.primaryPurple.withOpacity(0.1),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with "Shared Review" badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppTheme.primaryPurple.withOpacity(0.1),
                    AppTheme.primaryPurple.withOpacity(0.05),
                  ],
                ),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(14),
                  topRight: Radius.circular(14),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.link_rounded,
                    size: 16,
                    color: AppTheme.primaryPurple,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'Shared Review',
                    style: AppTheme.bodySmall.copyWith(
                      color: AppTheme.primaryPurple,
                      fontWeight: FontWeight.bold,
                      fontSize: 11,
                    ),
                  ),
                  const Spacer(),
                  Icon(
                    Icons.open_in_new,
                    size: 14,
                    color: AppTheme.primaryPurple.withOpacity(0.6),
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Entity avatar
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: CachedNetworkImage(
                      imageUrl: review.entityAvatar ?? '',
                      width: 80,
                      height: 80,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        color: colors.shimmerBase,
                        child: Center(
                          child: Icon(
                            Icons.business,
                            color: colors.iconSecondary,
                            size: 32,
                          ),
                        ),
                      ),
                      errorWidget: (context, url, error) => Container(
                        color: colors.shimmerBase,
                        child: Icon(
                          Icons.broken_image,
                          color: colors.iconSecondary,
                          size: 32,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(width: 12),

                  // Review details
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Entity name
                        Text(
                          review.entityName,
                          style: AppTheme.bodyMedium.copyWith(
                            color: colors.textPrimary,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),

                        const SizedBox(height: 4),

                        // Rating
                        Row(
                          children: [
                            ...List.generate(5, (index) {
                              final starValue = index + 1;
                              if (review.rating >= starValue) {
                                return Icon(
                                  Icons.star,
                                  size: 16,
                                  color: AppTheme.accentYellow,
                                );
                              } else if (review.rating >= starValue - 0.5) {
                                return Icon(
                                  Icons.star_half,
                                  size: 16,
                                  color: AppTheme.accentYellow,
                                );
                              } else {
                                return Icon(
                                  Icons.star_border,
                                  size: 16,
                                  color: colors.border,
                                );
                              }
                            }),
                            const SizedBox(width: 6),
                            Text(
                              review.rating.toStringAsFixed(1),
                              style: AppTheme.bodySmall.copyWith(
                                color: colors.textSecondary,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 8),

                        // Review title
                        if (review.title != null && review.title!.isNotEmpty)
                          Text(
                            review.title!,
                            style: AppTheme.bodySmall.copyWith(
                              color: colors.textPrimary,
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),

                        const SizedBox(height: 6),

                        // Reviewer info
                        Row(
                          children: [
                            Text(
                              'by ${review.username}',
                              style: AppTheme.bodySmall.copyWith(
                                color: colors.textSecondary,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Footer with stats
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: colors.backgroundLight,
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(14),
                  bottomRight: Radius.circular(14),
                ),
              ),
              child: Row(
                children: [
                  _buildStat(Icons.thumb_up_outlined, review.likesCount.toString(), colors),
                  const SizedBox(width: 16),
                  _buildStat(Icons.comment_outlined, review.commentsCount.toString(), colors),
                  const SizedBox(width: 16),
                  _buildStat(Icons.visibility_outlined, review.viewCount.toString(), colors),
                  const Spacer(),
                  Text(
                    'Tap to view',
                    style: AppTheme.bodySmall.copyWith(
                      color: AppTheme.primaryPurple,
                      fontWeight: FontWeight.w600,
                      fontSize: 11,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Icon(
                    Icons.arrow_forward_ios,
                    size: 10,
                    color: AppTheme.primaryPurple,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStat(IconData icon, String value, AppColors colors) {
    return Row(
      children: [
        Icon(
          icon,
          size: 14,
          color: colors.iconSecondary,
        ),
        const SizedBox(width: 4),
        Text(
          value,
          style: AppTheme.bodySmall.copyWith(
            color: colors.textSecondary,
            fontSize: 11,
          ),
        ),
      ],
    );
  }
}
