import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/review_provider.dart';
import '../providers/community_provider.dart';
import '../providers/bookmark_provider.dart';
import '../widgets/beautiful_review_card.dart';
import '../widgets/community/community_post_card.dart';
import '../widgets/post_detail_modal.dart';
import '../widgets/review_detail_modal.dart';
import '../models/community_post_model.dart';
import '../services/mock_data.dart';
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
  bool _isMember = false; // Track if user is a member
  bool _isAdmin = false; // Track if user is admin
  List<CommunityPost> _discussions = [];

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
    _tabController = TabController(length: 4, vsync: this);
    _scrollController.addListener(_onScroll);

    // TODO: Check if user is member/admin from backend
    _isMember = true; // Mock: assume user is member
    _isAdmin = false; // Mock: user is not admin

    // Load group-specific reviews and discussions
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadGroupReviews();
      Provider.of<CommunityProvider>(context, listen: false)
          .fetchPosts(refresh: true);
    });
  }

  void _loadMockDiscussions() {
    final now = DateTime.now();
    setState(() {
      _discussions = [
        CommunityPost(
          postId: 301,
          title: 'Welcome to our group!',
          content: 'Please read the guidelines before posting. Let\'s keep this community helpful and respectful.',
          userId: 501,
          username: 'Sarah Johnson',
          userAvatar: 'https://i.pravatar.cc/150?img=1',
          likesCount: 24,
          commentsCount: 5,
          viewCount: 145,
          isLiked: false,
          isPinned: true,
          postType: PostType.group,
          groupId: widget.groupId,
          groupName: widget.groupName,
          groupAvatar: widget.groupAvatar,
          createdAt: now.subtract(const Duration(hours: 2)),
        ),
        CommunityPost(
          postId: 302,
          title: 'Great resources for beginners',
          content: 'I found these tutorials really helpful when I was starting out. Hope it helps someone!',
          userId: 502,
          username: 'Mike Chen',
          userAvatar: 'https://i.pravatar.cc/150?img=12',
          likesCount: 18,
          commentsCount: 9,
          viewCount: 98,
          isLiked: true,
          isPinned: false,
          postType: PostType.group,
          groupId: widget.groupId,
          groupName: widget.groupName,
          groupAvatar: widget.groupAvatar,
          createdAt: now.subtract(const Duration(hours: 5)),
        ),
        CommunityPost(
          postId: 303,
          title: 'Anyone interested in a meetup?',
          content: 'Thinking of organizing a meetup next month. Who would be interested?',
          userId: 503,
          username: 'Emma Davis',
          userAvatar: 'https://i.pravatar.cc/150?img=5',
          likesCount: 32,
          commentsCount: 15,
          viewCount: 167,
          isLiked: false,
          isPinned: false,
          postType: PostType.group,
          groupId: widget.groupId,
          groupName: widget.groupName,
          groupAvatar: widget.groupAvatar,
          createdAt: now.subtract(const Duration(days: 1)),
        ),
      ];
    });
  }

  Future<void> _loadGroupReviews() async {
    // TODO: Load reviews specific to this group from backend
    // For now, load all reviews
    await Provider.of<ReviewProvider>(context, listen: false)
        .fetchReviews(refresh: true);
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
                        style: TextStyle(
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
                        Tab(text: 'Discussion'),
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
                _buildDiscussionTab(),
                _buildAboutTab(),
                _buildMembersTab(),
              ],
            ),
          ),
        ),
      ),
      floatingActionButton: _buildFloatingActionButton(),
    );
  }

  Widget? _buildFloatingActionButton() {
    if (!_isMember) return null;

    // Show FAB based on active tab
    if (_tabController.index == 0) {
      // Reviews tab - Add Review
      return FloatingActionButton.extended(
        onPressed: _showAddReviewDialog,
        backgroundColor: AppTheme.primaryPurple,
        icon: Icon(Icons.rate_review, color: Colors.white),
        label: Text('Add Review', style: TextStyle(color: Colors.white)),
      );
    } else if (_tabController.index == 1) {
      // Discussion tab - New Post
      return FloatingActionButton.extended(
        onPressed: _showNewPostDialog,
        backgroundColor: AppTheme.primaryPurple,
        icon: Icon(Icons.add_comment, color: Colors.white),
        label: Text('New Post', style: TextStyle(color: Colors.white)),
      );
    }
    return null;
  }

  void _showAddReviewDialog() {
    // TODO: Navigate to write review screen with group context
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Opening review form for ${widget.groupName}...'),
        action: SnackBarAction(
          label: 'Cancel',
          onPressed: () {},
        ),
      ),
    );
  }

  void _showNewPostDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _buildNewPostSheet(),
    );
  }

  Widget _buildNewPostSheet() {
    final TextEditingController postController = TextEditingController();
    
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            margin: EdgeInsets.symmetric(vertical: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Header
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'New Discussion Post',
                  style: AppTheme.headingMedium,
                ),
                IconButton(
                  icon: Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          
          Divider(),
          
          // Post input
          Expanded(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: TextField(
                controller: postController,
                maxLines: null,
                expands: true,
                textAlignVertical: TextAlignVertical.top,
                decoration: InputDecoration(
                  hintText: 'Share your thoughts with the group...',
                  border: InputBorder.none,
                ),
              ),
            ),
          ),
          
          // Action buttons
          Container(
            padding: EdgeInsets.all(20),
            decoration: BoxDecoration(
              border: Border(top: BorderSide(color: Colors.grey[300]!)),
            ),
            child: Row(
              children: [
                IconButton(
                  icon: Icon(Icons.image, color: AppTheme.primaryPurple),
                  onPressed: () {
                    // TODO: Add image picker
                  },
                ),
                IconButton(
                  icon: Icon(Icons.link, color: AppTheme.primaryPurple),
                  onPressed: () {
                    // TODO: Add link
                  },
                ),
                Spacer(),
                ElevatedButton(
                  onPressed: () {
                    // TODO: Post to group
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Post shared!')),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryPurple,
                    foregroundColor: Colors.white,
                    padding: EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                  ),
                  child: Text('Post'),
                ),
              ],
            ),
          ),
        ],
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
                    style: TextStyle(
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

                  // Stats and Join Button
                  Row(
                    children: [
                      Expanded(
                        child: Row(
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
                      ),
                      if (!_isMember)
                        ElevatedButton.icon(
                          onPressed: _joinGroup,
                          icon: Icon(Icons.add, size: 18),
                          label: Text('Join'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.accentYellow,
                            foregroundColor: AppTheme.accentYellowDark,
                            padding: EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 10,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20),
                            ),
                            elevation: 2,
                          ),
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

  void _joinGroup() {
    setState(() {
      _isMember = true;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Welcome to ${widget.groupName}! 🎉'),
        backgroundColor: AppTheme.primaryPurple,
        action: SnackBarAction(
          label: 'Explore',
          textColor: Colors.white,
          onPressed: () {
            _tabController.animateTo(0); // Go to reviews tab
          },
        ),
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
        // Filter reviews for this group
        final groupReviews = reviewProvider.reviews
            .where((review) => review.groupId == widget.groupId)
            .toList();

        if (reviewProvider.isLoading && groupReviews.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(color: AppTheme.primaryPurple),
                SizedBox(height: 16),
                Text('Loading group reviews...', style: AppTheme.bodyMedium),
              ],
            ),
          );
        }

        if (reviewProvider.error != null && groupReviews.isEmpty) {
          return _buildErrorState(reviewProvider.error!);
        }

        if (groupReviews.isEmpty) {
          return _buildEmptyState();
        }

        return RefreshIndicator(
          onRefresh: _loadGroupReviews,
          color: AppTheme.primaryPurple,
          child: Column(
            children: [
              // Filter/Sort Bar
              Container(
                padding: EdgeInsets.symmetric(
                  horizontal: AppTheme.spaceL,
                  vertical: AppTheme.spaceM,
                ),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border(
                    bottom: BorderSide(
                      color: AppTheme.border,
                      width: 1,
                    ),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.reviews_rounded,
                      size: 18,
                      color: AppTheme.textSecondary,
                    ),
                    SizedBox(width: 8),
                    Text(
                      '${groupReviews.length} ${groupReviews.length == 1 ? 'Review' : 'Reviews'}',
                      style: AppTheme.labelMedium.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    Spacer(),
                    TextButton.icon(
                      onPressed: () {
                        // TODO: Show filter/sort bottom sheet
                      },
                      icon: Icon(Icons.tune, size: 18),
                      label: Text('Filter'),
                      style: TextButton.styleFrom(
                        foregroundColor: AppTheme.primaryPurple,
                      ),
                    ),
                  ],
                ),
              ),
              
              // Reviews List
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(AppTheme.spaceL),
                  itemCount: groupReviews.length +
                      (reviewProvider.isLoadingMore ? 1 : 0),
                  itemBuilder: (context, index) {
                    if (index >= groupReviews.length) {
                      return const Center(
                        child: Padding(
                          padding: EdgeInsets.all(16.0),
                          child: CircularProgressIndicator(),
                        ),
                      );
                    }

                    final review = groupReviews[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: AppTheme.spaceL),
                      child: BeautifulReviewCard(review: review),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDiscussionTab() {
    return Consumer<CommunityProvider>(
      builder: (context, communityProvider, child) {
        // Filter posts for this group
        final groupPosts = communityProvider.posts
            .where((post) =>
                post.postType == PostType.group &&
                post.groupId == widget.groupId)
            .toList();

        if (communityProvider.isLoading && groupPosts.isEmpty) {
          return Center(
            child: CircularProgressIndicator(
              color: AppTheme.primaryPurple,
            ),
          );
        }

        if (groupPosts.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.forum_outlined,
                  size: 64,
                  color: AppTheme.textTertiary.withOpacity(0.5),
                ),
                const SizedBox(height: 16),
                Text(
                  'No discussions yet',
                  style: AppTheme.bodyLarge.copyWith(
                    color: AppTheme.textSecondary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Start a discussion with the group',
                  style: AppTheme.bodyMedium.copyWith(
                    color: AppTheme.textTertiary,
                  ),
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(8),
          itemCount: groupPosts.length,
          itemBuilder: (context, index) {
            final post = groupPosts[index];
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
                    final allReviews = MockData.getMockReviews(0);
                    final review = allReviews.firstWhere(
                      (r) => r.reviewId == reviewId,
                      orElse: () => allReviews.first,
                    );
                    ReviewDetailModal.show(context, review);
                  }
                }
              },
            );
          },
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
    // Mock members data
    final members = [
      {
        'name': 'Sarah Johnson',
        'avatar': 'https://i.pravatar.cc/150?img=1',
        'role': 'Admin',
        'joinedDate': 'Founder',
        'reviewsCount': 45,
        'isAdmin': true,
      },
      {
        'name': 'Mike Chen',
        'avatar': 'https://i.pravatar.cc/150?img=3',
        'role': 'Moderator',
        'joinedDate': 'Joined 6 months ago',
        'reviewsCount': 32,
        'isAdmin': false,
      },
      {
        'name': 'Emma Davis',
        'avatar': 'https://i.pravatar.cc/150?img=5',
        'role': 'Member',
        'joinedDate': 'Joined 3 months ago',
        'reviewsCount': 18,
        'isAdmin': false,
      },
      {
        'name': 'John Smith',
        'avatar': 'https://i.pravatar.cc/150?img=8',
        'role': 'Member',
        'joinedDate': 'Joined 1 month ago',
        'reviewsCount': 7,
        'isAdmin': false,
      },
      {
        'name': 'Lisa Wong',
        'avatar': 'https://i.pravatar.cc/150?img=9',
        'role': 'Member',
        'joinedDate': 'Joined 2 weeks ago',
        'reviewsCount': 3,
        'isAdmin': false,
      },
    ];

    return Column(
      children: [
        // Header with actions
        if (_isMember)
          Container(
            padding: EdgeInsets.all(AppTheme.spaceL),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(
                bottom: BorderSide(color: AppTheme.border),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _showInviteDialog,
                    icon: Icon(Icons.person_add_outlined),
                    label: Text('Invite Members'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.primaryPurple,
                      side: BorderSide(color: AppTheme.primaryPurple),
                      padding: EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                SizedBox(width: 12),
                OutlinedButton.icon(
                  onPressed: () {
                    _showLeaveGroupDialog();
                  },
                  icon: Icon(Icons.logout, size: 18),
                  label: Text('Leave'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.red,
                    side: BorderSide(color: Colors.red.shade200),
                    padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ],
            ),
          ),

        // Members list
        Expanded(
          child: ListView.builder(
            padding: EdgeInsets.all(AppTheme.spaceL),
            itemCount: members.length,
            itemBuilder: (context, index) {
              final member = members[index];
              return Card(
                margin: EdgeInsets.only(bottom: AppTheme.spaceM),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: AppTheme.border),
                ),
                child: ListTile(
                  contentPadding: EdgeInsets.all(12),
                  leading: Stack(
                    children: [
                      CircleAvatar(
                        radius: 28,
                        backgroundImage: NetworkImage(member['avatar'] as String),
                      ),
                      if (member['isAdmin'] as bool)
                        Positioned(
                          right: 0,
                          bottom: 0,
                          child: Container(
                            padding: EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: AppTheme.accentYellow,
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2),
                            ),
                            child: Icon(
                              Icons.verified,
                              size: 12,
                              color: AppTheme.accentYellowDark,
                            ),
                          ),
                        ),
                    ],
                  ),
                  title: Row(
                    children: [
                      Text(
                        member['name'] as String,
                        style: AppTheme.labelLarge,
                      ),
                      SizedBox(width: 8),
                      Container(
                        padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: (member['role'] == 'Admin')
                              ? AppTheme.accentYellow.withOpacity(0.2)
                              : (member['role'] == 'Moderator')
                                  ? AppTheme.primaryPurple.withOpacity(0.1)
                                  : Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          member['role'] as String,
                          style: AppTheme.labelSmall.copyWith(
                            color: (member['role'] == 'Admin')
                                ? AppTheme.accentYellowDark
                                : (member['role'] == 'Moderator')
                                    ? AppTheme.primaryPurple
                                    : AppTheme.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(height: 4),
                      Text(
                        member['joinedDate'] as String,
                        style: AppTheme.labelSmall.copyWith(
                          color: AppTheme.textSecondary,
                        ),
                      ),
                      SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            Icons.rate_review,
                            size: 14,
                            color: AppTheme.textSecondary,
                          ),
                          SizedBox(width: 4),
                          Text(
                            '${member['reviewsCount']} reviews',
                            style: AppTheme.labelSmall.copyWith(
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  trailing: _isAdmin && !(member['isAdmin'] as bool)
                      ? PopupMenuButton(
                          icon: Icon(Icons.more_vert, size: 20),
                          itemBuilder: (context) => [
                            PopupMenuItem(
                              child: Row(
                                children: [
                                  Icon(Icons.admin_panel_settings, size: 18),
                                  SizedBox(width: 12),
                                  Text('Make Moderator'),
                                ],
                              ),
                              onTap: () {
                                // TODO: Make moderator
                              },
                            ),
                            PopupMenuItem(
                              child: Row(
                                children: [
                                  Icon(Icons.remove_circle_outline, size: 18, color: Colors.red),
                                  SizedBox(width: 12),
                                  Text('Remove Member', style: TextStyle(color: Colors.red)),
                                ],
                              ),
                              onTap: () {
                                // TODO: Remove member
                              },
                            ),
                          ],
                        )
                      : null,
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  void _showInviteDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.6,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: Column(
          children: [
            // Handle bar
            Container(
              margin: EdgeInsets.symmetric(vertical: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            
            // Header
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Invite to Group',
                    style: AppTheme.headingMedium,
                  ),
                  IconButton(
                    icon: Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            
            Divider(),
            
            Padding(
              padding: EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Share link section
                  Text(
                    'Share Group Link',
                    style: AppTheme.labelLarge,
                  ),
                  SizedBox(height: 12),
                  Container(
                    padding: EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            'reviewinn.com/groups/${widget.groupId}',
                            style: AppTheme.bodyMedium.copyWith(
                              color: AppTheme.primaryPurple,
                            ),
                          ),
                        ),
                        IconButton(
                          icon: Icon(Icons.copy, color: AppTheme.primaryPurple),
                          onPressed: () {
                            // TODO: Copy to clipboard
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Link copied!')),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                  
                  SizedBox(height: 24),
                  
                  // Share via section
                  Text(
                    'Share Via',
                    style: AppTheme.labelLarge,
                  ),
                  SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _buildShareOption(Icons.message, 'Message'),
                      _buildShareOption(Icons.email, 'Email'),
                      _buildShareOption(Icons.share, 'More'),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShareOption(IconData icon, String label) {
    return InkWell(
      onTap: () {
        // TODO: Implement sharing
      },
      child: Column(
        children: [
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.primaryPurple.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AppTheme.primaryPurple),
          ),
          SizedBox(height: 8),
          Text(label, style: AppTheme.labelSmall),
        ],
      ),
    );
  }

  void _showLeaveGroupDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Leave Group?'),
        content: Text(
          'Are you sure you want to leave ${widget.groupName}? You can always rejoin later.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context); // Go back to groups list
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Left ${widget.groupName}')),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: Text('Leave'),
          ),
        ],
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
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: AppTheme.primaryPurple.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                _isMember ? Icons.rate_review_outlined : Icons.lock_outline,
                size: 60,
                color: AppTheme.primaryPurple.withOpacity(0.5),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              _isMember ? 'No Reviews Yet' : 'Join to View Reviews',
              style: AppTheme.headingMedium,
            ),
            const SizedBox(height: 12),
            Text(
              _isMember
                  ? 'Be the first to share a review in this group!'
                  : 'Join ${widget.groupName} to see and share reviews with the community.',
              style: AppTheme.bodyMedium.copyWith(
                color: AppTheme.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            if (_isMember)
              ElevatedButton.icon(
                onPressed: _showAddReviewDialog,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryPurple,
                  foregroundColor: Colors.white,
                  padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                icon: Icon(Icons.add),
                label: Text('Write First Review'),
              )
            else
              ElevatedButton.icon(
                onPressed: _joinGroup,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryPurple,
                  foregroundColor: Colors.white,
                  padding: EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                icon: Icon(Icons.group_add),
                label: Text('Join Group'),
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
            Text(
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
              child: Text('Try Again'),
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
