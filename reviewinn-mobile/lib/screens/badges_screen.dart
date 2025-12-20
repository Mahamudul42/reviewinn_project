import 'package:flutter/material.dart';
import '../config/app_theme.dart';
import '../models/badge_model.dart';
import '../widgets/badge_widget.dart';

class BadgesScreen extends StatefulWidget {
  const BadgesScreen({super.key});

  @override
  State<BadgesScreen> createState() => _BadgesScreenState();
}

class _BadgesScreenState extends State<BadgesScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Mock earned badges
  final List<BadgeModel> _earnedBadges = [];
  
  // All available badges
  final List<BadgeModel> _allBadges = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadBadges();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _loadBadges() {
    final now = DateTime.now();
    
    // Earned badges
    _earnedBadges.addAll([
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
    ]);

    // All badges (for locked badges)
    _allBadges.addAll(BadgeType.values.map((type) => BadgeModel.fromType(type)));
  }

  @override
  Widget build(BuildContext context) {
    final lockedBadges = _allBadges.where((badge) {
      return !_earnedBadges.any((earned) => earned.type == badge.type);
    }).toList();

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: Text(
          'Badges',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: AppTheme.primaryPurple,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: [
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Earned'),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${_earnedBadges.length}',
                      style: TextStyle(
                        color: AppTheme.primaryPurple,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Locked'),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white24,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${lockedBadges.length}',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildEarnedBadgesTab(),
          _buildLockedBadgesTab(lockedBadges),
        ],
      ),
    );
  }

  Widget _buildEarnedBadgesTab() {
    if (_earnedBadges.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.emoji_events_outlined,
              size: 80,
              color: AppTheme.textTertiary.withOpacity(0.5),
            ),
            const SizedBox(height: AppTheme.spaceL),
            Text(
              'No badges earned yet',
              style: AppTheme.headingMedium.copyWith(
                color: AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: AppTheme.spaceS),
            Text(
              'Start reviewing to earn badges!',
              style: AppTheme.bodyMedium.copyWith(
                color: AppTheme.textTertiary,
              ),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppTheme.spaceL),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(AppTheme.spaceL),
            decoration: BoxDecoration(
              gradient: AppTheme.purpleGradient,
              borderRadius: AppTheme.radiusMedium,
            ),
            child: Row(
              children: [
                Icon(
                  Icons.star_rounded,
                  color: Colors.white,
                  size: 40,
                ),
                const SizedBox(width: AppTheme.spaceM),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'You\'ve earned ${_earnedBadges.length} badges!',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Keep up the great work!',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.9),
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppTheme.spaceXL),
          // Badges Grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: AppTheme.spaceM,
              mainAxisSpacing: AppTheme.spaceM,
              childAspectRatio: 0.85,
            ),
            itemCount: _earnedBadges.length,
            itemBuilder: (context, index) {
              return BadgeWidget(
                badge: _earnedBadges[index],
                isCompact: false,
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildLockedBadgesTab(List<BadgeModel> lockedBadges) {
    if (lockedBadges.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.workspace_premium_rounded,
              size: 80,
              color: AppTheme.accentYellow,
            ),
            const SizedBox(height: AppTheme.spaceL),
            Text(
              'All badges unlocked!',
              style: AppTheme.headingMedium.copyWith(
                color: AppTheme.primaryPurple,
              ),
            ),
            const SizedBox(height: AppTheme.spaceS),
            Text(
              'Congratulations! You\'ve earned them all!',
              style: AppTheme.bodyMedium.copyWith(
                color: AppTheme.textSecondary,
              ),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppTheme.spaceL),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Info Banner
          Container(
            padding: const EdgeInsets.all(AppTheme.spaceL),
            decoration: BoxDecoration(
              color: AppTheme.backgroundWhite,
              borderRadius: AppTheme.radiusMedium,
              border: Border.all(
                color: AppTheme.borderLight,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.lock_outline_rounded,
                  color: AppTheme.textSecondary,
                  size: 32,
                ),
                const SizedBox(width: AppTheme.spaceM),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${lockedBadges.length} badges to unlock',
                        style: AppTheme.headingSmall.copyWith(
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Complete the requirements to earn them!',
                        style: AppTheme.bodySmall.copyWith(
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppTheme.spaceXL),
          // Locked Badges Grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: AppTheme.spaceM,
              mainAxisSpacing: AppTheme.spaceM,
              childAspectRatio: 0.85,
            ),
            itemCount: lockedBadges.length,
            itemBuilder: (context, index) {
              return _buildLockedBadge(lockedBadges[index]);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildLockedBadge(BadgeModel badge) {
    // Mock progress data - replace with actual user progress
    final progress = _getBadgeProgress(badge.type);
    
    return Opacity(
      opacity: 0.6,
      child: Container(
        padding: const EdgeInsets.all(AppTheme.spaceM),
        decoration: BoxDecoration(
          color: AppTheme.cardBackground,
          borderRadius: AppTheme.radiusMedium,
          border: Border.all(
            color: AppTheme.borderLight,
            width: 2,
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Locked Badge Icon
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: AppTheme.borderLight,
                shape: BoxShape.circle,
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Icon(
                    badge.icon,
                    color: AppTheme.textTertiary,
                    size: 28,
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: AppTheme.textSecondary,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.lock_rounded,
                        color: Colors.white,
                        size: 14,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppTheme.spaceS),
            // Badge Title
            Text(
              badge.title,
              style: AppTheme.headingSmall.copyWith(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: AppTheme.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            // Badge Description
            Text(
              badge.description,
              style: AppTheme.bodySmall.copyWith(
                color: AppTheme.textTertiary,
                fontSize: 11,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: AppTheme.spaceS),
            // Progress Bar
            Column(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: progress['current'] / progress['total'],
                    backgroundColor: AppTheme.borderLight,
                    valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryPurple),
                    minHeight: 6,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${progress['current']}/${progress['total']}',
                  style: TextStyle(
                    fontSize: 10,
                    color: AppTheme.textTertiary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // Mock method to get progress - replace with actual user data
  Map<String, dynamic> _getBadgeProgress(BadgeType type) {
    switch (type) {
      case BadgeType.topReviewer:
        return {'current': 12, 'total': 50};
      case BadgeType.helpfulContributor:
        return {'current': 34, 'total': 100};
      case BadgeType.photoExpert:
        return {'current': 8, 'total': 25};
      case BadgeType.entityCreator:
        return {'current': 2, 'total': 10};
      case BadgeType.consistentReviewer:
        return {'current': 4, 'total': 30};
      case BadgeType.trendsetter:
        return {'current': 1, 'total': 5};
      default:
        return {'current': 0, 'total': 1};
    }
  }
}
