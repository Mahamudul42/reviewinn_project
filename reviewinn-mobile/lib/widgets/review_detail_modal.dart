import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';
import 'package:provider/provider.dart';
import '../models/review_model.dart';
import '../config/app_theme.dart';
import '../providers/auth_provider.dart';
import '../providers/review_provider.dart';
import '../screens/edit_review_screen.dart';
import 'purple_star_rating.dart';

class ReviewDetailModal extends StatefulWidget {
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

  @override
  State<ReviewDetailModal> createState() => _ReviewDetailModalState();
}

class _ReviewDetailModalState extends State<ReviewDetailModal> {
  late bool isLiked;
  late bool isBookmarked;
  late int likesCount;
  late bool isHelpful;
  late int helpfulCount;
  late bool isNotHelpful;
  late int notHelpfulCount;
  bool _showComments = false; // Track if comments should be loaded

  @override
  void initState() {
    super.initState();
    isLiked = widget.review.isLiked ?? false;
    isBookmarked = false; // Would come from backend
    likesCount = widget.review.likesCount ?? 0;
    isHelpful = widget.review.isHelpful ?? false;
    helpfulCount = widget.review.helpfulCount ?? 0;
    isNotHelpful = widget.review.isNotHelpful ?? false;
    notHelpfulCount = widget.review.notHelpfulCount ?? 0;
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
          decoration: BoxDecoration(
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
                    Expanded(
                      child: Text(
                        'Review Details',
                        style: AppTheme.headingMedium,
                      ),
                    ),
                    // More Options Menu
                    PopupMenuButton<String>(
                      icon: Icon(Icons.more_vert, color: AppTheme.textSecondary),
                      onSelected: (value) {
                        switch (value) {
                          case 'edit':
                            _handleEditReview();
                            break;
                          case 'delete':
                            _handleDeleteReview();
                            break;
                          case 'report':
                            _handleReportReview();
                            break;
                        }
                      },
                      itemBuilder: (context) => [
                        // Show edit/delete only for user's own reviews
                        if (_isOwnReview()) ...[
                          PopupMenuItem(
                            value: 'edit',
                            child: Row(
                              children: [
                                Icon(Icons.edit, color: AppTheme.primaryPurple, size: 20),
                                SizedBox(width: 12),
                                Text('Edit Review', style: TextStyle(color: AppTheme.textPrimary)),
                              ],
                            ),
                          ),
                          PopupMenuItem(
                            value: 'delete',
                            child: Row(
                              children: [
                                Icon(Icons.delete, color: Colors.red, size: 20),
                                SizedBox(width: 12),
                                Text('Delete Review', style: TextStyle(color: Colors.red)),
                              ],
                            ),
                          ),
                        ] else ...[
                          PopupMenuItem(
                            value: 'report',
                            child: Row(
                              children: [
                                Icon(Icons.flag, color: Colors.red, size: 20),
                                SizedBox(width: 12),
                                Text('Report Review', style: TextStyle(color: AppTheme.textPrimary)),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                    // Bookmark Button
                    IconButton(
                      onPressed: () {
                        setState(() {
                          isBookmarked = !isBookmarked;
                        });
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(isBookmarked ? 'Review saved!' : 'Bookmark removed'),
                            duration: const Duration(seconds: 1),
                            backgroundColor: AppTheme.successGreen,
                          ),
                        );
                      },
                      icon: Icon(
                        isBookmarked ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
                      ),
                      color: isBookmarked ? AppTheme.accentYellow : AppTheme.textSecondary,
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: Icon(Icons.close_rounded),
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
                    if (widget.review.entityName != null) ...[
                      _buildEntityBadge(),
                      const SizedBox(height: AppTheme.spaceL),
                    ],

                    // Title
                    Text(
                      widget.review.title,
                      style: AppTheme.headingMedium.copyWith(
                        fontSize: 24,
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: AppTheme.spaceL),

                    // Content
                    if (widget.review.content != null) ...[
                      Text(
                        widget.review.content!,
                        style: AppTheme.bodyLarge.copyWith(
                          color: AppTheme.textSecondary,
                          height: 1.8,
                        ),
                      ),
                      const SizedBox(height: AppTheme.spaceXL),
                    ],

                    // Pros
                    if (widget.review.pros != null && widget.review.pros!.isNotEmpty) ...[
                      _buildProsConsSection(
                        'Pros',
                        widget.review.pros!,
                        AppTheme.successGreen,
                        Icons.thumb_up_rounded,
                      ),
                      const SizedBox(height: AppTheme.spaceL),
                    ],

                    // Cons
                    if (widget.review.cons != null && widget.review.cons!.isNotEmpty) ...[
                      _buildProsConsSection(
                        'Cons',
                        widget.review.cons!,
                        AppTheme.errorRed,
                        Icons.thumb_down_rounded,
                      ),
                      const SizedBox(height: AppTheme.spaceXL),
                    ],

                    // Images
                    if (widget.review.images != null && widget.review.images!.isNotEmpty) ...[
                      _buildImages(),
                      const SizedBox(height: AppTheme.spaceXL),
                    ],

                    // Beautiful Action Bar (Like, Comment, Share, Views)
                    _buildBeautifulActionBar(),
                    const SizedBox(height: AppTheme.spaceL),

                    // Helpful Vote Section
                    _buildHelpfulVoteSection(),
                    const SizedBox(height: AppTheme.spaceXL),

                    // Comments Section (Load on demand)
                    if (_showComments) ...[
                      _buildCommentsSection(context),
                      const SizedBox(height: AppTheme.spaceXL),
                    ],

                    // Bottom padding for safe area
                    SizedBox(height: MediaQuery.of(context).padding.bottom + AppTheme.spaceL),
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
            child: widget.review.userAvatar != null
                ? ClipOval(
                    child: CachedNetworkImage(
                      imageUrl: widget.review.userAvatar!,
                      width: 56,
                      height: 56,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        color: AppTheme.borderLight,
                      ),
                      errorWidget: (context, url, error) => Text(
                        widget.review.username?[0].toUpperCase() ?? 'U',
                        style: AppTheme.headingSmall.copyWith(
                          color: AppTheme.primaryPurple,
                        ),
                      ),
                    ),
                  )
                : Text(
                    widget.review.username?[0].toUpperCase() ?? 'U',
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
                widget.review.username ?? 'Anonymous',
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
                    _formatDate(widget.review.createdAt),
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
      margin: const EdgeInsets.fromLTRB(
        AppTheme.spaceL,
        AppTheme.spaceS,
        AppTheme.spaceL,
        AppTheme.spaceM,
      ),
      padding: const EdgeInsets.all(AppTheme.spaceM),
      decoration: BoxDecoration(
        color: AppTheme.primaryPurple.withOpacity(0.08),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          // Entity Icon
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.primaryPurple.withOpacity(0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              Icons.business_rounded,
              color: AppTheme.primaryPurple,
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          // Entity Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Entity Name with Verified Badge
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        widget.review.entityName!,
                        style: AppTheme.labelMedium.copyWith(
                          color: Colors.black,
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(
                      Icons.verified,
                      size: 16,
                      color: Colors.blue,
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                // Category Badges
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: [
                    if (widget.review.entityRootCategoryName != null)
                      _buildCategoryBadge(
                        widget.review.entityRootCategoryIcon ?? '📁',
                        widget.review.entityRootCategoryName!,
                        AppTheme.infoBlue,
                      ),
                    if (widget.review.entityFinalCategoryName != null &&
                        widget.review.entityRootCategoryId != widget.review.entityFinalCategoryId)
                      _buildCategoryBadge(
                        widget.review.entityFinalCategoryIcon ?? '🏷️',
                        widget.review.entityFinalCategoryName!,
                        AppTheme.successGreen,
                      ),
                  ],
                ),
                const SizedBox(height: 6),
                // Star Rating and Review Count
                Row(
                  children: [
                    ...List.generate(
                      5,
                      (index) => Icon(
                        index < (widget.review.rating?.floor() ?? 0)
                            ? Icons.star
                            : Icons.star_border,
                        size: 16,
                        color: AppTheme.primaryPurple,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '${widget.review.rating?.toStringAsFixed(1) ?? '0.0'}',
                      style: AppTheme.labelMedium.copyWith(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '(${widget.review.entityReviewCount ?? 0} reviews)',
                      style: AppTheme.bodySmall.copyWith(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          // Arrow Icon
          Icon(
            Icons.arrow_forward_ios_rounded,
            color: AppTheme.textTertiary,
            size: 16,
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryBadge(String icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            icon,
            style: const TextStyle(fontSize: 11),
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: AppTheme.bodySmall.copyWith(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color.withOpacity(0.9),
            ),
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
          itemCount: widget.review.images!.length,
          itemBuilder: (context, index) {
            return ClipRRect(
              borderRadius: AppTheme.radiusMedium,
              child: CachedNetworkImage(
                imageUrl: widget.review.images![index],
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(
                  color: AppTheme.borderLight,
                ),
                errorWidget: (context, url, error) => Container(
                  color: AppTheme.borderLight,
                  child: Icon(
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
            '${widget.review.likesCount ?? 0}',
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
            '${widget.review.commentsCount ?? 0}',
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
            '${widget.review.viewCount ?? 0}',
            'Views',
            AppTheme.primaryPurple,
          ),
          Container(
            width: 1,
            height: 40,
            color: AppTheme.borderLight,
          ),
          // Share as stat item
          InkWell(
            onTap: () async {
              final reviewText = '''${widget.review.title}

Rating: ${widget.review.rating}/5.0

${widget.review.content ?? ""}

Shared from ReviewInn App''';
              
              try {
                await Share.share(
                  reviewText,
                  subject: widget.review.title,
                );
              } catch (e) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Error sharing: \$e'),
                    backgroundColor: AppTheme.errorRed,
                  ),
                );
              }
            },
            child: Column(
              children: [
                Icon(Icons.share_rounded, color: AppTheme.successGreen, size: 24),
                const SizedBox(height: 4),
                Text(
                  'Share',
                  style: AppTheme.bodySmall.copyWith(
                    color: AppTheme.textTertiary,
                  ),
                ),
              ],
            ),
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

  // Beautiful Action Bar with Like, Comment, Share
  Widget _buildBeautifulActionBar() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: Colors.grey.shade200,
          width: 1,
        ),
      ),
      child: Row(
        children: [
          // Like Button
          Expanded(
            child: _buildActionButton(
              icon: isLiked ? Icons.favorite_rounded : Icons.favorite_border_rounded,
              label: 'Like',
              count: likesCount,
              isActive: isLiked,
              activeColor: Colors.red,
              onTap: () {
                setState(() {
                  isLiked = !isLiked;
                  likesCount += isLiked ? 1 : -1;
                });
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(isLiked ? '❤️ Review liked!' : 'Like removed'),
                    duration: const Duration(seconds: 1),
                    backgroundColor: isLiked ? Colors.red : AppTheme.textSecondary,
                    behavior: SnackBarBehavior.floating,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(width: AppTheme.spaceS),
          
          // Comment Button
          Expanded(
            child: _buildActionButton(
              icon: Icons.mode_comment_outlined,
              label: 'Comment',
              count: widget.review.commentsCount ?? 0,
              isActive: _showComments,
              activeColor: AppTheme.infoBlue,
              onTap: () {
                setState(() {
                  _showComments = !_showComments;
                });
                if (_showComments) {
                  // TODO: Load comments from API
                  // This is where you'll fetch comments separately
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('💬 Loading comments...'),
                      duration: const Duration(seconds: 1),
                      backgroundColor: AppTheme.infoBlue,
                      behavior: SnackBarBehavior.floating,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  );
                }
              },
            ),
          ),
          const SizedBox(width: AppTheme.spaceS),
          
          // Views Button
          Expanded(
            child: _buildActionButton(
              icon: Icons.visibility_rounded,
              label: 'Views',
              count: widget.review.viewCount ?? 0,
              isActive: false,
              activeColor: Colors.black,
              onTap: () {},
            ),
          ),
          const SizedBox(width: AppTheme.spaceS),
          
          // Share Button
          Expanded(
            child: _buildActionButton(
              icon: Icons.share_rounded,
              label: 'Share',
              count: null,
              isActive: false,
              activeColor: AppTheme.successGreen,
              onTap: () {
                _handleShare();
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required int? count,
    required bool isActive,
    required Color activeColor,
    required VoidCallback onTap,
  }) {
    // Define colors for each button type
    Color buttonColor;
    Color iconColor;
    Color textColor;
    
    if (isActive) {
      buttonColor = activeColor;
      iconColor = Colors.white;
      textColor = Colors.white;
    } else {
      // Different colors for different button types
      if (label == 'Like') {
        buttonColor = Colors.white;
        iconColor = Colors.red.shade400;
        textColor = Colors.black87;
      } else if (label == 'Comment') {
        buttonColor = Colors.white;
        iconColor = Colors.blue.shade400;
        textColor = Colors.black87;
      } else if (label == 'Views') {
        buttonColor = Colors.white;
        iconColor = Colors.purple.shade400;
        textColor = Colors.black87;
      } else { // Share
        buttonColor = Colors.white;
        iconColor = Colors.green.shade400;
        textColor = Colors.black87;
      }
    }

    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
            decoration: BoxDecoration(
              color: buttonColor,
              borderRadius: BorderRadius.circular(16),
              boxShadow: isActive
                  ? [
                      BoxShadow(
                        color: activeColor.withOpacity(0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ]
                  : null,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  icon,
                  color: iconColor,
                  size: 26,
                ),
                const SizedBox(height: 6),
                Text(
                  label,
                  style: TextStyle(
                    color: textColor,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.3,
                  ),
                ),
                if (count != null && count > 0) ...[
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color: isActive ? Colors.white.withOpacity(0.3) : iconColor.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      count > 999 ? '${(count / 1000).toStringAsFixed(1)}k' : count.toString(),
                      style: TextStyle(
                        color: isActive ? Colors.white : iconColor,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Helpful Vote Section
  Widget _buildHelpfulVoteSection() {
    final totalVotes = helpfulCount + notHelpfulCount;
    final helpfulPercentage = totalVotes > 0 ? (helpfulCount / totalVotes * 100).round() : 0;

    return Container(
      padding: const EdgeInsets.all(AppTheme.spaceL),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: Colors.black.withOpacity(0.1),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  Icons.thumb_up_rounded,
                  color: Colors.green,
                  size: 20,
                ),
              ),
              const SizedBox(width: AppTheme.spaceM),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Was this review helpful?',
                      style: AppTheme.labelMedium.copyWith(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    if (totalVotes > 0) ...[
                      const SizedBox(height: 2),
                      Text(
                        '$helpfulPercentage% found this helpful ($totalVotes votes)',
                        style: AppTheme.bodySmall.copyWith(
                          color: Colors.black,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spaceM),

              // Vote Buttons
              Row(
                children: [
                  // Yes Button
                  Expanded(
                    child: _buildVoteButton(
                      icon: Icons.thumb_up_rounded,
                      label: 'Yes',
                      count: helpfulCount,
                      isActive: isHelpful,
                      color: AppTheme.successGreen,
                      onTap: () {
                        if (!isNotHelpful) {
                          setState(() {
                            if (isHelpful) {
                              isHelpful = false;
                              helpfulCount--;
                            } else {
                              isHelpful = true;
                              helpfulCount++;
                            }
                          });
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('You already voted this as not helpful'),
                              duration: const Duration(seconds: 2),
                              backgroundColor: AppTheme.errorRed,
                              behavior: SnackBarBehavior.floating,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                          );
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: AppTheme.spaceM),
                  
                  // No Button
                  Expanded(
                    child: _buildVoteButton(
                      icon: Icons.thumb_down_rounded,
                      label: 'No',
                      count: notHelpfulCount,
                      isActive: isNotHelpful,
                      color: AppTheme.errorRed,
                      onTap: () {
                        if (!isHelpful) {
                          setState(() {
                            if (isNotHelpful) {
                              isNotHelpful = false;
                              notHelpfulCount--;
                            } else {
                              isNotHelpful = true;
                              notHelpfulCount++;
                            }
                          });
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('You already voted this as helpful'),
                              duration: const Duration(seconds: 2),
                              backgroundColor: AppTheme.errorRed,
                              behavior: SnackBarBehavior.floating,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                          );
                        }
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      }

  // Reusable Vote Button
  Widget _buildVoteButton({
    required IconData icon,
    required String label,
    required int count,
    required bool isActive,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(
            vertical: 12,
            horizontal: 16,
          ),
          decoration: BoxDecoration(
            color: isActive ? color : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isActive ? color : AppTheme.borderLight,
              width: 1.5,
            ),
            boxShadow: isActive
                ? [
                    BoxShadow(
                      color: color.withOpacity(0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                color: isActive ? Colors.white : Colors.black,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  color: isActive ? Colors.white : Colors.black,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              if (count > 0) ...[
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: isActive ? Colors.white.withOpacity(0.25) : AppTheme.backgroundLight,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    count.toString(),
                    style: TextStyle(
                      color: isActive ? Colors.white : AppTheme.textSecondary,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  // Handle Share Action
  void _handleShare() {
    // TODO: Implement share functionality
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.share_rounded, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            const Text('Review link copied to clipboard!'),
          ],
        ),
        duration: const Duration(seconds: 2),
        backgroundColor: AppTheme.successGreen,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    );
  }

  Widget _buildOldActionButtons() {
    return Column(
      children: [
        // Primary Actions Row
        Row(
          children: [
            // Like Button
            Expanded(
              child: InkWell(
                onTap: () {
                  setState(() {
                    isLiked = !isLiked;
                    likesCount += isLiked ? 1 : -1;
                  });
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(isLiked ? 'Review liked!' : 'Like removed'),
                      duration: const Duration(seconds: 1),
                      backgroundColor: AppTheme.successGreen,
                    ),
                  );
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    vertical: AppTheme.spaceM,
                  ),
                  decoration: BoxDecoration(
                    gradient: isLiked ? AppTheme.purpleGradient : null,
                    color: isLiked ? null : Colors.white,
                    borderRadius: AppTheme.radiusMedium,
                    border: Border.all(
                      color: AppTheme.primaryPurple,
                      width: 2,
                    ),
                    boxShadow: isLiked ? [
                      BoxShadow(
                        color: AppTheme.primaryPurple.withOpacity(0.3),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ] : [],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        isLiked ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                        color: isLiked ? Colors.white : AppTheme.primaryPurple,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Like ($likesCount)',
                        style: TextStyle(
                          color: isLiked ? Colors.white : AppTheme.primaryPurple,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: AppTheme.spaceM),
            // Comment Button
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
        ),
        const SizedBox(height: AppTheme.spaceM),
        // Helpful Vote Section
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Was this review helpful?',
              style: AppTheme.labelMedium.copyWith(
                fontSize: 14,
                color: AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: AppTheme.spaceS),
            // Vote counts and percentage
            if (helpfulCount > 0 || notHelpfulCount > 0)
              Padding(
                padding: const EdgeInsets.only(bottom: AppTheme.spaceS),
                child: Text(
                  _getHelpfulPercentageText(),
                  style: AppTheme.bodySmall.copyWith(
                    color: AppTheme.textTertiary,
                  ),
                ),
              ),
            // Helpful and Not Helpful Buttons
            Row(
              children: [
                // Helpful Button
                Expanded(
                  child: InkWell(
                    onTap: _onHelpfulTap,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        vertical: AppTheme.spaceM,
                      ),
                      decoration: BoxDecoration(
                        gradient: isHelpful ? AppTheme.greenGradient : null,
                        color: isHelpful ? null : AppTheme.backgroundLight,
                        borderRadius: AppTheme.radiusMedium,
                        border: Border.all(
                          color: isHelpful ? AppTheme.successGreen : AppTheme.borderLight,
                          width: 2,
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.thumb_up_rounded,
                            color: isHelpful ? Colors.white : AppTheme.successGreen,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Yes ($helpfulCount)',
                            style: AppTheme.labelMedium.copyWith(
                              color: isHelpful ? Colors.white : AppTheme.textSecondary,
                              fontSize: 14,
                              fontWeight: isHelpful ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: AppTheme.spaceM),
                // Not Helpful Button
                Expanded(
                  child: InkWell(
                    onTap: _onNotHelpfulTap,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        vertical: AppTheme.spaceM,
                      ),
                      decoration: BoxDecoration(
                        color: isNotHelpful 
                            ? AppTheme.errorRed.withOpacity(0.1) 
                            : AppTheme.backgroundLight,
                        borderRadius: AppTheme.radiusMedium,
                        border: Border.all(
                          color: isNotHelpful ? AppTheme.errorRed : AppTheme.borderLight,
                          width: 2,
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.thumb_down_rounded,
                            color: isNotHelpful ? AppTheme.errorRed : AppTheme.textTertiary,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'No ($notHelpfulCount)',
                            style: AppTheme.labelMedium.copyWith(
                              color: isNotHelpful ? AppTheme.errorRed : AppTheme.textSecondary,
                              fontSize: 14,
                              fontWeight: isNotHelpful ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildCommentsSection(BuildContext context) {
    // TODO: Replace with actual API call
    // Backend endpoint: GET /api/v1/reviews/{reviewId}/comments
    // Query params: ?page=1&limit=20 (for pagination)
    // DO NOT load comments with review data to avoid expensive nested JOINs
    
    // Mock comments data for demonstration
    final mockComments = [
      {
        'username': 'Sarah Johnson',
        'avatar': 'https://i.pravatar.cc/150?img=1',
        'content': 'Great review! I had a similar experience. The quality was outstanding.',
        'timeAgo': '2 hours ago',
        'likes': 5,
      },
      {
        'username': 'Michael Chen',
        'avatar': 'https://i.pravatar.cc/150?img=3',
        'content': 'Thanks for sharing this detailed review. Very helpful!',
        'timeAgo': '5 hours ago',
        'likes': 3,
      },
      {
        'username': 'Emily Davis',
        'avatar': 'https://i.pravatar.cc/150?img=5',
        'content': 'I disagree with some points, but overall a fair assessment.',
        'timeAgo': '1 day ago',
        'likes': 1,
      },
    ];

    return AnimatedSize(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Divider before comments section
          Padding(
            padding: const EdgeInsets.symmetric(vertical: AppTheme.spaceL),
            child: Divider(
              color: AppTheme.borderLight,
              thickness: 1,
              height: 1,
            ),
          ),

          // Comments Header with Collapse Button
          Container(
            padding: const EdgeInsets.all(AppTheme.spaceL),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: Colors.black.withOpacity(0.1),
                width: 1.5,
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.infoBlue,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.forum_rounded,
                    color: Colors.white,
                    size: 22,
                  ),
                ),
                const SizedBox(width: AppTheme.spaceM),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Comments & Discussion',
                        style: AppTheme.headingSmall.copyWith(
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        '${mockComments.length} ${mockComments.length == 1 ? 'comment' : 'comments'}',
                        style: AppTheme.bodySmall.copyWith(
                          color: Colors.black,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () {
                      setState(() {
                        _showComments = false;
                      });
                    },
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.5),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        Icons.keyboard_arrow_up_rounded,
                        color: AppTheme.infoBlue,
                        size: 24,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppTheme.spaceL),

          // Comment Input with beautiful design
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () {
                // TODO: Open comment input bottom sheet or navigate to comment page
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Row(
                      children: [
                        Icon(Icons.edit_rounded, color: Colors.white, size: 20),
                        const SizedBox(width: 12),
                        const Text('Comment feature coming soon!'),
                      ],
                    ),
                    backgroundColor: AppTheme.infoBlue,
                    behavior: SnackBarBehavior.floating,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                );
              },
              borderRadius: BorderRadius.circular(16),
              child: Container(
                padding: const EdgeInsets.all(AppTheme.spaceL),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: Colors.black.withOpacity(0.1),
                    width: 1.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 15,
                      offset: const Offset(0, 5),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryPurple,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.2),
                            blurRadius: 8,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.person_rounded,
                        size: 20,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(width: AppTheme.spaceM),
                    Expanded(
                      child: Text(
                        'Add your comment...',
                        style: AppTheme.bodyMedium.copyWith(
                          color: Colors.black,
                          fontSize: 15,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryPurple.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        Icons.send_rounded,
                        color: AppTheme.primaryPurple,
                        size: 20,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: AppTheme.spaceL),

          // Comments List
          ...mockComments.map((comment) => _buildCommentItem(comment)),
        ],
      ),
    );
  }

  Widget _buildCommentItem(Map<String, dynamic> comment) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppTheme.spaceM),
      padding: const EdgeInsets.all(AppTheme.spaceM),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: AppTheme.radiusMedium,
        border: Border.all(
          color: AppTheme.borderLight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Comment Header
          Row(
            children: [
              CircleAvatar(
                radius: 16,
                backgroundColor: AppTheme.primaryPurpleLight.withOpacity(0.2),
                backgroundImage: comment['avatar'] != null
                    ? CachedNetworkImageProvider(comment['avatar'])
                    : null,
                child: comment['avatar'] == null
                    ? Text(
                        comment['username'][0].toUpperCase(),
                        style: AppTheme.bodySmall.copyWith(
                          color: AppTheme.primaryPurple,
                          fontWeight: FontWeight.bold,
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: AppTheme.spaceM),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      comment['username'],
                      style: AppTheme.labelMedium,
                    ),
                    Text(
                      comment['timeAgo'],
                      style: AppTheme.bodySmall.copyWith(
                        color: AppTheme.textTertiary,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: () => _showCommentOptionsMenu(comment),
                icon: Icon(
                  Icons.more_vert_rounded,
                  size: 18,
                ),
                color: AppTheme.textTertiary,
                constraints: const BoxConstraints(),
                padding: EdgeInsets.zero,
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spaceM),

          // Comment Content
          Text(
            comment['content'],
            style: AppTheme.bodyMedium.copyWith(
              height: 1.5,
            ),
          ),
          const SizedBox(height: AppTheme.spaceM),

          // Comment Actions
          Row(
            children: [
              InkWell(
                onTap: () {},
                child: Row(
                  children: [
                    Icon(
                      Icons.favorite_border_rounded,
                      size: 16,
                      color: AppTheme.textTertiary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${comment['likes']}',
                      style: AppTheme.bodySmall.copyWith(
                        color: AppTheme.textTertiary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppTheme.spaceL),
              InkWell(
                onTap: () {},
                child: Row(
                  children: [
                    Icon(
                      Icons.reply_rounded,
                      size: 16,
                      color: AppTheme.textTertiary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Reply',
                      style: AppTheme.bodySmall.copyWith(
                        color: AppTheme.textTertiary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // Helper methods for vote handling
  void _onHelpfulTap() {
    if (isNotHelpful) {
      // If user already voted not helpful, remove that vote first
      setState(() {
        isNotHelpful = false;
        notHelpfulCount--;
      });
    }
    
    setState(() {
      isHelpful = !isHelpful;
      helpfulCount += isHelpful ? 1 : -1;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          isHelpful 
            ? 'Thank you! Your feedback helps others.' 
            : 'Vote removed'
        ),
        duration: const Duration(seconds: 2),
        backgroundColor: AppTheme.successGreen,
      ),
    );
  }

  void _onNotHelpfulTap() {
    if (isHelpful) {
      // If user already voted helpful, remove that vote first
      setState(() {
        isHelpful = false;
        helpfulCount--;
      });
    }

    if (!isNotHelpful) {
      // Show reason selection modal when marking as not helpful
      _showNotHelpfulReasonModal();
    } else {
      // Remove not helpful vote
      setState(() {
        isNotHelpful = false;
        notHelpfulCount--;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Vote removed'),
          duration: const Duration(seconds: 1),
        ),
      );
    }
  }

  String _getHelpfulPercentageText() {
    final total = helpfulCount + notHelpfulCount;
    if (total == 0) return '';
    
    final percentage = ((helpfulCount / total) * 100).round();
    return '$helpfulCount of $total people found this helpful ($percentage%)';
  }

  void _showNotHelpfulReasonModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SingleChildScrollView(
        child: Container(
          padding: const EdgeInsets.all(AppTheme.spaceXL),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
            Row(
              children: [
                Icon(
                  Icons.flag_outlined,
                  color: AppTheme.errorRed,
                ),
                const SizedBox(width: AppTheme.spaceM),
                Expanded(
                  child: Text(
                    'Why wasn\'t this review helpful?',
                    style: AppTheme.headingSmall.copyWith(
                      fontSize: 18,
                    ),
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spaceS),
            Text(
              'Your feedback helps us improve review quality',
              style: AppTheme.bodySmall.copyWith(
                color: AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: AppTheme.spaceL),
            _buildReasonOption(
              icon: Icons.warning_amber_rounded,
              title: 'Fake or suspicious',
              subtitle: 'This review appears to be fake or fraudulent',
              onTap: () => _submitNotHelpfulWithReason('fake'),
            ),
            _buildReasonOption(
              icon: Icons.theater_comedy_rounded,
              title: 'Misleading information',
              subtitle: 'Contains false or exaggerated claims',
              onTap: () => _submitNotHelpfulWithReason('misleading'),
            ),
            _buildReasonOption(
              icon: Icons.edit_off_rounded,
              title: 'Not relevant',
              subtitle: 'Review is not about this product/service',
              onTap: () => _submitNotHelpfulWithReason('not_relevant'),
            ),
            _buildReasonOption(
              icon: Icons.report_outlined,
              title: 'Inappropriate content',
              subtitle: 'Contains offensive or inappropriate language',
              onTap: () => _submitNotHelpfulWithReason('inappropriate'),
            ),
            _buildReasonOption(
              icon: Icons.block_outlined,
              title: 'Spam',
              subtitle: 'This review is spam or repetitive',
              onTap: () => _submitNotHelpfulWithReason('spam'),
            ),
            const SizedBox(height: AppTheme.spaceM),
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: () => _submitNotHelpfulWithReason('other'),
                child: Text('Other reason'),
              ),
            ),
          ],
        ),
      ),
      ), // closes SingleChildScrollView
    ); // closes showModalBottomSheet
  }

  Widget _buildReasonOption({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: AppTheme.radiusMedium,
      child: Container(
        padding: const EdgeInsets.all(AppTheme.spaceM),
        margin: const EdgeInsets.only(bottom: AppTheme.spaceS),
        decoration: BoxDecoration(
          border: Border.all(color: AppTheme.borderLight),
          borderRadius: AppTheme.radiusMedium,
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(AppTheme.spaceS),
              decoration: BoxDecoration(
                color: AppTheme.errorRed.withOpacity(0.1),
                borderRadius: AppTheme.radiusSmall,
              ),
              child: Icon(
                icon,
                color: AppTheme.errorRed,
                size: 24,
              ),
            ),
            const SizedBox(width: AppTheme.spaceM),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTheme.labelMedium.copyWith(
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: AppTheme.bodySmall.copyWith(
                      color: AppTheme.textTertiary,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_ios_rounded,
              size: 16,
              color: AppTheme.textTertiary,
            ),
          ],
        ),
      ),
    );
  }

  void _submitNotHelpfulWithReason(String reason) {
    Navigator.pop(context); // Close reason modal
    
    setState(() {
      isNotHelpful = true;
      notHelpfulCount++;
    });

    // TODO: Send reason to backend
    // API call: POST /reviews/{id}/not-helpful with body: { reason: reason }
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Thank you for your feedback. We\'ll review this.'),
        duration: const Duration(seconds: 2),
        backgroundColor: AppTheme.infoBlue,
      ),
    );
  }

  // Check if this review belongs to the current user
  bool _isOwnReview() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    return authProvider.user?.userId == widget.review.userId;
  }

  Future<void> _handleEditReview() async {
    Navigator.pop(context); // Close modal

    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => EditReviewScreen(review: widget.review),
      ),
    );

    // If edit was successful, show success message
    if (result == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Review updated successfully!'),
          duration: Duration(seconds: 2),
          backgroundColor: AppTheme.successGreen,
        ),
      );
    }
  }

  Future<void> _handleDeleteReview() async {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Delete Review', style: TextStyle(color: AppTheme.textPrimary)),
        content: Text(
          'Are you sure you want to delete this review? This action cannot be undone.',
          style: TextStyle(color: AppTheme.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel', style: TextStyle(color: AppTheme.textSecondary)),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context); // Close dialog
              Navigator.pop(context); // Close modal

              try {
                final reviewProvider = Provider.of<ReviewProvider>(context, listen: false);
                await reviewProvider.deleteReview(widget.review.reviewId);

                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Review deleted successfully'),
                      duration: Duration(seconds: 2),
                      backgroundColor: AppTheme.successGreen,
                    ),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Failed to delete review: $e'),
                      duration: const Duration(seconds: 2),
                      backgroundColor: AppTheme.errorRed,
                    ),
                  );
                }
              }
            },
            child: Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  // Comment menu handler - placeholder for review comments
  // TODO: Integrate with proper Comment model and ReviewProvider when connecting to backend
  void _showCommentOptionsMenu(Map<String, dynamic> comment) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Icon(Icons.info_outline, color: AppTheme.infoBlue),
              title: Text(
                'Comment editing for reviews',
                style: AppTheme.bodyMedium.copyWith(fontWeight: FontWeight.bold),
              ),
              subtitle: Text(
                'Edit and delete functionality will be available when the backend API is connected.',
                style: AppTheme.bodySmall.copyWith(color: AppTheme.textSecondary),
              ),
            ),
            const SizedBox(height: 8),
            ListTile(
              leading: Icon(Icons.edit, color: Colors.grey),
              title: Text('Edit Comment', style: TextStyle(color: Colors.grey)),
              onTap: null, // Disabled for now
            ),
            ListTile(
              leading: Icon(Icons.delete, color: Colors.grey),
              title: Text('Delete Comment', style: TextStyle(color: Colors.grey)),
              onTap: null, // Disabled for now
            ),
          ],
        ),
      ),
    );
  }

  void _handleReportReview() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppTheme.backgroundLight,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Report Review',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.close, color: AppTheme.textSecondary),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              SizedBox(height: 8),
              Text(
                'Why are you reporting this review?',
                style: TextStyle(
                  fontSize: 14,
                  color: AppTheme.textSecondary,
                ),
              ),
              SizedBox(height: 20),
              
              // Report Reasons
              _buildReportOption(
                icon: Icons.gpp_bad_outlined,
                title: 'Fake or misleading',
                subtitle: 'This review appears to be fake or contains false information',
                onTap: () => _submitReport('fake'),
              ),
              _buildReportOption(
                icon: Icons.not_interested_outlined,
                title: 'Not relevant',
                subtitle: 'This review is not relevant to the entity',
                onTap: () => _submitReport('not_relevant'),
              ),
              _buildReportOption(
                icon: Icons.report_outlined,
                title: 'Inappropriate content',
                subtitle: 'Contains offensive, hateful, or inappropriate language',
                onTap: () => _submitReport('inappropriate'),
              ),
              _buildReportOption(
                icon: Icons.block_outlined,
                title: 'Spam',
                subtitle: 'This review is spam, repetitive, or promotional',
                onTap: () => _submitReport('spam'),
              ),
              _buildReportOption(
                icon: Icons.person_off_outlined,
                title: 'Harassment',
                subtitle: 'This review is harassing or threatening',
                onTap: () => _submitReport('harassment'),
              ),
              SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () => _submitReport('other'),
                  child: Text('Other reason', style: TextStyle(color: AppTheme.primaryPurple)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildReportOption({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: EdgeInsets.all(16),
        margin: EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey[300]!),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Container(
              padding: EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: Colors.red, size: 24),
            ),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 11,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios, size: 16, color: AppTheme.textSecondary),
          ],
        ),
      ),
    );
  }

  void _submitReport(String reason) {
    Navigator.pop(context); // Close report modal
    
    // TODO: Send report to backend
    // API call: POST /reviews/{id}/report with body: { reason: reason }
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Thank you for reporting. We\'ll review this content.'),
        duration: const Duration(seconds: 2),
        backgroundColor: AppTheme.warningOrange,
      ),
    );
  }}