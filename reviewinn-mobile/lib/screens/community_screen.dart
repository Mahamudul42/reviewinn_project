import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../config/app_colors.dart';
import '../providers/community_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/bookmark_provider.dart';
import '../widgets/community/community_post_card.dart';
import '../widgets/post_detail_modal.dart';
import '../widgets/review_detail_modal.dart';
import '../models/community_post_model.dart';
import '../services/mock_data.dart';
import 'login_screen.dart';

enum SortOption { latest, trending, popular }

class CommunityScreen extends StatefulWidget {
  const CommunityScreen({super.key});

  @override
  State<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen>
    with SingleTickerProviderStateMixin {
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  String _searchQuery = '';
  SortOption _sortOption = SortOption.latest;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      setState(() {
        switch (_tabController.index) {
          case 0:
            _sortOption = SortOption.latest;
            break;
          case 1:
            _sortOption = SortOption.trending;
            break;
          case 2:
            _sortOption = SortOption.popular;
            break;
        }
      });
    });

    _scrollController.addListener(_onScroll);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<CommunityProvider>(context, listen: false)
          .fetchPosts(refresh: true);
    });
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent * 0.8) {
      final provider = Provider.of<CommunityProvider>(context, listen: false);
      if (!provider.isLoadingMore && provider.hasMorePosts) {
        provider.loadMorePosts();
      }
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  List<CommunityPost> _getFilteredAndSortedPosts(
      List<CommunityPost> posts) {
    // First, filter by search query
    var filtered = posts;
    if (_searchQuery.isNotEmpty) {
      final query = _searchQuery.toLowerCase();
      filtered = posts.where((post) {
        return post.title.toLowerCase().contains(query) ||
            post.content.toLowerCase().contains(query) ||
            (post.tags?.any((tag) => tag.toLowerCase().contains(query)) ??
                false);
      }).toList();
    }

    // Then, sort based on selected option
    switch (_sortOption) {
      case SortOption.latest:
        filtered.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        break;
      case SortOption.trending:
        // Trending = combination of recent + engagement
        filtered.sort((a, b) {
          final aScore = a.likesCount + a.commentsCount +
              (a.viewCount / 10).round() -
              DateTime.now().difference(a.createdAt).inHours;
          final bScore = b.likesCount + b.commentsCount +
              (b.viewCount / 10).round() -
              DateTime.now().difference(b.createdAt).inHours;
          return bScore.compareTo(aScore);
        });
        break;
      case SortOption.popular:
        // Popular = most engagement overall
        filtered.sort((a, b) {
          final aScore = a.likesCount + (a.commentsCount * 2);
          final bScore = b.likesCount + (b.commentsCount * 2);
          return bScore.compareTo(aScore);
        });
        break;
    }

    return filtered;
  }

  Future<void> _handleLike(int postId) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (!authProvider.isAuthenticated) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
      return;
    }

    final provider = Provider.of<CommunityProvider>(context, listen: false);
    await provider.toggleLike(postId);
  }

  Future<void> _handleBookmark(CommunityPost post) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (!authProvider.isAuthenticated) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
      return;
    }

    final bookmarkProvider =
        Provider.of<BookmarkProvider>(context, listen: false);
    bookmarkProvider.togglePostBookmark(post);
  }

  void _handleReviewPreviewTap(int reviewId) {
    // Get review from mock data
    final allReviews = MockData.getMockReviews(0);
    final review = allReviews.firstWhere(
      (r) => r.reviewId == reviewId,
      orElse: () => allReviews.first,
    );

    // Show review detail modal
    ReviewDetailModal.show(context, review);
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Scaffold(
      backgroundColor: colors.background,
      body: SafeArea(
        child: Consumer<CommunityProvider>(
          builder: (context, communityProvider, child) {
            final filteredPosts =
                _getFilteredAndSortedPosts(communityProvider.posts);

            return RefreshIndicator(
              onRefresh: () => communityProvider.fetchPosts(refresh: true),
              color: AppTheme.primaryPurple,
              child: CustomScrollView(
                controller: _scrollController,
                slivers: [
                  // Header with icon and title
                  SliverAppBar(
                    floating: true,
                    snap: true,
                    backgroundColor: colors.cardBackground,
                    elevation: 0,
                    title: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                AppTheme.primaryPurple.withOpacity(0.2),
                                AppTheme.primaryPurple.withOpacity(0.1),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(
                            Icons.public_rounded,
                            color: AppTheme.primaryPurple,
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'Community',
                          style: AppTheme.headingMedium.copyWith(
                            fontSize: 22,
                            color: colors.textPrimary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Search bar
                  SliverToBoxAdapter(
                    child: Container(
                      color: colors.cardBackground,
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                      child: TextField(
                        controller: _searchController,
                        onChanged: (value) {
                          setState(() => _searchQuery = value);
                        },
                        decoration: InputDecoration(
                          hintText: 'Search discussions, tags...',
                          hintStyle: TextStyle(color: colors.textTertiary),
                          prefixIcon: Icon(Icons.search, color: colors.iconSecondary),
                          suffixIcon: _searchQuery.isNotEmpty
                              ? IconButton(
                                  icon: Icon(Icons.clear, color: colors.iconSecondary),
                                  onPressed: () {
                                    _searchController.clear();
                                    setState(() => _searchQuery = '');
                                  },
                                )
                              : null,
                          filled: true,
                          fillColor: colors.background,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 12,
                          ),
                        ),
                      ),
                    ),
                  ),

                  // Sort Tabs
                  SliverPersistentHeader(
                    pinned: true,
                    delegate: _SliverAppBarDelegate(
                      TabBar(
                        controller: _tabController,
                        labelColor: AppTheme.primaryPurple,
                        unselectedLabelColor: colors.textSecondary,
                        indicatorColor: AppTheme.primaryPurple,
                        indicatorWeight: 3,
                        labelStyle: AppTheme.bodyMedium.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                        unselectedLabelStyle: AppTheme.bodyMedium,
                        tabs: const [
                          Tab(text: 'Latest'),
                          Tab(text: 'Trending'),
                          Tab(text: 'Popular'),
                        ],
                      ),
                    ),
                  ),

                  // Main content
                  if (communityProvider.isLoading &&
                      communityProvider.posts.isEmpty)
                    SliverFillRemaining(
                      child: Center(
                        child: CircularProgressIndicator(
                          color: AppTheme.primaryPurple,
                        ),
                      ),
                    )
                  else if (filteredPosts.isEmpty)
                    SliverFillRemaining(
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              _searchQuery.isNotEmpty
                                  ? Icons.search_off
                                  : Icons.forum_outlined,
                              size: 80,
                              color: colors.iconSecondary,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              _searchQuery.isNotEmpty
                                  ? 'No posts found'
                                  : 'No posts yet',
                              style: AppTheme.headingMedium.copyWith(
                                color: colors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              _searchQuery.isNotEmpty
                                  ? 'Try different keywords'
                                  : 'Be the first to start a discussion',
                              style: AppTheme.bodyMedium.copyWith(
                                color: colors.textSecondary,
                              ),
                            ),
                            if (_searchQuery.isNotEmpty) ...[
                              const SizedBox(height: 16),
                              ElevatedButton.icon(
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() => _searchQuery = '');
                                },
                                icon: const Icon(Icons.clear),
                                label: const Text('Clear Search'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.primaryPurple,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 24,
                                    vertical: 12,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    )
                  else
                    SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          if (index >= filteredPosts.length) {
                            return Container(
                              padding: const EdgeInsets.all(16),
                              alignment: Alignment.center,
                              child: CircularProgressIndicator(
                                color: AppTheme.primaryPurple,
                              ),
                            );
                          }

                          final post = filteredPosts[index];

                          // Check if post is bookmarked
                          final bookmarkProvider =
                              Provider.of<BookmarkProvider>(context);
                          final isBookmarked =
                              bookmarkProvider.isPostBookmarked(post.postId);

                          // Use beautiful CommunityPostCard widget
                          return CommunityPostCard(
                            post: post,
                            isBookmarked: isBookmarked,
                            onTap: () {
                              showDialog(
                                context: context,
                                builder: (context) => PostDetailModal(post: post),
                              );
                            },
                            onLikeTap: () => _handleLike(post.postId),
                            onBookmarkTap: () => _handleBookmark(post),
                            onReviewPreviewTap: () {
                              // Extract review ID and show review
                              final reviewIdMatch = RegExp(
                                      r'(?:reviewinn\.com)?/review/(\d+)')
                                  .firstMatch(post.content);
                              if (reviewIdMatch != null) {
                                final reviewId =
                                    int.tryParse(reviewIdMatch.group(1) ?? '');
                                if (reviewId != null) {
                                  _handleReviewPreviewTap(reviewId);
                                }
                              }
                            },
                          );
                        },
                        childCount: filteredPosts.length +
                            (communityProvider.isLoadingMore ? 1 : 0),
                      ),
                    ),

                  // Bottom padding
                  const SliverToBoxAdapter(
                    child: SizedBox(height: 80),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

// Helper class for sticky tabs
class _SliverAppBarDelegate extends SliverPersistentHeaderDelegate {
  _SliverAppBarDelegate(this._tabBar);

  final TabBar _tabBar;

  @override
  double get minExtent => _tabBar.preferredSize.height;

  @override
  double get maxExtent => _tabBar.preferredSize.height;

  @override
  Widget build(
      BuildContext context, double shrinkOffset, bool overlapsContent) {
    final colors = context.colors;
    return Container(
      color: colors.cardBackground,
      child: _tabBar,
    );
  }

  @override
  bool shouldRebuild(_SliverAppBarDelegate oldDelegate) {
    return false;
  }
}
