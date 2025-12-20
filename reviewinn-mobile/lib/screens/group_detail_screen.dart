import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/review_provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/beautiful_review_card.dart';
import '../config/app_theme.dart';

class GroupDetailScreen extends StatefulWidget {
  final int groupId;
  final String groupName;
  final String groupDescription;
  final String groupAvatar;
  final String groupCategory;
  final int memberCount;
  final int postCount;

  const GroupDetailScreen({
    super.key,
    required this.groupId,
    required this.groupName,
    required this.groupDescription,
    required this.groupAvatar,
    required this.groupCategory,
    required this.memberCount,
    required this.postCount,
  });

  @override
  State<GroupDetailScreen> createState() => _GroupDetailScreenState();
}

class _GroupDetailScreenState extends State<GroupDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ScrollController _scrollController = ScrollController();
  bool _isCollapsed = false;

  // Get relevant entity types based on group category
  List<String> get _relevantEntityTypes {
    switch (widget.groupCategory) {
      case 'Education':
        return ['Professor', 'Department', 'University', 'Admin Staff', 'Course'];
      case 'Technology':
        return ['Software', 'Hardware', 'Service', 'Company', 'Developer Tool'];
      case 'Food & Dining':
        return ['Restaurant', 'Cafe', 'Food Truck', 'Chef', 'Dish'];
      case 'Products':
        return ['Electronics', 'Clothing', 'Home & Garden', 'Beauty', 'Sports'];
      case 'Business':
        return ['Company', 'Service', 'Startup', 'Co-working Space', 'Event'];
      default:
        return ['General'];
    }
  }

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _scrollController.addListener(_onScroll);

    // Load group-specific reviews
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<ReviewProvider>(context, listen: false)
          .fetchReviews(refresh: true);
    });
  }

  void _onScroll() {
    if (_scrollController.hasClients) {
      final bool shouldCollapse = _scrollController.offset > 50;
      if (shouldCollapse != _isCollapsed) {
        setState(() {
          _isCollapsed = shouldCollapse;
        });
      }

      // Load more reviews when near bottom
      final maxScroll = _scrollController.position.maxScrollExtent;
      final currentScroll = _scrollController.position.pixels;
      final delta = 200.0;

      if (maxScroll - currentScroll <= delta) {
        final reviewProvider = Provider.of<ReviewProvider>(context, listen: false);
        if (reviewProvider.hasMoreReviews && !reviewProvider.isLoadingMore) {
          reviewProvider.loadMoreReviews();
        }
      }
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppTheme.primaryPurple.withOpacity(0.05),
              Colors.grey.shade100,
            ],
          ),
        ),
        child: SafeArea(
          child: NestedScrollView(
            controller: _scrollController,
            headerSliverBuilder: (context, innerBoxIsScrolled) {
              return [
                // Group Header
                SliverAppBar(
                  expandedHeight: 280,
                  pinned: true,
                  floating: false,
                  backgroundColor: AppTheme.primaryPurple,
                  flexibleSpace: FlexibleSpaceBar(
                    title: AnimatedOpacity(
                      opacity: _isCollapsed ? 1.0 : 0.0,
                      duration: const Duration(milliseconds: 200),
                      child: Text(
                        widget.groupName,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    background: _buildGroupHeader(),
                  ),
                ),

                // Tab Bar
                SliverPersistentHeader(
                  pinned: true,
                  delegate: _SliverAppBarDelegate(
                    TabBar(
                      controller: _tabController,
                      labelColor: AppTheme.primaryPurple,
                      unselectedLabelColor: AppTheme.textSecondary,
                      indicatorColor: AppTheme.primaryPurple,
                      indicatorWeight: 3,
                      tabs: const [
                        Tab(text: 'Reviews'),
                        Tab(text: 'About'),
                        Tab(text: 'Members'),
                      ],
                    ),
                  ),
                ),
              ];
            },
            body: TabBarView(
              controller: _tabController,
              children: [
                _buildReviewsTab(),
                _buildAboutTab(),
                _buildMembersTab(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildGroupHeader() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppTheme.primaryPurple,
            AppTheme.primaryPurple.withOpacity(0.8),
          ],
        ),
      ),
      child: Stack(
        children: [
          // Background pattern
          Positioned.fill(
            child: Opacity(
              opacity: 0.1,
              child: Image.network(
                widget.groupAvatar,
                fit: BoxFit.cover,
              ),
            ),
          ),

          // Content
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    AppTheme.primaryPurple.withOpacity(0.8),
                  ],
                ),
              ),
              padding: const EdgeInsets.all(AppTheme.spaceL),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Group Avatar
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white, width: 3),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.3),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(13),
                      child: Image.network(
                        widget.groupAvatar,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Group Name
                  Text(
                    widget.groupName,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),

                  // Category Badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.accentYellow.withOpacity(0.9),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      widget.groupCategory,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.accentYellowDark,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Stats
                  Row(
                    children: [
                      _buildStat(
                        Icons.people_rounded,
                        '${_formatCount(widget.memberCount)} members',
                      ),
                      const SizedBox(width: 16),
                      _buildStat(
                        Icons.chat_bubble_rounded,
                        '${_formatCount(widget.postCount)} posts',
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStat(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.white.withOpacity(0.9)),
        const SizedBox(width: 4),
        Text(
          text,
          style: TextStyle(
            fontSize: 13,
            color: Colors.white.withOpacity(0.9),
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  String _formatCount(int count) {
    if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }

  Widget _buildReviewsTab() {
    return Consumer<ReviewProvider>(
      builder: (context, reviewProvider, child) {
        if (reviewProvider.isLoading && reviewProvider.reviews.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }

        if (reviewProvider.error != null && reviewProvider.reviews.isEmpty) {
          return _buildErrorState(reviewProvider.error!);
        }

        if (reviewProvider.reviews.isEmpty) {
          return _buildEmptyState();
        }

        return RefreshIndicator(
          onRefresh: () => reviewProvider.fetchReviews(refresh: true),
          child: ListView.builder(
            padding: const EdgeInsets.all(AppTheme.spaceL),
            itemCount: reviewProvider.reviews.length +
                (reviewProvider.isLoadingMore ? 1 : 0),
            itemBuilder: (context, index) {
              if (index >= reviewProvider.reviews.length) {
                return const Center(
                  child: Padding(
                    padding: EdgeInsets.all(16.0),
                    child: CircularProgressIndicator(),
                  ),
                );
              }

              final review = reviewProvider.reviews[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: AppTheme.spaceL),
                child: BeautifulReviewCard(review: review),
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildAboutTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppTheme.spaceL),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Description
          _buildSection(
            'About This Group',
            widget.groupDescription,
          ),
          const SizedBox(height: AppTheme.spaceXL),

          // Reviewable Entity Types
          _buildSection(
            'What You Can Review Here',
            'Members of this group can review:',
          ),
          const SizedBox(height: AppTheme.spaceM),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _relevantEntityTypes.map((type) {
              return Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppTheme.primaryPurple.withOpacity(0.1),
                      AppTheme.accentYellow.withOpacity(0.1),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: AppTheme.primaryPurple.withOpacity(0.3),
                    width: 1.5,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _getIconForEntityType(type),
                      size: 18,
                      color: AppTheme.primaryPurple,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      type,
                      style: AppTheme.labelMedium.copyWith(
                        color: AppTheme.primaryPurple,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: AppTheme.spaceXL),

          // Guidelines (if Education category)
          if (widget.groupCategory == 'Education') ...[
            _buildSection(
              'Review Guidelines',
              '• Be respectful and constructive\n'
              '• Focus on teaching quality and course content\n'
              '• Avoid personal attacks\n'
              '• Share specific examples when possible',
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildMembersTab() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spaceXL),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: AppTheme.primaryPurple.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.people_outline,
                size: 64,
                color: AppTheme.primaryPurple.withOpacity(0.5),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Members List',
              style: AppTheme.headingMedium,
            ),
            const SizedBox(height: 12),
            Text(
              'Coming Soon',
              style: AppTheme.bodyLarge.copyWith(
                color: AppTheme.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, String content) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: AppTheme.headingSmall.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: AppTheme.spaceM),
        Text(
          content,
          style: AppTheme.bodyMedium.copyWith(
            color: AppTheme.textSecondary,
            height: 1.6,
          ),
        ),
      ],
    );
  }

  IconData _getIconForEntityType(String type) {
    switch (type.toLowerCase()) {
      case 'professor':
        return Icons.school_rounded;
      case 'department':
        return Icons.business_rounded;
      case 'university':
        return Icons.account_balance_rounded;
      case 'admin staff':
        return Icons.admin_panel_settings_rounded;
      case 'course':
        return Icons.book_rounded;
      case 'software':
        return Icons.code_rounded;
      case 'hardware':
        return Icons.computer_rounded;
      case 'restaurant':
        return Icons.restaurant_rounded;
      case 'cafe':
        return Icons.local_cafe_rounded;
      case 'company':
        return Icons.domain_rounded;
      case 'startup':
        return Icons.rocket_launch_rounded;
      default:
        return Icons.category_rounded;
    }
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spaceXL),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: AppTheme.primaryPurple.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.reviews_outlined,
                size: 64,
                color: AppTheme.primaryPurple.withOpacity(0.5),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'No Reviews Yet',
              style: AppTheme.headingMedium,
            ),
            const SizedBox(height: 12),
            Text(
              'Be the first to share a review in this group!',
              style: AppTheme.bodyLarge.copyWith(
                color: AppTheme.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spaceXL),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: AppTheme.errorRed.withOpacity(0.5),
            ),
            const SizedBox(height: 24),
            const Text(
              'Oops!',
              style: AppTheme.headingMedium,
            ),
            const SizedBox(height: 12),
            Text(
              error,
              style: AppTheme.bodyLarge.copyWith(
                color: AppTheme.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                Provider.of<ReviewProvider>(context, listen: false)
                    .fetchReviews(refresh: true);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryPurple,
                foregroundColor: Colors.white,
              ),
              child: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }
}

// Custom SliverPersistentHeaderDelegate for TabBar
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
