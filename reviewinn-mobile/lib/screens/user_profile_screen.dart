import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../models/review_model.dart';
import '../models/entity_model.dart';
import '../models/badge_model.dart';
import '../models/community_post_model.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../widgets/beautiful_review_card.dart';
import '../widgets/entity_card.dart';
import '../widgets/badge_widget.dart';
import '../widgets/post_detail_modal.dart';
import 'badges_screen.dart';
import 'settings_screen.dart';
import 'review_stats_screen.dart';

class UserProfileScreen extends StatefulWidget {
  final int? userId; // If null, show current user's profile

  const UserProfileScreen({
    super.key,
    this.userId,
  });

  @override
  State<UserProfileScreen> createState() => _UserProfileScreenState();
}

class _UserProfileScreenState extends State<UserProfileScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isCurrentUser = true;
  bool _isFollowing = false;
  
  // Mock user data
  final _userData = {
    'name': 'John Doe',
    'username': '@johndoe',
    'avatar': 'https://i.pravatar.cc/300?img=7',
    'bio': 'Tech enthusiast | Coffee lover ☕ | Sharing honest reviews to help you make better decisions',
    'reviewsCount': 42,
    'entitiesCount': 3,
    'followersCount': 1234,
    'followingCount': 567,
    'likesReceived': 3456,
    'joinedDate': 'Joined March 2024',
    'badges': ['Top Reviewer', 'Early Adopter', 'Verified'],
  };

  // Mock reviews
  List<Review> _userReviews = [];
  List<Review> _savedReviews = [];
  List<Entity> _userEntities = [];
  List<Entity> _savedEntities = [];
  List<CommunityPost> _userPosts = [];
  List<CommunityPost> _savedPosts = [];
  List<BadgeModel> _userBadges = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _isCurrentUser = widget.userId == null;
    _loadMockData();
    _loadMockBadges();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _loadMockData() {
    final now = DateTime.now();
    _userReviews = [
      Review(
        reviewId: 1,
        title: 'Amazing Product Quality',
        content: 'This product exceeded all my expectations. The build quality is exceptional and it performs exactly as advertised.',
        rating: 4.5,
        username: 'John Doe',
        userAvatar: 'https://i.pravatar.cc/150?img=7',
        entityName: 'iPhone 15 Pro',
        entityAvatar: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400',
        likesCount: 45,
        commentsCount: 12,
        viewCount: 234,
        createdAt: now.subtract(const Duration(days: 5)),
        pros: ['Excellent camera', 'Long battery life', 'Premium design'],
        cons: ['Expensive', 'No charger included'],
      ),
      Review(
        reviewId: 2,
        title: 'Great Coffee Shop Experience',
        content: 'Love the ambiance and the quality of coffee. Staff is friendly and the place is always clean.',
        rating: 4.0,
        username: 'John Doe',
        userAvatar: 'https://i.pravatar.cc/150?img=7',
        entityName: 'Starbucks Downtown',
        likesCount: 28,
        commentsCount: 8,
        viewCount: 156,
        createdAt: now.subtract(const Duration(days: 12)),
      ),
    ];

    _savedReviews = [
      Review(
        reviewId: 3,
        title: 'Must-Visit Restaurant',
        content: 'The food here is absolutely delicious. Highly recommend trying their signature dishes.',
        rating: 5.0,
        username: 'Sarah Johnson',
        userAvatar: 'https://i.pravatar.cc/150?img=1',
        entityName: 'Bella Italia',
        likesCount: 89,
        commentsCount: 23,
        viewCount: 567,
        createdAt: now.subtract(const Duration(days: 3)),
      ),
    ];

    _userEntities = [
      Entity(
        entityId: 101,
        name: 'Tesla Cybertruck',
        description: 'Revolutionary electric pickup truck with futuristic design',
        avatar: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400',
        categoryName: 'Vehicles',
        averageRating: 4.3,
        reviewCount: 24,
        createdAt: now.subtract(const Duration(days: 8)),
      ),
      Entity(
        entityId: 102,
        name: 'The Rustic Kitchen',
        description: 'Farm-to-table restaurant with locally sourced ingredients',
        avatar: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
        categoryName: 'Restaurants',
        averageRating: 4.7,
        reviewCount: 156,
        createdAt: now.subtract(const Duration(days: 15)),
      ),
      Entity(
        entityId: 103,
        name: 'Code Academy Pro',
        description: 'Premium online coding bootcamp for aspiring developers',
        avatar: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400',
        categoryName: 'Education',
        averageRating: 4.5,
        reviewCount: 89,
        createdAt: now.subtract(const Duration(days: 30)),
      ),
    ];

    _userPosts = [
      CommunityPost(
        postId: 201,
        title: 'Best laptops for programming in 2025?',
        content: 'I\'m looking for a reliable laptop for full-stack development. What are your recommendations?',
        userId: 1,
        username: 'John Doe',
        userAvatar: 'https://i.pravatar.cc/150?img=7',
        tags: ['tech', 'laptops', 'programming'],
        likesCount: 34,
        commentsCount: 18,
        viewCount: 256,
        isLiked: false,
        isPinned: false,
        postType: PostType.general,
        createdAt: now.subtract(const Duration(days: 4)),
      ),
      CommunityPost(
        postId: 202,
        title: 'Anyone know good Italian restaurants nearby?',
        content: 'Visiting the downtown area this weekend. Looking for authentic Italian food recommendations!',
        userId: 1,
        username: 'John Doe',
        userAvatar: 'https://i.pravatar.cc/150?img=7',
        tags: ['food', 'italian', 'recommendations'],
        likesCount: 21,
        commentsCount: 12,
        viewCount: 145,
        isLiked: false,
        isPinned: false,
        postType: PostType.general,
        createdAt: now.subtract(const Duration(days: 9)),
      ),
    ];

    _savedPosts = [
      CommunityPost(
        postId: 203,
        title: 'Coffee shop with best WiFi for remote work?',
        content: 'Need a good place to work from. Strong WiFi is a must. Any suggestions?',
        userId: 2,
        username: 'Alice Smith',
        userAvatar: 'https://i.pravatar.cc/150?img=2',
        tags: ['coffee', 'remote-work', 'wifi'],
        likesCount: 42,
        commentsCount: 27,
        viewCount: 312,
        isLiked: true,
        isPinned: false,
        postType: PostType.general,
        createdAt: now.subtract(const Duration(days: 2)),
      ),
    ];

    _savedEntities = [
      Entity(
        entityId: 104,
        name: 'Apple AirPods Pro',
        description: 'Premium wireless earbuds with active noise cancellation',
        avatar: 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=400',
        categoryName: 'Electronics',
        averageRating: 4.6,
        reviewCount: 234,
        createdAt: now.subtract(const Duration(days: 5)),
      ),
    ];

    setState(() {});
  }

  void _loadMockBadges() {
    final now = DateTime.now();
    _userBadges = [
      BadgeModel.fromType(
        BadgeType.topReviewer,
        earnedDate: now.subtract(const Duration(days: 45)),
      ),
      BadgeModel.fromType(
        BadgeType.verified,
        earnedDate: now.subtract(const Duration(days: 120)),
      ),
      BadgeModel.fromType(
        BadgeType.helpfulContributor,
        earnedDate: now.subtract(const Duration(days: 30)),
      ),
      BadgeModel.fromType(
        BadgeType.photoExpert,
        earnedDate: now.subtract(const Duration(days: 60)),
      ),
      BadgeModel.fromType(
        BadgeType.earlyAdopter,
        earnedDate: now.subtract(const Duration(days: 180)),
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, _) {
        final isDark = themeProvider.isDarkMode;
        final backgroundColor = isDark ? const Color(0xFF1F2937) : AppTheme.backgroundLight;
        final cardColor = isDark ? const Color(0xFF374151) : Colors.white;

        return Scaffold(
          backgroundColor: backgroundColor,
          body: NestedScrollView(
            headerSliverBuilder: (BuildContext context, bool innerBoxIsScrolled) {
              return [
                // App Bar
                _buildSliverAppBar(),

                // Profile Info
                SliverToBoxAdapter(
                  child: _buildProfileInfo(cardColor),
                ),

                // Tabs
                SliverPersistentHeader(
                  pinned: true,
                  delegate: _SliverTabBarDelegate(
                    TabBar(
                      controller: _tabController,
                      indicatorColor: AppTheme.primaryPurple,
                      labelColor: AppTheme.primaryPurple,
                      unselectedLabelColor: isDark ? Colors.grey[400] : AppTheme.textSecondary,
                      labelStyle: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                      tabs: const [
                        Tab(text: 'Reviews'),
                        Tab(text: 'Entities'),
                        Tab(text: 'Posts'),
                        Tab(text: 'Saved'),
                        Tab(text: 'About'),
                      ],
                    ),
                    cardColor,
                  ),
                ),
              ];
            },
            body: TabBarView(
              controller: _tabController,
              children: [
                _buildReviewsTab(),
                _buildEntitiesTab(),
                _buildPostsTab(),
                _buildSavedTab(cardColor),
                _buildAboutTab(cardColor),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSliverAppBar() {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, _) {
        final isDark = themeProvider.isDarkMode;
        final backgroundColor = isDark ? const Color(0xFF374151) : AppTheme.primaryPurple;
        final textColor = Colors.white;

        return SliverAppBar(
          expandedHeight: 120,
          floating: false,
          pinned: true,
          backgroundColor: backgroundColor,
          // Only show back button when viewing another user's profile
          automaticallyImplyLeading: !_isCurrentUser,
          leading: !_isCurrentUser
              ? IconButton(
                  icon: Icon(Icons.arrow_back, color: textColor),
                  onPressed: () => Navigator.pop(context),
                )
              : null,
          actions: [
            // Dark Mode Toggle
            IconButton(
              icon: Icon(
                themeProvider.isDarkMode
                  ? Icons.light_mode_rounded
                  : Icons.dark_mode_rounded,
                color: textColor,
              ),
              onPressed: () {
                themeProvider.toggleTheme();
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      themeProvider.isDarkMode
                        ? 'Dark mode enabled'
                        : 'Light mode enabled'
                    ),
                    duration: const Duration(seconds: 1),
                    backgroundColor: AppTheme.successGreen,
                  ),
                );
              },
            ),
            if (_isCurrentUser)
              IconButton(
                icon: Icon(Icons.settings_rounded, color: textColor),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => SettingsScreen()),
                  );
                },
              ),
          ],
          flexibleSpace: FlexibleSpaceBar(
            title: Text(
              _userData['name'] as String,
              style: TextStyle(
                color: textColor,
                fontWeight: FontWeight.bold,
                fontSize: 20,
              ),
            ),
            centerTitle: false,
          ),
        );
      },
    );
  }

  Widget _buildProfileInfo(Color cardColor) {
    return Container(
      color: cardColor,
      padding: const EdgeInsets.all(AppTheme.spaceL),
      child: Column(
        children: [
          // Avatar and Action Button
          Row(
            children: [
              // Avatar
              Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppTheme.primaryPurple,
                    width: 3,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primaryPurple.withOpacity(0.3),
                      blurRadius: 12,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: CircleAvatar(
                  radius: 50,
                  backgroundColor: AppTheme.borderLight,
                  backgroundImage: CachedNetworkImageProvider(_userData['avatar'] as String),
                ),
              ),
              const SizedBox(width: AppTheme.spaceL),
              
              // Stats
              Expanded(
                child: GestureDetector(
                  onTap: _isCurrentUser ? () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => ReviewStatsScreen()),
                    );
                  } : null,
                  child: Container(
                    padding: EdgeInsets.all(8),
                    decoration: _isCurrentUser ? BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.primaryPurple.withOpacity(0.2)),
                    ) : null,
                    child: Column(
                      children: [
                        if (_isCurrentUser)
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.bar_chart, size: 14, color: AppTheme.primaryPurple),
                              SizedBox(width: 4),
                              Text(
                                'View Stats',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: AppTheme.primaryPurple,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        if (_isCurrentUser) SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildStatItem(
                              _userData['reviewsCount'].toString(),
                              'Reviews',
                            ),
                            _buildStatItem(
                              _userData['entitiesCount'].toString(),
                              'Entities',
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildStatItem(
                              _formatCount(_userData['followersCount'] as int),
                              'Followers',
                            ),
                            _buildStatItem(
                              _formatCount(_userData['followingCount'] as int),
                              'Following',
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: AppTheme.spaceL),
          
          // Bio
          if (_userData['bio'] != null) ...[
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                _userData['bio'] as String,
                style: AppTheme.bodyMedium.copyWith(
                  height: 1.5,
                ),
              ),
            ),
            const SizedBox(height: AppTheme.spaceM),
          ],
          
          // Badges
          if (_userBadges.isNotEmpty) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Badges (${_userBadges.length})',
                  style: AppTheme.headingSmall.copyWith(
                    fontSize: 16,
                  ),
                ),
                TextButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const BadgesScreen(),
                      ),
                    );
                  },
                  icon: Icon(
                    Icons.arrow_forward_rounded,
                    size: 16,
                  ),
                  label: Text('View All'),
                  style: TextButton.styleFrom(
                    foregroundColor: AppTheme.primaryPurple,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spaceS),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _userBadges.take(4).map((badge) {
                return BadgeWidget(
                  badge: badge,
                  isCompact: true,
                );
              }).toList(),
            ),
            const SizedBox(height: AppTheme.spaceM),
          ],
          
          // Action Buttons
          Row(
            children: [
              if (_isCurrentUser) ...[
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      // Navigate to edit profile
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Edit profile coming soon!'),
                          duration: Duration(seconds: 1),
                        ),
                      );
                    },
                    icon: Icon(Icons.edit_rounded),
                    label: Text('Edit Profile'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryPurple,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ] else ...[
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      setState(() => _isFollowing = !_isFollowing);
                    },
                    icon: Icon(_isFollowing ? Icons.check_rounded : Icons.person_add_rounded),
                    label: Text(_isFollowing ? 'Following' : 'Follow'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _isFollowing 
                          ? AppTheme.backgroundLight 
                          : AppTheme.primaryPurple,
                      foregroundColor: _isFollowing 
                          ? AppTheme.primaryPurple 
                          : Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(
                          color: AppTheme.primaryPurple,
                          width: 2,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton.icon(
                  onPressed: () {
                    // Navigate to messaging
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Messaging coming soon!'),
                        duration: Duration(seconds: 1),
                      ),
                    );
                  },
                  icon: Icon(Icons.message_rounded),
                  label: Text('Message'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.backgroundLight,
                    foregroundColor: AppTheme.primaryPurple,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 12,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(
                        color: AppTheme.primaryPurple,
                        width: 2,
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String value, String label) {
    return Column(
      children: [
        Text(
          value,
          style: AppTheme.headingSmall.copyWith(
            fontSize: 20,
            color: AppTheme.primaryPurple,
          ),
        ),
        Text(
          label,
          style: AppTheme.bodySmall.copyWith(
            color: AppTheme.textSecondary,
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
    if (_userReviews.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.rate_review_outlined,
              size: 64,
              color: AppTheme.textTertiary.withOpacity(0.5),
            ),
            const SizedBox(height: 16),
            Text(
              'No reviews yet',
              style: AppTheme.bodyLarge.copyWith(
                color: AppTheme.textSecondary,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(AppTheme.spaceM),
      itemCount: _userReviews.length,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.only(bottom: AppTheme.spaceM),
          child: BeautifulReviewCard(review: _userReviews[index]),
        );
      },
    );
  }

  Widget _buildEntitiesTab() {
    if (_userEntities.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.business_outlined,
              size: 64,
              color: AppTheme.textTertiary.withOpacity(0.5),
            ),
            const SizedBox(height: 16),
            Text(
              'No entities added',
              style: AppTheme.bodyLarge.copyWith(
                color: AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Add entities to help others discover them',
              style: AppTheme.bodyMedium.copyWith(
                color: AppTheme.textTertiary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(AppTheme.spaceM),
      itemCount: _userEntities.length,
      itemBuilder: (context, index) {
        final entity = _userEntities[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: AppTheme.spaceM),
          child: EntityCard(
            entity: entity,
            onTap: () {
              // Navigate to entity detail
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Opening ${entity.name}...'),
                  duration: const Duration(seconds: 1),
                ),
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildPostsTab() {
    if (_userPosts.isEmpty) {
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
              'No posts yet',
              style: AppTheme.bodyLarge.copyWith(
                color: AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Start discussions in the community',
              style: AppTheme.bodyMedium.copyWith(
                color: AppTheme.textTertiary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(AppTheme.spaceM),
      itemCount: _userPosts.length,
      itemBuilder: (context, index) {
        final post = _userPosts[index];
        return Container(
          margin: const EdgeInsets.only(bottom: AppTheme.spaceM),
          child: InkWell(
            onTap: () {
              showDialog(
                context: context,
                builder: (context) => PostDetailModal(post: post),
              );
            },
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title
                  Text(
                    post.title,
                    style: AppTheme.headingSmall.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Content preview
                  Text(
                    post.content,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: AppTheme.bodyMedium,
                  ),
                  const SizedBox(height: 12),

                  // Tags
                  if (post.tags != null && post.tags!.isNotEmpty)
                    Wrap(
                      spacing: 8,
                      runSpacing: 4,
                      children: post.tags!.take(3).map((tag) {
                        return Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryPurple.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            '#$tag',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppTheme.primaryPurple,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  const SizedBox(height: 12),
                  Divider(height: 1, color: Colors.grey[200]),
                  const SizedBox(height: 12),

                  // Stats
                  Row(
                    children: [
                      Icon(
                        post.isLiked
                            ? Icons.favorite
                            : Icons.favorite_border,
                        size: 18,
                        color:
                            post.isLiked ? Colors.red : Colors.grey,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${post.likesCount}',
                        style: AppTheme.bodySmall,
                      ),
                      const SizedBox(width: 16),
                      Icon(
                        Icons.comment_outlined,
                        size: 18,
                        color: Colors.grey,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${post.commentsCount}',
                        style: AppTheme.bodySmall,
                      ),
                      const SizedBox(width: 16),
                      Icon(
                        Icons.visibility_outlined,
                        size: 18,
                        color: Colors.grey,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${post.viewCount}',
                        style: AppTheme.bodySmall,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildSavedTab(Color cardColor) {
    return DefaultTabController(
      length: 3,
      child: Column(
        children: [
          Container(
            color: cardColor,
            child: TabBar(
              indicatorColor: AppTheme.primaryPurple,
              labelColor: AppTheme.primaryPurple,
              unselectedLabelColor: AppTheme.textSecondary,
              labelStyle: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
              tabs: const [
                Tab(text: 'Reviews'),
                Tab(text: 'Entities'),
                Tab(text: 'Posts'),
              ],
            ),
          ),
          Expanded(
            child: TabBarView(
              children: [
                _buildSavedReviewsList(),
                _buildSavedEntitiesList(),
                _buildSavedPostsList(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSavedReviewsList() {
    if (_savedReviews.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.bookmark_border_rounded,
              size: 64,
              color: AppTheme.textTertiary.withOpacity(0.5),
            ),
            const SizedBox(height: 16),
            Text(
              'No saved reviews',
              style: AppTheme.bodyLarge.copyWith(
                color: AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Save reviews to view them later',
              style: AppTheme.bodyMedium.copyWith(
                color: AppTheme.textTertiary,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(AppTheme.spaceM),
      itemCount: _savedReviews.length,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.only(bottom: AppTheme.spaceM),
          child: BeautifulReviewCard(review: _savedReviews[index]),
        );
      },
    );
  }

  Widget _buildSavedEntitiesList() {
    if (_savedEntities.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.bookmark_border_rounded,
              size: 64,
              color: AppTheme.textTertiary.withOpacity(0.5),
            ),
            const SizedBox(height: 16),
            Text(
              'No saved entities',
              style: AppTheme.bodyLarge.copyWith(
                color: AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Save entities to view them later',
              style: AppTheme.bodyMedium.copyWith(
                color: AppTheme.textTertiary,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(AppTheme.spaceM),
      itemCount: _savedEntities.length,
      itemBuilder: (context, index) {
        final entity = _savedEntities[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: AppTheme.spaceM),
          child: EntityCard(
            entity: entity,
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Opening ${entity.name}...'),
                  duration: const Duration(seconds: 1),
                ),
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildSavedPostsList() {
    if (_savedPosts.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.bookmark_border_rounded,
              size: 64,
              color: AppTheme.textTertiary.withOpacity(0.5),
            ),
            const SizedBox(height: 16),
            Text(
              'No saved posts',
              style: AppTheme.bodyLarge.copyWith(
                color: AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Save posts to view them later',
              style: AppTheme.bodyMedium.copyWith(
                color: AppTheme.textTertiary,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(AppTheme.spaceM),
      itemCount: _savedPosts.length,
      itemBuilder: (context, index) {
        final post = _savedPosts[index];
        return Container(
          margin: const EdgeInsets.only(bottom: AppTheme.spaceM),
          child: InkWell(
            onTap: () {
              showDialog(
                context: context,
                builder: (context) => PostDetailModal(post: post),
              );
            },
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    post.title,
                    style: AppTheme.headingSmall.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    post.content,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppTheme.bodyMedium,
                  ),
                  const SizedBox(height: 12),
                  Divider(height: 1, color: Colors.grey[200]),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Icon(Icons.favorite_border, size: 16, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text('${post.likesCount}', style: AppTheme.bodySmall),
                      const SizedBox(width: 16),
                      Icon(Icons.comment_outlined, size: 16, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text('${post.commentsCount}', style: AppTheme.bodySmall),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildAboutTab(Color cardColor) {
    return ListView(
      padding: const EdgeInsets.all(AppTheme.spaceL),
      children: [
        _buildAboutSection(
          'Total Impact',
          [
            _buildAboutItem(Icons.visibility_rounded, 'Profile Views', '2.3K'),
            _buildAboutItem(Icons.favorite_rounded, 'Likes Received', _formatCount(_userData['likesReceived'] as int)),
            _buildAboutItem(Icons.star_rounded, 'Avg Rating', '4.6'),
          ],
          cardColor,
        ),
        const SizedBox(height: AppTheme.spaceXL),
        _buildAboutSection(
          'Activity',
          [
            _buildAboutItem(Icons.calendar_today_rounded, 'Member Since', 'March 2024'),
            _buildAboutItem(Icons.update_rounded, 'Last Active', '2 hours ago'),
            _buildAboutItem(Icons.trending_up_rounded, 'Response Rate', '95%'),
          ],
          cardColor,
        ),
      ],
    );
  }

  Widget _buildAboutSection(String title, List<Widget> items, Color cardColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: AppTheme.headingSmall.copyWith(
            fontSize: 18,
          ),
        ),
        const SizedBox(height: AppTheme.spaceM),
        Container(
          decoration: BoxDecoration(
            color: cardColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.borderLight),
          ),
          child: Column(
            children: items.asMap().entries.map((entry) {
              return Column(
                children: [
                  if (entry.key > 0) const Divider(height: 1),
                  entry.value,
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildAboutItem(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.all(AppTheme.spaceM),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.primaryPurpleLight.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              icon,
              size: 20,
              color: AppTheme.primaryPurple,
            ),
          ),
          const SizedBox(width: AppTheme.spaceM),
          Expanded(
            child: Text(
              label,
              style: AppTheme.bodyMedium.copyWith(
                color: AppTheme.textSecondary,
              ),
            ),
          ),
          Text(
            value,
            style: AppTheme.labelMedium.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

class _SliverTabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar _tabBar;
  final Color _backgroundColor;

  _SliverTabBarDelegate(this._tabBar, this._backgroundColor);

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
      color: _backgroundColor,
      child: _tabBar,
    );
  }

  @override
  bool shouldRebuild(_SliverTabBarDelegate oldDelegate) {
    return false;
  }
}
