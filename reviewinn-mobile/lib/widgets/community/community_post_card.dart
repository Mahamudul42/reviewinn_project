import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/app_theme.dart';
import '../../config/app_colors.dart';
import '../../models/community_post_model.dart';
import '../../models/review_model.dart';
import '../../utils/formatters/date_formatter.dart';
import '../../utils/formatters/number_formatter.dart';
import '../../services/mock_data.dart';
import 'review_link_preview.dart';

/// Beautifully designed community post card with review link preview support
class CommunityPostCard extends StatelessWidget {
  final CommunityPost post;
  final VoidCallback? onTap;
  final VoidCallback? onLikeTap;
  final VoidCallback? onReviewPreviewTap;

  const CommunityPostCard({
    super.key,
    required this.post,
    this.onTap,
    this.onLikeTap,
    this.onReviewPreviewTap,
  });

  /// Extracts review ID from review links in the post content
  /// Returns null if no review link found
  String? _extractReviewId(String content) {
    // Match patterns like: reviewinn.com/review/123 or /review/123
    final reviewLinkPattern = RegExp(r'(?:reviewinn\.com)?/review/(\d+)');
    final match = reviewLinkPattern.firstMatch(content);
    return match?.group(1);
  }

  /// Get review from ID using mock data
  /// In production, this would fetch from provider or API
  Review? _getReviewFromId(String reviewId) {
    try {
      final int id = int.parse(reviewId);
      // Get all reviews from mock data (entityId: 0 means all reviews)
      final allReviews = MockData.getMockReviews(0);

      // Find the review with matching ID
      final review = allReviews.firstWhere(
        (r) => r.reviewId == id,
        orElse: () => allReviews.first, // Fallback to first review if ID not found
      );

      return review;
    } catch (e) {
      // If parsing fails or no reviews found, return null
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    // Check if post contains review link
    final reviewId = _extractReviewId(post.content);
    final linkedReview = reviewId != null ? _getReviewFromId(reviewId) : null;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: colors.cardBackground,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: colors.border.withOpacity(0.1),
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: AppTheme.primaryPurple.withOpacity(0.08),
              blurRadius: 20,
              offset: const Offset(0, 4),
              spreadRadius: 0,
            ),
            BoxShadow(
              color: colors.shadow.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header: User info with entity/group context
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    AppTheme.primaryPurple.withOpacity(0.02),
                    Colors.transparent,
                  ],
                ),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      // User avatar with gradient border
                      Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(
                            colors: [
                              AppTheme.primaryPurple.withOpacity(0.6),
                              AppTheme.primaryPurple.withOpacity(0.2),
                            ],
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.primaryPurple.withOpacity(0.2),
                              blurRadius: 8,
                              spreadRadius: 1,
                            ),
                          ],
                        ),
                        padding: const EdgeInsets.all(2),
                        child: CircleAvatar(
                          radius: 24,
                          backgroundColor: colors.cardBackground,
                          backgroundImage: post.userAvatar != null
                              ? CachedNetworkImageProvider(post.userAvatar!)
                              : null,
                          child: post.userAvatar == null
                              ? Icon(Icons.person, color: colors.iconPrimary, size: 28)
                              : null,
                        ),
                      ),
                      const SizedBox(width: 12),

                      // User name and timestamp
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    post.username,
                                    style: AppTheme.bodyLarge.copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: colors.textPrimary,
                                      fontSize: 16,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                // Verified badge (if needed in future)
                                // const SizedBox(width: 4),
                                // Icon(Icons.verified, size: 16, color: AppTheme.infoBlue),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                Icon(
                                  Icons.access_time,
                                  size: 12,
                                  color: colors.textSecondary,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  DateFormatter.timeAgo(post.createdAt),
                                  style: AppTheme.bodySmall.copyWith(
                                    color: colors.textSecondary,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      // Pinned badge (top-right)
                      if (post.isPinned)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                AppTheme.accentYellow,
                                AppTheme.accentYellow.withOpacity(0.8),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.accentYellow.withOpacity(0.3),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.push_pin,
                                size: 14,
                                color: Colors.white,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                'Pinned',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),

                  // Entity/Group context badge (prominent)
                  if (post.postType == PostType.group && post.groupName != null) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            AppTheme.infoBlue.withOpacity(0.15),
                            AppTheme.infoBlue.withOpacity(0.05),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppTheme.infoBlue.withOpacity(0.3),
                          width: 1.5,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: AppTheme.infoBlue,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(
                              Icons.groups,
                              size: 16,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Flexible(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Posted in Group',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: AppTheme.infoBlue.withOpacity(0.7),
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                Text(
                                  post.groupName!,
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: AppTheme.infoBlue,
                                    fontWeight: FontWeight.bold,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],

                  if (post.postType == PostType.entity && post.entityName != null) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            AppTheme.successGreen.withOpacity(0.15),
                            AppTheme.successGreen.withOpacity(0.05),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppTheme.successGreen.withOpacity(0.3),
                          width: 1.5,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: AppTheme.successGreen,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(
                              Icons.business,
                              size: 16,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Flexible(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'About Entity',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: AppTheme.successGreen.withOpacity(0.7),
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                Text(
                                  post.entityName!,
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: AppTheme.successGreen,
                                    fontWeight: FontWeight.bold,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),

            // Content section
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title with gradient accent
                  Text(
                    post.title,
                    style: AppTheme.headingMedium.copyWith(
                      fontWeight: FontWeight.bold,
                      color: colors.textPrimary,
                      fontSize: 18,
                      height: 1.3,
                    ),
                  ),

                  const SizedBox(height: 10),

                  // Content (truncated)
                  Text(
                    post.content,
                    style: AppTheme.bodyMedium.copyWith(
                      color: colors.textPrimary,
                      fontSize: 15,
                      height: 1.5,
                    ),
                    maxLines: linkedReview != null ? 2 : 4,
                    overflow: TextOverflow.ellipsis,
                  ),

                  // Review Link Preview
                  if (linkedReview != null) ...[
                    const SizedBox(height: 12),
                    ReviewLinkPreview(
                      review: linkedReview,
                      onTap: onReviewPreviewTap,
                    ),
                  ],

                  // Tags
                  if (post.tags.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: post.tags.take(3).map((tag) {
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                AppTheme.primaryPurple.withOpacity(0.12),
                                AppTheme.primaryPurple.withOpacity(0.06),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: AppTheme.primaryPurple.withOpacity(0.2),
                              width: 1,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.tag,
                                size: 12,
                                color: AppTheme.primaryPurple,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                tag,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppTheme.primaryPurple,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ],
              ),
            ),

            // Divider
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Divider(
                color: colors.border.withOpacity(0.3),
                height: 1,
              ),
            ),

            // Stats row with beautiful design
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  _buildStat(
                    context: context,
                    icon: post.isLiked ? Icons.favorite : Icons.favorite_border,
                    label: NumberFormatter.compact(post.likesCount),
                    color: post.isLiked ? AppTheme.errorRed : colors.iconSecondary,
                    isActive: post.isLiked,
                    onTap: onLikeTap,
                  ),
                  const SizedBox(width: 24),
                  _buildStat(
                    context: context,
                    icon: Icons.comment_outlined,
                    label: NumberFormatter.compact(post.commentsCount),
                    color: colors.iconSecondary,
                    isActive: false,
                  ),
                  const SizedBox(width: 24),
                  _buildStat(
                    context: context,
                    icon: Icons.visibility_outlined,
                    label: NumberFormatter.compact(post.viewCount),
                    color: colors.iconSecondary,
                    isActive: false,
                  ),
                  const Spacer(),
                  // Share button
                  _buildStat(
                    context: context,
                    icon: Icons.share_outlined,
                    label: 'Share',
                    color: colors.iconSecondary,
                    isActive: false,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStat({
    required BuildContext context,
    required IconData icon,
    required String label,
    required Color color,
    required bool isActive,
    VoidCallback? onTap,
  }) {
    final colors = context.colors;

    final widget = Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isActive ? color.withOpacity(0.1) : Colors.transparent,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 20,
            color: color,
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: AppTheme.bodySmall.copyWith(
              color: color,
              fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );

    return onTap != null
        ? InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(20),
            child: widget,
          )
        : widget;
  }
}
