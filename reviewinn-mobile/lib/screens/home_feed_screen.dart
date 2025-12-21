import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/review_provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/beautiful_review_card.dart';
import '../config/app_theme.dart';
import 'search_screen.dart';
import 'notifications_screen.dart';
import 'write_review_screen.dart';
import 'login_screen.dart';
import 'bookmarks_screen.dart';

class HomeFeedScreen extends StatefulWidget {
  const HomeFeedScreen({super.key});

  @override
  State<HomeFeedScreen> createState() => _HomeFeedScreenState();
}

class _HomeFeedScreenState extends State<HomeFeedScreen> with SingleTickerProviderStateMixin {
  final ScrollController _scrollController = ScrollController();
  bool _isCollapsed = false;
  late AnimationController _notificationAnimationController;
  late Animation<double> _notificationPulseAnimation;
  int _unreadNotifications = 3; // TODO: Get from API/Provider

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    
    // Setup notification icon animation
    _notificationAnimationController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    
    _notificationPulseAnimation = Tween<double>(begin: 1.0, end: 1.15).animate(
      CurvedAnimation(
        parent: _notificationAnimationController,
        curve: Curves.easeInOut,
      ),
    );
    
    // Pulse animation if there are unread notifications
    if (_unreadNotifications > 0) {
      _notificationAnimationController.repeat(reverse: true);
    }
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<ReviewProvider>(context, listen: false).fetchReviews(refresh: true);
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

      // Check if we're near the bottom and load more reviews
      final maxScroll = _scrollController.position.maxScrollExtent;
      final currentScroll = _scrollController.position.pixels;
      final delta = 200.0; // Load more when 200 pixels from bottom

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
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    _notificationAnimationController.dispose();
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
          child: CustomScrollView(
            controller: _scrollController,
            slivers: [
              // App Bar with animated collapsing (Facebook-style)
              SliverAppBar(
                pinned: true,
                floating: false,
                backgroundColor: Colors.white,
                elevation: _isCollapsed ? 1 : 0,
                toolbarHeight: _isCollapsed ? 56 : 120,
                flexibleSpace: AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeInOut,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryPurple,
                    boxShadow: _isCollapsed
                        ? [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.08),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ]
                        : [],
                  ),
                  child: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          // Logo and title (fade and slide animation)
                          AnimatedOpacity(
                            opacity: _isCollapsed ? 0.0 : 1.0,
                            duration: const Duration(milliseconds: 250),
                            child: AnimatedSlide(
                              offset: _isCollapsed ? const Offset(0, -0.5) : Offset.zero,
                              duration: const Duration(milliseconds: 300),
                              curve: Curves.easeInOut,
                              child: !_isCollapsed
                                  ? Column(
                                      children: [
                                        const SizedBox(height: 12),
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.all(6),
                                              decoration: BoxDecoration(
                                                color: Colors.white.withOpacity(0.2),
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                              child: Icon(
                                                Icons.rate_review_rounded,
                                                color: Colors.white,
                                                size: 20,
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            Text(
                                              'ReviewInn',
                                              style: TextStyle(
                                                fontWeight: FontWeight.bold,
                                                color: Colors.white,
                                                fontSize: 22,
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 16),
                                      ],
                                    )
                                  : const SizedBox.shrink(),
                            ),
                          ),
                          // Search bar (Facebook-style)
                          Row(
                            children: [
                              // Animated review icon that slides in smoothly
                              AnimatedSize(
                                duration: const Duration(milliseconds: 300),
                                curve: Curves.easeInOut,
                                child: AnimatedOpacity(
                                  opacity: _isCollapsed ? 1.0 : 0.0,
                                  duration: const Duration(milliseconds: 250),
                                  child: _isCollapsed
                                      ? Padding(
                                          padding: const EdgeInsets.only(right: 12),
                                          child: TweenAnimationBuilder<double>(
                                            tween: Tween(begin: 0.0, end: 1.0),
                                            duration: const Duration(milliseconds: 350),
                                            curve: Curves.elasticOut,
                                            builder: (context, value, child) {
                                              return Transform.scale(
                                                scale: value,
                                                child: Icon(
                                                  Icons.rate_review_rounded,
                                                  color: Colors.white,
                                                  size: 24,
                                                ),
                                              );
                                            },
                                          ),
                                        )
                                      : const SizedBox.shrink(),
                                ),
                              ),
                              Expanded(
                                child: GestureDetector(
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => const SearchScreen(),
                                      ),
                                    );
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 14,
                                      vertical: 10,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(20),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withOpacity(0.08),
                                          blurRadius: 4,
                                          offset: const Offset(0, 1),
                                        ),
                                      ],
                                    ),
                                    child: Row(
                                      children: [
                                        Icon(
                                          Icons.search,
                                          color: AppTheme.textTertiary,
                                          size: 20,
                                        ),
                                        const SizedBox(width: 10),
                                        Text(
                                          'Search ReviewInn',
                                          style: AppTheme.bodyMedium.copyWith(
                                            color: AppTheme.textTertiary,
                                            fontSize: 15,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              _buildBookmarkButton(),
                              const SizedBox(width: 8),
                              _buildNotificationButton(),
                            ],
                          ),
                          // Add smooth spacing animation
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                            height: _isCollapsed ? 0 : 12,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),

              // Reviews Feed
              SliverToBoxAdapter(
                child: _buildReviewsFeed(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildReviewsFeed() {
    return Consumer2<ReviewProvider, AuthProvider>(
      builder: (context, reviewProvider, authProvider, child) {
        final userAvatar = authProvider.user?.avatar ??
            'https://ui-avatars.com/api/?name=Guest&background=7C3AED&color=ffffff';

        if (reviewProvider.isLoading) {
          return Container(
            height: 400,
            alignment: Alignment.center,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    gradient: AppTheme.purpleGradient,
                    shape: BoxShape.circle,
                  ),
                  child: const CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Loading amazing reviews...',
                  style: AppTheme.bodyMedium,
                ),
              ],
            ),
          );
        }

        if (reviewProvider.reviews.isEmpty) {
          return Container(
            height: 400,
            alignment: Alignment.center,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    gradient: AppTheme.purpleLightGradient,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.rate_review_rounded,
                    size: 80,
                    color: AppTheme.primaryPurple.withOpacity(0.5),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'No reviews yet',
                  style: TextStyle(fontSize: 18, color: Colors.grey[600]),
                ),
                const SizedBox(height: 8),
                Text(
                  'Be the first to share a review!',
                  style: TextStyle(color: Colors.grey),
                ),
              ],
            ),
          );
        }

        return Column(
          children: [
            const SizedBox(height: AppTheme.spaceM),

            // Write Review Status Bar (Facebook-style)
            Container(
              margin: const EdgeInsets.symmetric(
                horizontal: AppTheme.spaceL,
                vertical: AppTheme.spaceM,
              ),
              padding: const EdgeInsets.all(AppTheme.spaceL),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundImage: NetworkImage(userAvatar),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                        // Check if user is authenticated
                        if (!authProvider.isAuthenticated) {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const LoginScreen(),
                            ),
                          );
                          return;
                        }
                        
                        // Navigate to write review screen
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const WriteReviewScreen(),
                          ),
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.backgroundLight,
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: Text(
                          'What\'s on your mind?',
                          style: AppTheme.bodyMedium.copyWith(
                            color: AppTheme.textTertiary,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Review Cards
            ...reviewProvider.reviews.map((review) => BeautifulReviewCard(review: review)),

            // Loading more indicator
            if (reviewProvider.isLoadingMore)
              Container(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        gradient: AppTheme.purpleGradient,
                        shape: BoxShape.circle,
                      ),
                      child: const CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        strokeWidth: 3,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Loading more reviews...',
                      style: AppTheme.bodyMedium.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),

            // End of reviews message
            if (!reviewProvider.hasMoreReviews && reviewProvider.reviews.isNotEmpty)
              Container(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    Icon(
                      Icons.check_circle_rounded,
                      size: 48,
                      color: AppTheme.primaryPurple.withOpacity(0.6),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'You\'ve reached the end!',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'No more reviews to show',
                      style: TextStyle(
                        fontSize: 14,
                        color: AppTheme.textTertiary,
                      ),
                    ),
                  ],
                ),
              ),

            const SizedBox(height: 100), // Bottom padding for FAB
          ],
        );
      },
    );
  }
  Widget _buildBookmarkButton() {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => const BookmarksScreen(),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.15),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(
          Icons.bookmark_border_rounded,
          color: Colors.white,
          size: 24,
        ),
      ),
    );
  }
  Widget _buildNotificationButton() {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => const NotificationsScreen(),
          ),
        );
      },
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // Notification icon with subtle animation
          ScaleTransition(
            scale: _unreadNotifications > 0
                ? _notificationPulseAnimation
                : const AlwaysStoppedAnimation(1.0),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                Icons.notifications_none_rounded,
                color: Colors.white,
                size: 24,
              ),
            ),
          ),
          
          // Badge for unread count
          if (_unreadNotifications > 0)
            Positioned(
              right: -4,
              top: -4,
              child: Container(
                padding: const EdgeInsets.all(4),
                constraints: const BoxConstraints(
                  minWidth: 18,
                  minHeight: 18,
                ),
                decoration: BoxDecoration(
                  color: AppTheme.errorRed,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: AppTheme.primaryPurple,
                    width: 2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.errorRed.withOpacity(0.5),
                      blurRadius: 4,
                      spreadRadius: 1,
                    ),
                  ],
                ),
                child: Text(
                  _unreadNotifications > 99 ? '99+' : _unreadNotifications.toString(),
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
