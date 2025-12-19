import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../models/review_model.dart';
import '../config/app_theme.dart';
import 'purple_star_rating.dart';

class ReviewDetailModal extends StatelessWidget {
  final Review review;

  const ReviewDetailModal({super.key, required this.review});

  static void show(BuildContext context, Review review) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ReviewDetailModal(review: review),
    );
  }

  String _formatDate(DateTime? date) {
    if (date == null) return '';
    return DateFormat('MMMM d, yyyy \'at\' h:mm a').format(date);
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: AppTheme.backgroundWhite,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
          ),
          child: Column(
            children: [
              // Handle bar
              Container(
                margin: const EdgeInsets.symmetric(vertical: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppTheme.borderLight,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),

              // Header
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppTheme.spaceL,
                  vertical: AppTheme.spaceM,
                ),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: AppTheme.borderLight,
                      width: 1,
                    ),
                  ),
                ),
                child: Row(
                  children: [
                    const Expanded(
                      child: Text(
                        'Review Details',
                        style: AppTheme.headingMedium,
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close_rounded),
                      color: AppTheme.textSecondary,
                    ),
                  ],
                ),
              ),

              // Content
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(AppTheme.spaceL),
                  children: [
                    // User header
                    _buildUserHeader(),
                    const SizedBox(height: AppTheme.spaceL),

                    // Entity badge
                    if (review.entityName != null) ...[
                      _buildEntityBadge(),
                      const SizedBox(height: AppTheme.spaceL),
                    ],

                    // Title
                    Text(
                      review.title,
                      style: AppTheme.headingMedium.copyWith(
                        fontSize: 24,
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: AppTheme.spaceL),

                    // Content
                    if (review.content != null) ...[
                      Text(
                        review.content!,
                        style: AppTheme.bodyLarge.copyWith(
                          color: AppTheme.textSecondary,
                          height: 1.8,
                        ),
                      ),
                      const SizedBox(height: AppTheme.spaceXL),
                    ],

                    // Pros
                    if (review.pros != null && review.pros!.isNotEmpty) ...[
                      _buildProsConsSection(
                        'Pros',
                        review.pros!,
                        AppTheme.successGreen,
                        Icons.thumb_up_rounded,
                      ),
                      const SizedBox(height: AppTheme.spaceL),
                    ],

                    // Cons
                    if (review.cons != null && review.cons!.isNotEmpty) ...[
                      _buildProsConsSection(
                        'Cons',
                        review.cons!,
                        AppTheme.errorRed,
                        Icons.thumb_down_rounded,
                      ),
                      const SizedBox(height: AppTheme.spaceXL),
                    ],

                    // Images
                    if (review.images != null && review.images!.isNotEmpty) ...[
                      _buildImages(),
                      const SizedBox(height: AppTheme.spaceXL),
                    ],

                    // Stats
                    _buildStats(),
                    const SizedBox(height: AppTheme.spaceXL),

                    // Action buttons
                    _buildActionButtons(),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildUserHeader() {
    return Row(
      children: [
        Container(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: AppTheme.primaryPurple.withOpacity(0.2),
                blurRadius: 8,
                spreadRadius: 0,
              ),
            ],
          ),
          child: CircleAvatar(
            radius: 28,
            backgroundColor: AppTheme.primaryPurpleLight.withOpacity(0.1),
            child: review.userAvatar != null
                ? ClipOval(
                    child: CachedNetworkImage(
                      imageUrl: review.userAvatar!,
                      width: 56,
                      height: 56,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        color: AppTheme.borderLight,
                      ),
                      errorWidget: (context, url, error) => Text(
                        review.username?[0].toUpperCase() ?? 'U',
                        style: AppTheme.headingSmall.copyWith(
                          color: AppTheme.primaryPurple,
                        ),
                      ),
                    ),
                  )
                : Text(
                    review.username?[0].toUpperCase() ?? 'U',
                    style: AppTheme.headingSmall.copyWith(
                      color: AppTheme.primaryPurple,
                    ),
                  ),
          ),
        ),
        const SizedBox(width: AppTheme.spaceM),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                review.username ?? 'Anonymous',
                style: AppTheme.labelMedium.copyWith(
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(
                    Icons.access_time_rounded,
                    size: 14,
                    color: AppTheme.textTertiary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _formatDate(review.createdAt),
                    style: AppTheme.bodySmall.copyWith(
                      color: AppTheme.textTertiary,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildEntityBadge() {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spaceM),
      decoration: BoxDecoration(
        gradient: AppTheme.purpleLightGradient,
        borderRadius: AppTheme.radiusMedium,
        border: Border.all(
          color: AppTheme.primaryPurpleLight.withOpacity(0.3),
          width: 1.5,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(AppTheme.spaceM),
            decoration: BoxDecoration(
              color: AppTheme.primaryPurpleLight.withOpacity(0.2),
              borderRadius: AppTheme.radiusSmall,
            ),
            child: Icon(
              Icons.business_rounded,
              size: 20,
              color: AppTheme.primaryPurpleDark,
            ),
          ),
          const SizedBox(width: AppTheme.spaceM),
          Expanded(
            child: Text(
              review.entityName!,
              style: AppTheme.labelMedium.copyWith(
                color: AppTheme.primaryPurpleDark,
                fontSize: 16,
              ),
            ),
          ),
          const SizedBox(width: AppTheme.spaceM),
          PurpleStarRating(
            rating: review.rating,
            maxRating: 5,
            size: 20,
            showValue: true,
          ),
        ],
      ),
    );
  }

  Widget _buildProsConsSection(
    String title,
    List<String> items,
    Color color,
    IconData icon,
  ) {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spaceL),
      decoration: BoxDecoration(
        color: color.withOpacity(0.05),
        borderRadius: AppTheme.radiusMedium,
        border: Border.all(
          color: color.withOpacity(0.2),
          width: 1.5,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: color),
              const SizedBox(width: AppTheme.spaceS),
              Text(
                title,
                style: AppTheme.labelMedium.copyWith(
                  color: color,
                  fontSize: 16,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spaceM),
          ...items.map((item) => Padding(
                padding: const EdgeInsets.only(
                  left: AppTheme.spaceL,
                  top: 8,
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      margin: const EdgeInsets.only(top: 8),
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: color,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: AppTheme.spaceM),
                    Expanded(
                      child: Text(
                        item,
                        style: AppTheme.bodyLarge.copyWith(
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildImages() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Images',
          style: AppTheme.headingSmall.copyWith(
            fontSize: 18,
          ),
        ),
        const SizedBox(height: AppTheme.spaceM),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: AppTheme.spaceM,
            mainAxisSpacing: AppTheme.spaceM,
            childAspectRatio: 1.5,
          ),
          itemCount: review.images!.length,
          itemBuilder: (context, index) {
            return ClipRRect(
              borderRadius: AppTheme.radiusMedium,
              child: CachedNetworkImage(
                imageUrl: review.images![index],
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(
                  color: AppTheme.borderLight,
                ),
                errorWidget: (context, url, error) => Container(
                  color: AppTheme.borderLight,
                  child: const Icon(
                    Icons.image_not_supported_rounded,
                    color: AppTheme.textTertiary,
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildStats() {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spaceL),
      decoration: BoxDecoration(
        color: AppTheme.backgroundLight,
        borderRadius: AppTheme.radiusMedium,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildStatItem(
            Icons.favorite_rounded,
            '${review.likesCount ?? 0}',
            'Likes',
            AppTheme.errorRed,
          ),
          Container(
            width: 1,
            height: 40,
            color: AppTheme.borderLight,
          ),
          _buildStatItem(
            Icons.mode_comment_rounded,
            '${review.commentsCount ?? 0}',
            'Comments',
            AppTheme.infoBlue,
          ),
          Container(
            width: 1,
            height: 40,
            color: AppTheme.borderLight,
          ),
          _buildStatItem(
            Icons.visibility_rounded,
            '${review.viewCount ?? 0}',
            'Views',
            AppTheme.primaryPurple,
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(IconData icon, String value, String label, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 24),
        const SizedBox(height: 4),
        Text(
          value,
          style: AppTheme.headingSmall.copyWith(
            fontSize: 20,
          ),
        ),
        Text(
          label,
          style: AppTheme.bodySmall.copyWith(
            color: AppTheme.textTertiary,
          ),
        ),
      ],
    );
  }

  Widget _buildActionButtons() {
    return Row(
      children: [
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(
              vertical: AppTheme.spaceM,
            ),
            decoration: BoxDecoration(
              gradient: AppTheme.purpleGradient,
              borderRadius: AppTheme.radiusMedium,
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primaryPurple.withOpacity(0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.favorite_border_rounded,
                  color: Colors.white,
                ),
                SizedBox(width: 8),
                Text(
                  'Like',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: AppTheme.spaceM),
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(
              vertical: AppTheme.spaceM,
            ),
            decoration: BoxDecoration(
              border: Border.all(
                color: AppTheme.primaryPurple,
                width: 2,
              ),
              borderRadius: AppTheme.radiusMedium,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.mode_comment_outlined,
                  color: AppTheme.primaryPurple,
                ),
                const SizedBox(width: 8),
                Text(
                  'Comment',
                  style: AppTheme.labelMedium.copyWith(
                    color: AppTheme.primaryPurple,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
