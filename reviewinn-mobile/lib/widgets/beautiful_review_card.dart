import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../models/review_model.dart';
import '../config/app_theme.dart';
import 'purple_star_rating.dart';
import 'review_detail_modal.dart';
import 'entity_info.dart';

class BeautifulReviewCard extends StatefulWidget {
  final Review review;

  const BeautifulReviewCard({super.key, required this.review});

  @override
  State<BeautifulReviewCard> createState() => _BeautifulReviewCardState();
}

class _BeautifulReviewCardState extends State<BeautifulReviewCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  bool _isExpanded = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.02).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  String _formatDate(DateTime? date) {
    if (date == null) return '';
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 7) {
      return DateFormat('MMM d, yyyy').format(date);
    } else if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }

  void _showOptionsMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
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
            // Options
            _buildMenuItem(Icons.edit_outlined, 'Edit Review', () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Edit review feature coming soon')),
              );
            }),
            _buildMenuItem(Icons.visibility_off_outlined, 'Hide Review', () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Review hidden')),
              );
            }),
            _buildMenuItem(Icons.report_outlined, 'Report', () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Report submitted')),
              );
            }),
            _buildMenuItem(Icons.delete_outline, 'Delete Review', () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Delete review feature coming soon')),
              );
            }, isDestructive: true),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuItem(IconData icon, String label, VoidCallback onTap,
      {bool isDestructive = false}) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppTheme.spaceL,
          vertical: AppTheme.spaceM,
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: isDestructive ? AppTheme.errorRed : AppTheme.textSecondary,
              size: 24,
            ),
            const SizedBox(width: AppTheme.spaceL),
            Text(
              label,
              style: AppTheme.bodyLarge.copyWith(
                color: isDestructive ? AppTheme.errorRed : AppTheme.textPrimary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => ReviewDetailModal.show(context, widget.review),
      child: MouseRegion(
        onEnter: (_) => _controller.forward(),
        onExit: (_) => _controller.reverse(),
        child: AnimatedBuilder(
          animation: _scaleAnimation,
          builder: (context, child) {
            return Transform.scale(
              scale: _scaleAnimation.value,
              child: child,
            );
          },
          child: Container(
          margin: const EdgeInsets.symmetric(
            horizontal: AppTheme.spaceL,
            vertical: AppTheme.spaceM,
          ),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Colors.white,
                Colors.grey.shade50,
              ],
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: AppTheme.primaryPurple.withOpacity(0.08),
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: AppTheme.primaryPurple.withOpacity(0.08),
                blurRadius: 20,
                offset: const Offset(0, 8),
                spreadRadius: 0,
              ),
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 12,
                offset: const Offset(0, 4),
                spreadRadius: 0,
              ),
              BoxShadow(
                color: Colors.black.withOpacity(0.02),
                blurRadius: 6,
                offset: const Offset(0, 2),
                spreadRadius: 0,
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: AppTheme.radiusMedium,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header with user info and timestamp
                _buildHeader(),

                // Entity info badge (if available)
                if (widget.review.entityName != null) _buildEntityBadge(),

                // Review content
                _buildContent(),

                // Pros & Cons
                if (widget.review.pros != null && widget.review.pros!.isNotEmpty)
                  _buildProsCons(),

                // Action buttons
                _buildActions(),
              ],
            ),
          ),
        ),
      ),
    ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spaceL),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            AppTheme.primaryPurple.withOpacity(0.02),
            Colors.transparent,
          ],
        ),
      ),
      child: Row(
        children: [
          // Avatar - Larger with subtle border
          Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: AppTheme.primaryPurple.withOpacity(0.2),
                width: 2,
              ),
            ),
            child: CircleAvatar(
              radius: 24,
              backgroundColor: AppTheme.backgroundLight,
              child: widget.review.userAvatar != null
                  ? ClipOval(
                      child: CachedNetworkImage(
                        imageUrl: widget.review.userAvatar!,
                        width: 48,
                        height: 48,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Container(
                          color: AppTheme.borderLight,
                        ),
                        errorWidget: (context, url, error) => Text(
                          widget.review.username?[0].toUpperCase() ?? 'U',
                          style: AppTheme.labelMedium.copyWith(
                            color: AppTheme.primaryPurple,
                            fontSize: 18,
                          ),
                        ),
                      ),
                    )
                  : Text(
                      widget.review.username?[0].toUpperCase() ?? 'U',
                      style: AppTheme.labelMedium.copyWith(
                        color: AppTheme.primaryPurple,
                        fontSize: 18,
                      ),
                    ),
            ),
          ),
          const SizedBox(width: AppTheme.spaceM),

          // User info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.review.username ?? 'Anonymous',
                  style: AppTheme.labelMedium.copyWith(
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Icon(
                      Icons.access_time_rounded,
                      size: 14,
                      color: AppTheme.textTertiary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      _formatDate(widget.review.createdAt),
                      style: AppTheme.bodySmall.copyWith(
                        color: AppTheme.textTertiary,
                      ),
                    ),
                    // Group badge if review belongs to a group
                    if (widget.review.groupId != null && widget.review.groupName != null) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
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
                            Icon(
                              Icons.groups_rounded,
                              size: 12,
                              color: AppTheme.successGreen,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              widget.review.groupName!.length > 12
                                  ? '${widget.review.groupName!.substring(0, 12)}...'
                                  : widget.review.groupName!,
                              style: AppTheme.labelSmall.copyWith(
                                color: AppTheme.successGreen,
                                fontWeight: FontWeight.w600,
                                fontSize: 10,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    // Public indicator if explicitly marked as public
                    if (widget.review.reviewScope == 'public' && widget.review.groupId == null) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
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
                            Icon(
                              Icons.public_rounded,
                              size: 12,
                              color: AppTheme.infoBlue,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'Public',
                              style: AppTheme.labelSmall.copyWith(
                                color: AppTheme.infoBlue,
                                fontWeight: FontWeight.w600,
                                fontSize: 10,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),

          // Three-dot menu (Facebook-style)
          IconButton(
            icon: Icon(
              Icons.more_horiz,
              color: AppTheme.textTertiary,
              size: 24,
            ),
            onPressed: () => _showOptionsMenu(context),
          ),
        ],
      ),
    );
  }

  Widget _buildEntityBadge() {
    return Container(
      margin: const EdgeInsets.fromLTRB(
        AppTheme.spaceL,
        AppTheme.spaceS,
        AppTheme.spaceL,
        AppTheme.spaceM,
      ),
      padding: const EdgeInsets.all(AppTheme.spaceM),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppTheme.primaryPurple.withOpacity(0.03),
            AppTheme.accentYellow.withOpacity(0.02),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppTheme.primaryPurple.withOpacity(0.15),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryPurple.withOpacity(0.1),
            blurRadius: 12,
            offset: const Offset(0, 4),
            spreadRadius: 0,
          ),
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
            spreadRadius: 0,
          ),
        ],
      ),
      child: EntityInfo(
        entityName: widget.review.entityName,
        entityAvatar: widget.review.entityAvatar,
        rootCategoryName: widget.review.entityRootCategoryName,
        finalCategoryName: widget.review.entityFinalCategoryName,
        rootCategoryId: widget.review.entityRootCategoryId,
        finalCategoryId: widget.review.entityFinalCategoryId,
        rootCategoryIcon: widget.review.entityRootCategoryIcon,
        finalCategoryIcon: widget.review.entityFinalCategoryIcon,
        rating: widget.review.rating,
        reviewCount: widget.review.entityReviewCount,
        avatarSize: 64,
        nameSize: 15,
        ratingSize: 20,
        showDescription: false,
        showAvatar: true,
        showVerifiedIcon: true,
        maxDescriptionLines: 0,
      ),
    );
  }

  Widget _buildContent() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppTheme.spaceL,
        AppTheme.spaceM,
        AppTheme.spaceL,
        AppTheme.spaceL,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title - More prominent
          Text(
            widget.review.title,
            style: AppTheme.headingSmall.copyWith(
              fontSize: 22,
              height: 1.3,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.5,
            ),
          ),
          if (widget.review.content != null) ...[
            const SizedBox(height: AppTheme.spaceM),
            AnimatedCrossFade(
              firstChild: Text(
                widget.review.content!,
                style: AppTheme.bodyLarge.copyWith(
                  color: AppTheme.textSecondary,
                  height: 1.6,
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
              secondChild: Text(
                widget.review.content!,
                style: AppTheme.bodyLarge.copyWith(
                  color: AppTheme.textSecondary,
                  height: 1.6,
                ),
              ),
              crossFadeState: _isExpanded
                  ? CrossFadeState.showSecond
                  : CrossFadeState.showFirst,
              duration: const Duration(milliseconds: 300),
            ),
            if (widget.review.content!.length > 150)
              TextButton(
                onPressed: () {
                  setState(() {
                    _isExpanded = !_isExpanded;
                  });
                },
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(
                    vertical: AppTheme.spaceS,
                  ),
                ),
                child: Text(
                  _isExpanded ? 'Show less' : 'Read more',
                  style: AppTheme.labelMedium.copyWith(
                    color: AppTheme.primaryPurple,
                  ),
                ),
              ),
          ],
        ],
      ),
    );
  }

  Widget _buildProsCons() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppTheme.spaceL),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (widget.review.pros != null && widget.review.pros!.isNotEmpty) ...[
            _buildProsConsSection(
              'Pros',
              widget.review.pros!,
              AppTheme.successGreen,
              Icons.thumb_up_rounded,
            ),
            const SizedBox(height: AppTheme.spaceM),
          ],
          if (widget.review.cons != null && widget.review.cons!.isNotEmpty) ...[
            _buildProsConsSection(
              'Cons',
              widget.review.cons!,
              AppTheme.errorRed,
              Icons.thumb_down_rounded,
            ),
          ],
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
      padding: const EdgeInsets.all(AppTheme.spaceM),
      decoration: BoxDecoration(
        color: color.withOpacity(0.05),
        borderRadius: AppTheme.radiusSmall,
        border: Border.all(
          color: color.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: AppTheme.spaceS),
              Text(
                title,
                style: AppTheme.labelMedium.copyWith(
                  color: color,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spaceS),
          ...items.map((item) => Padding(
                padding: const EdgeInsets.only(
                  left: AppTheme.spaceXL,
                  top: 4,
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      margin: const EdgeInsets.only(top: 8),
                      width: 4,
                      height: 4,
                      decoration: BoxDecoration(
                        color: color,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: AppTheme.spaceS),
                    Expanded(
                      child: Text(
                        item,
                        style: AppTheme.bodyMedium.copyWith(
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

  Widget _buildActions() {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppTheme.spaceL,
        vertical: AppTheme.spaceM,
      ),
      decoration: BoxDecoration(
        color: AppTheme.backgroundLight.withOpacity(0.4),
        border: Border(
          top: BorderSide(
            color: AppTheme.borderLight.withOpacity(0.6),
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          _buildActionButton(
            Icons.favorite_border_rounded,
            '${widget.review.likesCount ?? 0}',
            AppTheme.errorRed,
            'Like',
          ),
          const SizedBox(width: AppTheme.spaceXL),
          _buildActionButton(
            Icons.mode_comment_outlined,
            '${widget.review.commentsCount ?? 0}',
            AppTheme.infoBlue,
            'Comment',
          ),
          const SizedBox(width: AppTheme.spaceXL),
          _buildActionButton(
            Icons.visibility_rounded,
            '${widget.review.viewCount ?? 0}',
            AppTheme.textTertiary,
            'Views',
          ),
          const Spacer(),
          InkWell(
            onTap: () {
              // Share functionality
            },
            borderRadius: BorderRadius.circular(8),
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 8,
              ),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: AppTheme.borderLight,
                  width: 1,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.share_rounded,
                    size: 18,
                    color: AppTheme.primaryPurple,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'Share',
                    style: AppTheme.labelSmall.copyWith(
                      color: AppTheme.primaryPurple,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(
    IconData icon,
    String count,
    Color color,
    String label,
  ) {
    return InkWell(
      onTap: () {
        // Action functionality
      },
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: 4,
          vertical: 4,
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 22,
              color: color,
            ),
            const SizedBox(width: 6),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  count,
                  style: AppTheme.labelMedium.copyWith(
                    color: AppTheme.textPrimary,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                Text(
                  label,
                  style: AppTheme.bodySmall.copyWith(
                    color: AppTheme.textTertiary,
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
