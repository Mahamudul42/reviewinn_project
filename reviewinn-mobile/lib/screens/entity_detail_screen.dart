import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../providers/entity_provider.dart';
import '../providers/review_provider.dart';
import '../providers/community_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/bookmark_provider.dart';
import '../widgets/beautiful_review_card.dart';
import '../widgets/purple_star_rating.dart';
import '../widgets/community/community_post_card.dart';
import '../widgets/post_detail_modal.dart';
import '../widgets/review_detail_modal.dart';
import '../widgets/community/new_post_modal.dart';
import '../config/app_theme.dart';
import '../models/review_model.dart';
import '../models/community_post_model.dart';
import 'write_review_screen.dart';
import 'login_screen.dart';

class EntityDetailScreen extends StatefulWidget {
  final int entityId;

  const EntityDetailScreen({super.key, required this.entityId});

  @override
  State<EntityDetailScreen> createState() => _EntityDetailScreenState();
}

class _EntityDetailScreenState extends State<EntityDetailScreen>
    with SingleTickerProviderStateMixin {
  int? _selectedRatingFilter; // null means "All Reviews"
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      setState(() {}); // Rebuild when tab changes
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<EntityProvider>(context, listen: false)
          .fetchEntity(widget.entityId);
      Provider.of<ReviewProvider>(context, listen: false)
          .fetchEntityReviews(widget.entityId);
      Provider.of<CommunityProvider>(context, listen: false)
          .fetchPosts(refresh: true);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      body: Consumer<EntityProvider>(
        builder: (context, entityProvider, child) {
          if (entityProvider.isLoading) {
            return Center(
              child: CircularProgressIndicator(
                color: AppTheme.primaryPurple,
              ),
            );
          }

          final entity = entityProvider.selectedEntity;
          if (entity == null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.business_outlined,
                    size: 80,
                    color: Colors.grey.shade400,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Entity not found',
                    style: AppTheme.headingMedium.copyWith(
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            );
          }

          return CustomScrollView(
            slivers: [
              // Modern App Bar with Entity Info
              SliverAppBar(
                expandedHeight: 180,
                pinned: true,
                backgroundColor: Colors.white,
                elevation: 0,
                leading: Container(
                  margin: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.black),
                    onPressed: () => Navigator.pop(context),
                  ),
                ),
                actions: [
                  Container(
                    margin: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Consumer<BookmarkProvider>(
                      builder: (context, bookmarkProvider, child) {
                        final isBookmarked = bookmarkProvider.isEntityBookmarked(entity.entityId);
                        return IconButton(
                          icon: Icon(
                            isBookmarked ? Icons.bookmark : Icons.bookmark_border,
                            color: isBookmarked ? AppTheme.primaryPurple : Colors.black,
                          ),
                          onPressed: () {
                            bookmarkProvider.toggleEntityBookmark(entity);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks',
                                ),
                                behavior: SnackBarBehavior.floating,
                                duration: const Duration(seconds: 2),
                              ),
                            );
                          },
                        );
                      },
                    ),
                  ),
                ],
                flexibleSpace: FlexibleSpaceBar(
                  background: Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 10,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: SafeArea(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 60, 16, 16),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            // Entity Avatar - Larger and More Prominent
                            Container(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: AppTheme.primaryPurple.withOpacity(0.2),
                                  width: 3,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppTheme.primaryPurple.withOpacity(0.1),
                                    blurRadius: 12,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(17),
                                child: entity.avatar != null
                                    ? CachedNetworkImage(
                                        imageUrl: entity.avatar!,
                                        width: 90,
                                        height: 90,
                                        fit: BoxFit.cover,
                                        placeholder: (context, url) => Container(
                                          width: 90,
                                          height: 90,
                                          color: Colors.grey.shade100,
                                          child: Center(
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                              color: AppTheme.primaryPurple,
                                            ),
                                          ),
                                        ),
                                        errorWidget: (context, url, error) => Container(
                                          width: 90,
                                          height: 90,
                                          color: Colors.grey.shade100,
                                          child: Icon(
                                            Icons.business_rounded,
                                            size: 45,
                                            color: Colors.grey.shade400,
                                          ),
                                        ),
                                      )
                                    : Container(
                                        width: 90,
                                        height: 90,
                                        color: AppTheme.primaryPurple.withOpacity(0.1),
                                        child: Icon(
                                          Icons.business_rounded,
                                          size: 45,
                                          color: AppTheme.primaryPurple,
                                        ),
                                      ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            // Entity Name and Categories
                            Expanded(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  // Entity Name with Verified Badge
                                  Row(
                                    children: [
                                      Flexible(
                                        child: Text(
                                          entity.name,
                                          style: AppTheme.headingMedium.copyWith(
                                            fontSize: 18,
                                            fontWeight: FontWeight.bold,
                                            height: 1.2,
                                          ),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      Icon(
                                        Icons.verified,
                                        color: Colors.blue,
                                        size: 18,
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  // Category Badges
                                  if (entity.rootCategoryName != null || entity.finalCategoryName != null)
                                    SingleChildScrollView(
                                      scrollDirection: Axis.horizontal,
                                      child: Row(
                                        children: [
                                          if (entity.rootCategoryName != null)
                                            _buildSmallCategoryChip(
                                              entity.rootCategoryName!,
                                              entity.rootCategoryIcon ?? '📁',
                                            ),
                                          if (entity.finalCategoryName != null &&
                                              entity.rootCategoryId != entity.finalCategoryId) ...[
                                            const SizedBox(width: 6),
                                            _buildSmallCategoryChip(
                                              entity.finalCategoryName!,
                                              entity.finalCategoryIcon ?? '🏷️',
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              
              // Entity Description (if available)
              if (entity.description != null && entity.description!.isNotEmpty)
                SliverToBoxAdapter(
                  child: Container(
                    margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: Colors.grey.shade200,
                        width: 1,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: AppTheme.primaryPurple.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Icon(
                                Icons.info_outline,
                                size: 14,
                                color: AppTheme.primaryPurple,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'About',
                              style: AppTheme.headingSmall.copyWith(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          entity.description!,
                          style: AppTheme.bodyMedium.copyWith(
                            color: Colors.grey.shade700,
                            height: 1.6,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              
              // Rating and Filter Section - Compact Clickable Card
              SliverToBoxAdapter(
                child: Container(
                  margin: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: Colors.grey.shade200,
                      width: 1,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            // Compact Rating Box
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              decoration: BoxDecoration(
                                color: AppTheme.primaryPurple.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    entity.averageRating?.toStringAsFixed(1) ?? '0.0',
                                    style: AppTheme.headingLarge.copyWith(
                                      fontSize: 24,
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.primaryPurple,
                                      height: 1,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Icon(
                                    Icons.star,
                                    color: AppTheme.primaryPurple,
                                    size: 20,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            // Stars and Count
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: List.generate(
                                      5,
                                      (index) => Icon(
                                        index < (entity.averageRating?.floor() ?? 0)
                                            ? Icons.star
                                            : Icons.star_border,
                                        color: AppTheme.primaryPurple,
                                        size: 16,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Consumer<ReviewProvider>(
                                    builder: (context, reviewProvider, child) {
                                      return Text(
                                        '${reviewProvider.entityReviews.length} reviews',
                                        style: AppTheme.bodySmall.copyWith(
                                          color: Colors.grey.shade600,
                                          fontSize: 12,
                                        ),
                                      );
                                    },
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      
                      // Clickable Rating Breakdown Bars
                      Consumer<ReviewProvider>(
                        builder: (context, reviewProvider, child) {
                          return Column(
                            children: List.generate(5, (index) {
                              final rating = 5 - index;
                              final count = _getReviewCountByRating(reviewProvider.entityReviews, rating);
                              final total = reviewProvider.entityReviews.length;
                              final percentage = total > 0 ? count / total : 0.0;
                              final isSelected = _selectedRatingFilter == rating;
                              
                              return InkWell(
                                onTap: () {
                                  setState(() {
                                    _selectedRatingFilter = isSelected ? null : rating;
                                  });
                                },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  color: isSelected ? AppTheme.primaryPurple.withOpacity(0.05) : Colors.transparent,
                                  child: Row(
                                    children: [
                                      // Rating label
                                      SizedBox(
                                        width: 30,
                                        child: Row(
                                          children: [
                                            Text(
                                              '$rating',
                                              style: AppTheme.bodyMedium.copyWith(
                                                color: isSelected ? AppTheme.primaryPurple : Colors.black,
                                                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                                              ),
                                            ),
                                            const SizedBox(width: 2),
                                            Icon(
                                              Icons.star,
                                              size: 12,
                                              color: isSelected ? AppTheme.primaryPurple : Colors.grey.shade400,
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      // Progress bar
                                      Expanded(
                                        child: Container(
                                          height: 6,
                                          decoration: BoxDecoration(
                                            color: Colors.grey.shade200,
                                            borderRadius: BorderRadius.circular(3),
                                          ),
                                          child: FractionallySizedBox(
                                            alignment: Alignment.centerLeft,
                                            widthFactor: percentage,
                                            child: Container(
                                              decoration: BoxDecoration(
                                                color: isSelected ? AppTheme.primaryPurple : AppTheme.primaryPurple.withOpacity(0.6),
                                                borderRadius: BorderRadius.circular(3),
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      // Count
                                      SizedBox(
                                        width: 35,
                                        child: Text(
                                          '$count',
                                          style: AppTheme.bodySmall.copyWith(
                                            color: isSelected ? AppTheme.primaryPurple : Colors.grey.shade600,
                                            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                          ),
                                          textAlign: TextAlign.right,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            }),
                          );
                        },
                      ),
                      const SizedBox(height: 8),
                    ],
                  ),
                ),
              ),

              // Tab Bar
              SliverPersistentHeader(
                pinned: true,
                delegate: _SliverAppBarDelegate(
                  TabBar(
                    controller: _tabController,
                    labelColor: AppTheme.primaryPurple,
                    unselectedLabelColor: Colors.grey[600],
                    indicatorColor: AppTheme.primaryPurple,
                    indicatorWeight: 3,
                    tabs: const [
                      Tab(text: 'Reviews'),
                      Tab(text: 'Discussion'),
                    ],
                  ),
                ),
              ),

              // Reviews Section Header (only show on Reviews tab)
              if (_tabController.index == 0)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                  child: Row(
                    children: [
                      Icon(
                        Icons.rate_review_rounded,
                        color: AppTheme.primaryPurple,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _selectedRatingFilter == null 
                            ? 'All Reviews' 
                            : '$_selectedRatingFilter-Star Reviews',
                        style: AppTheme.headingMedium.copyWith(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      if (_selectedRatingFilter != null) ...[
                        const Spacer(),
                        TextButton(
                          onPressed: () {
                            setState(() {
                              _selectedRatingFilter = null;
                            });
                          },
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: Text(
                            'Clear',
                            style: AppTheme.bodySmall.copyWith(
                              color: AppTheme.primaryPurple,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              
              // Reviews List (only show on Reviews tab)
              if (_tabController.index == 0)
              Consumer<ReviewProvider>(
                builder: (context, reviewProvider, child) {
                  if (reviewProvider.isLoading) {
                    return SliverToBoxAdapter(
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32.0),
                          child: CircularProgressIndicator(
                            color: AppTheme.primaryPurple,
                          ),
                        ),
                      ),
                    );
                  }

                  // Filter reviews by selected rating
                  final filteredReviews = _selectedRatingFilter == null
                      ? reviewProvider.entityReviews
                      : reviewProvider.entityReviews.where((review) {
                          return review.rating.toInt() == _selectedRatingFilter;
                        }).toList();

                  if (filteredReviews.isEmpty) {
                    return SliverToBoxAdapter(
                      child: Container(
                        margin: const EdgeInsets.all(16),
                        padding: const EdgeInsets.all(40),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: Colors.grey.shade200,
                            width: 1,
                          ),
                        ),
                        child: Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade100,
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                Icons.rate_review_outlined,
                                size: 50,
                                color: Colors.grey.shade400,
                              ),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              _selectedRatingFilter == null 
                                  ? 'No reviews yet'
                                  : 'No ${_selectedRatingFilter}-star reviews',
                              style: AppTheme.headingSmall.copyWith(
                                color: Colors.grey.shade700,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              _selectedRatingFilter == null
                                  ? 'Be the first to review this entity'
                                  : 'Try selecting a different rating',
                              style: AppTheme.bodyMedium.copyWith(
                                color: Colors.grey.shade500,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    );
                  }

                  return SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        return BeautifulReviewCard(
                          review: filteredReviews[index],
                        );
                      },
                      childCount: filteredReviews.length,
                    ),
                  );
                },
              ),

              // Discussion List (only show on Discussion tab)
              if (_tabController.index == 1)
              Consumer<CommunityProvider>(
                builder: (context, communityProvider, child) {
                  // Filter posts for this entity
                  final entityPosts = communityProvider.posts
                      .where((post) =>
                          post.postType == PostType.entity &&
                          post.entityId == widget.entityId)
                      .toList();

                  if (communityProvider.isLoading && entityPosts.isEmpty) {
                    return SliverToBoxAdapter(
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32.0),
                          child: CircularProgressIndicator(
                            color: AppTheme.primaryPurple,
                          ),
                        ),
                      ),
                    );
                  }

                  if (entityPosts.isEmpty) {
                    return SliverToBoxAdapter(
                      child: Container(
                        margin: const EdgeInsets.all(16),
                        padding: const EdgeInsets.all(40),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Column(
                          children: [
                            Icon(
                              Icons.forum_outlined,
                              size: 60,
                              color: Colors.grey[400],
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No discussions yet',
                              style: AppTheme.headingMedium,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Be the first to start a discussion',
                              style: AppTheme.bodyMedium.copyWith(
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }

                  return SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final post = entityPosts[index];
                        final bookmarkProvider = Provider.of<BookmarkProvider>(context);
                        final isBookmarked = bookmarkProvider.isPostBookmarked(post.postId);

                        return CommunityPostCard(
                          post: post,
                          isBookmarked: isBookmarked,
                          onTap: () {
                            showDialog(
                              context: context,
                              builder: (context) => PostDetailModal(post: post),
                            );
                          },
                          onLikeTap: () => communityProvider.toggleLike(post.postId),
                          onBookmarkTap: () => bookmarkProvider.togglePostBookmark(post),
                          onReviewPreviewTap: () {
                            // Extract review ID and show review if present
                            final reviewIdMatch = RegExp(r'(?:reviewinn\.com)?/review/(\d+)')
                                .firstMatch(post.content);
                            if (reviewIdMatch != null) {
                              final reviewId = int.tryParse(reviewIdMatch.group(1) ?? '');
                              if (reviewId != null) {
                                // Show review detail (implementation depends on mock data)
                              }
                            }
                          },
                        );
                      },
                      childCount: entityPosts.length,
                    ),
                  );
                },
              ),

              // Bottom Padding
              const SliverToBoxAdapter(
                child: SizedBox(height: 100),
              ),
            ],
          );
        },
      ),
      floatingActionButton: Consumer<EntityProvider>(
        builder: (context, entityProvider, child) {
          final entity = entityProvider.selectedEntity;
          if (entity == null) return const SizedBox.shrink();

          return FloatingActionButton.extended(
            onPressed: () {
              final authProvider = Provider.of<AuthProvider>(context, listen: false);
              if (!authProvider.isAuthenticated) {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const LoginScreen()),
                );
                return;
              }

              if (_tabController.index == 0) {
                // Reviews tab - Write Review
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => WriteReviewScreen(
                      preselectedEntity: entity,
                    ),
                  ),
                );
              } else {
                // Discussion tab - New Post
                showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  backgroundColor: Colors.transparent,
                  builder: (context) => NewPostModal(
                    preselectedEntity: entity,
                  ),
                );
              }
            },
            backgroundColor: AppTheme.primaryPurple,
            elevation: 4,
            icon: Icon(
              _tabController.index == 0 ? Icons.edit_rounded : Icons.add_comment,
              color: Colors.white,
              size: 22,
            ),
            label: Text(
              _tabController.index == 0 ? 'Write Review' : 'New Post',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildCategoryChip(String label, String icon, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
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
            style: const TextStyle(fontSize: 14),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  // Helper method to count reviews by rating
  int _getReviewCountByRating(List<Review> reviews, int rating) {
    return reviews.where((review) {
      return review.rating.toInt() == rating;
    }).length;
  }

  // Helper method to build small category chips
  Widget _buildSmallCategoryChip(String label, String icon) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppTheme.primaryPurple.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppTheme.primaryPurple.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            icon,
            style: const TextStyle(fontSize: 12),
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: AppTheme.bodySmall.copyWith(
              color: AppTheme.primaryPurple,
              fontWeight: FontWeight.w600,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}

// SliverPersistentHeaderDelegate for pinned tab bar
class _SliverAppBarDelegate extends SliverPersistentHeaderDelegate {
  _SliverAppBarDelegate(this._tabBar);

  final TabBar _tabBar;

  @override
  double get minExtent => _tabBar.preferredSize.height;

  @override
  double get maxExtent => _tabBar.preferredSize.height;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return Container(
      color: Colors.white,
      child: _tabBar,
    );
  }

  @override
  bool shouldRebuild(_SliverAppBarDelegate oldDelegate) {
    return false;
  }
}
