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

/// Community post card with review link preview support
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
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: colors.cardBackground,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: colors.shadow,
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Badges row
            Row(
              children: [
                // Pinned badge
                if (post.isPinned)
                  Container(
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.accentYellow.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.push_pin,
                          size: 12,
                          color: AppTheme.accentYellow,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Pinned',
                          style: TextStyle(
                            fontSize: 11,
                            color: AppTheme.accentYellow,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),

                // Source badge (Group or Entity)
                if (post.postType == PostType.group && post.groupName != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.blue.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.group,
                          size: 12,
                          color: Colors.blue,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          post.groupName!,
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.blue,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),

                if (post.postType == PostType.entity && post.entityName != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.successGreen.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.business,
                          size: 12,
                          color: AppTheme.successGreen,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          post.entityName!,
                          style: TextStyle(
                            fontSize: 11,
                            color: AppTheme.successGreen,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),

            const SizedBox(height: 12),

            // User info
            Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundImage: post.userAvatar != null
                      ? CachedNetworkImageProvider(post.userAvatar!)
                      : null,
                  child: post.userAvatar == null
                      ? Icon(Icons.person, color: colors.iconPrimary)
                      : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        post.username,
                        style: AppTheme.bodyMedium.copyWith(
                          fontWeight: FontWeight.bold,
                          color: colors.textPrimary,
                        ),
                      ),
                      Text(
                        DateFormatter.timeAgo(post.createdAt),
                        style: AppTheme.bodySmall.copyWith(
                          color: colors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Title
            Text(
              post.title,
              style: AppTheme.headingMedium.copyWith(
                fontWeight: FontWeight.bold,
                color: colors.textPrimary,
              ),
            ),

            const SizedBox(height: 8),

            // Content (truncated)
            Text(
              post.content,
              style: AppTheme.bodyMedium.copyWith(
                color: colors.textPrimary,
              ),
              maxLines: linkedReview != null ? 2 : 4,
              overflow: TextOverflow.ellipsis,
            ),

            // Review Link Preview
            if (linkedReview != null)
              ReviewLinkPreview(
                review: linkedReview,
                onTap: onReviewPreviewTap,
              ),

            // Tags
            if (post.tags.isNotEmpty) ...[
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: post.tags.take(3).map((tag) {
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryPurple.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '#$tag',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppTheme.primaryPurple,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],

            const SizedBox(height: 12),

            // Stats row
            Row(
              children: [
                _buildStat(
                  icon: post.isLiked ? Icons.favorite : Icons.favorite_border,
                  label: NumberFormatter.compact(post.likesCount),
                  color: post.isLiked ? AppTheme.errorRed : colors.iconSecondary,
                  onTap: onLikeTap,
                ),
                const SizedBox(width: 20),
                _buildStat(
                  icon: Icons.comment_outlined,
                  label: NumberFormatter.compact(post.commentsCount),
                  color: colors.iconSecondary,
                ),
                const SizedBox(width: 20),
                _buildStat(
                  icon: Icons.visibility_outlined,
                  label: NumberFormatter.compact(post.viewCount),
                  color: colors.iconSecondary,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStat({
    required IconData icon,
    required String label,
    required Color color,
    VoidCallback? onTap,
  }) {
    final widget = Row(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 4),
        Text(
          label,
          style: AppTheme.bodySmall.copyWith(color: color),
        ),
      ],
    );

    return onTap != null
        ? GestureDetector(onTap: onTap, child: widget)
        : widget;
  }
}
