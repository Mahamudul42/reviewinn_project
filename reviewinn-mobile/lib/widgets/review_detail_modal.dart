import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';
import '../models/review_model.dart';
import '../config/app_theme.dart';
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

  @override
  void initState() {
    super.initState();
    isLiked = widget.review.isLiked ?? false;
    isBookmarked = false; // Would come from backend
    likesCount = widget.review.likesCount ?? 0;
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

                    // Stats
                    _buildStats(),
                    const SizedBox(height: AppTheme.spaceXL),

                    // Comments Section
                    _buildCommentsSection(context),
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
              widget.review.entityName!,
              style: AppTheme.labelMedium.copyWith(
                color: AppTheme.primaryPurpleDark,
                fontSize: 16,
              ),
            ),
          ),
          const SizedBox(width: AppTheme.spaceM),
          PurpleStarRating(
            rating: widget.review.rating,
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
        // Secondary Actions Row
        Row(
          children: [
            // Bookmark Button
            Expanded(
              child: InkWell(
                onTap: () {
                  setState(() {
                    isBookmarked = !isBookmarked;
                  });
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(isBookmarked ? 'Review bookmarked!' : 'Bookmark removed'),
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
                    color: isBookmarked 
                        ? AppTheme.accentYellow.withOpacity(0.1) 
                        : Colors.white,
                    border: Border.all(
                      color: isBookmarked 
                          ? AppTheme.accentYellow 
                          : AppTheme.borderLight,
                      width: 2,
                    ),
                    borderRadius: AppTheme.radiusMedium,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        isBookmarked ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
                        color: isBookmarked ? AppTheme.accentYellow : AppTheme.textSecondary,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        isBookmarked ? 'Saved' : 'Save',
                        style: AppTheme.labelMedium.copyWith(
                          color: isBookmarked ? AppTheme.accentYellow : AppTheme.textSecondary,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: AppTheme.spaceM),
            // Share Button
            Expanded(
              child: InkWell(
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
                        content: Text('Error sharing: $e'),
                        backgroundColor: AppTheme.errorRed,
                      ),
                    );
                  }
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    vertical: AppTheme.spaceM,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(
                      color: AppTheme.borderLight,
                      width: 2,
                    ),
                    borderRadius: AppTheme.radiusMedium,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.share_rounded,
                        color: AppTheme.textSecondary,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Share',
                        style: AppTheme.labelMedium.copyWith(
                          color: AppTheme.textSecondary,
                          fontSize: 16,
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
    );
  }

  Widget _buildCommentsSection(BuildContext context) {
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

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Comments Header
        Container(
          padding: const EdgeInsets.all(AppTheme.spaceL),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                AppTheme.infoBlue.withOpacity(0.1),
                AppTheme.primaryPurple.withOpacity(0.1),
              ],
            ),
            borderRadius: AppTheme.radiusMedium,
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.infoBlue.withOpacity(0.2),
                  borderRadius: AppTheme.radiusSmall,
                ),
                child: Icon(
                  Icons.forum_rounded,
                  color: AppTheme.infoBlue,
                  size: 20,
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
                        fontSize: 18,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${mockComments.length} comments',
                      style: AppTheme.bodySmall.copyWith(
                        color: AppTheme.textTertiary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppTheme.spaceL),

        // Comment Input
        Container(
          padding: const EdgeInsets.all(AppTheme.spaceM),
          decoration: BoxDecoration(
            color: AppTheme.backgroundLight,
            borderRadius: AppTheme.radiusMedium,
            border: Border.all(
              color: AppTheme.borderLight,
            ),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: AppTheme.primaryPurpleLight.withOpacity(0.2),
                child: Icon(
                  Icons.person_rounded,
                  size: 20,
                  color: AppTheme.primaryPurple,
                ),
              ),
              const SizedBox(width: AppTheme.spaceM),
              Expanded(
                child: Text(
                  'Add a comment...',
                  style: AppTheme.bodyMedium.copyWith(
                    color: AppTheme.textTertiary,
                  ),
                ),
              ),
              Icon(
                Icons.send_rounded,
                color: AppTheme.primaryPurple,
                size: 20,
              ),
            ],
          ),
        ),
        const SizedBox(height: AppTheme.spaceL),

        // Comments List
        ...mockComments.map((comment) => _buildCommentItem(comment)),
      ],
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
                onPressed: () {},
                icon: const Icon(
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
}
