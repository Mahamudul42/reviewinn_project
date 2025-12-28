import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/app_theme.dart';
import '../../config/app_colors.dart';
import '../../utils/formatters/number_formatter.dart';
import '../../screens/review_stats_screen.dart';
import '../../screens/badges_screen.dart';

/// Profile information card showing avatar, stats, bio, and badges
class ProfileInfoCard extends StatelessWidget {
  final String name;
  final String username;
  final String avatarUrl;
  final String bio;
  final int reviewsCount;
  final int entitiesCount;
  final int followersCount;
  final int followingCount;
  final int likesReceived;
  final String joinedDate;
  final List<String> badges;
  final bool isCurrentUser;
  final bool isFollowing;
  final VoidCallback? onFollowTap;
  final VoidCallback? onMessageTap;

  const ProfileInfoCard({
    super.key,
    required this.name,
    required this.username,
    required this.avatarUrl,
    required this.bio,
    required this.reviewsCount,
    required this.entitiesCount,
    required this.followersCount,
    required this.followingCount,
    required this.likesReceived,
    required this.joinedDate,
    required this.badges,
    required this.isCurrentUser,
    this.isFollowing = false,
    this.onFollowTap,
    this.onMessageTap,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Container(
      color: colors.cardBackground,
      padding: const EdgeInsets.all(AppTheme.spaceL),
      child: Column(
        children: [
          // Avatar and Stats Row
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
                  backgroundImage: CachedNetworkImageProvider(avatarUrl),
                ),
              ),
              const SizedBox(width: AppTheme.spaceL),

              // Stats
              Expanded(
                child: GestureDetector(
                  onTap: isCurrentUser
                      ? () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                                builder: (context) => const ReviewStatsScreen()),
                          );
                        }
                      : null,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: isCurrentUser
                        ? BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                                color: AppTheme.primaryPurple.withOpacity(0.2)),
                          )
                        : null,
                    child: Column(
                      children: [
                        if (isCurrentUser)
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.bar_chart,
                                  size: 14, color: AppTheme.primaryPurple),
                              const SizedBox(width: 4),
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
                        if (isCurrentUser) const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildStatItem(
                                reviewsCount.toString(), 'Reviews', colors),
                            _buildStatItem(
                                entitiesCount.toString(), 'Entities', colors),
                            _buildStatItem(NumberFormatter.compact(likesReceived),
                                'Likes', colors),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildStatItem(
                                NumberFormatter.compact(followersCount),
                                'Followers',
                                colors),
                            _buildStatItem(
                                NumberFormatter.compact(followingCount),
                                'Following',
                                colors),
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

          // Username
          Text(
            username,
            style: AppTheme.bodyMedium.copyWith(
              color: colors.textSecondary,
            ),
          ),

          const SizedBox(height: AppTheme.spaceS),

          // Bio
          Text(
            bio,
            textAlign: TextAlign.center,
            style: AppTheme.bodyMedium.copyWith(
              color: colors.textPrimary,
            ),
          ),

          const SizedBox(height: AppTheme.spaceM),

          // Badges
          GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => BadgesScreen()),
              );
            },
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppTheme.spaceM,
                vertical: AppTheme.spaceS,
              ),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppTheme.primaryPurple.withOpacity(0.1),
                    AppTheme.primaryPurple.withOpacity(0.05),
                  ],
                ),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppTheme.primaryPurple.withOpacity(0.3),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.stars_rounded,
                      size: 18, color: AppTheme.primaryPurple),
                  const SizedBox(width: 8),
                  ...badges.take(3).map((badge) {
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryPurple,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          badge,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    );
                  }),
                  if (badges.length > 3)
                    Text(
                      '+${badges.length - 3}',
                      style: TextStyle(
                        color: AppTheme.primaryPurple,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  const SizedBox(width: 4),
                  Icon(Icons.chevron_right,
                      size: 18, color: AppTheme.primaryPurple),
                ],
              ),
            ),
          ),

          const SizedBox(height: AppTheme.spaceM),

          // Action Buttons
          if (!isCurrentUser) ...[
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: onFollowTap,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isFollowing
                          ? colors.cardBackground
                          : AppTheme.primaryPurple,
                      foregroundColor:
                          isFollowing ? AppTheme.primaryPurple : Colors.white,
                      side: isFollowing
                          ? BorderSide(color: AppTheme.primaryPurple)
                          : null,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(
                      isFollowing ? 'Following' : 'Follow',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onMessageTap,
                    icon: const Icon(Icons.message_rounded),
                    label: const Text('Message'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.primaryPurple,
                      side: BorderSide(color: AppTheme.primaryPurple),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],

          const SizedBox(height: AppTheme.spaceS),

          // Joined date
          Text(
            joinedDate,
            style: AppTheme.bodySmall.copyWith(
              color: colors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String value, String label, AppColors colors) {
    return Column(
      children: [
        Text(
          value,
          style: AppTheme.headingMedium.copyWith(
            color: colors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: AppTheme.bodySmall.copyWith(
            color: colors.textSecondary,
          ),
        ),
      ],
    );
  }
}
