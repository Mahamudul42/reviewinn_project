import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../config/app_theme.dart';
import '../models/circle_models.dart';

/// Reusable User Display Component
/// Similar to frontend UserDisplay component
///
/// Features:
/// - Avatar with fallback
/// - Name and username
/// - Optional badge (trust level, etc.)
/// - Optional subtitle
/// - Optional actions (buttons, menus)
/// - Clickable to navigate to profile
class UserDisplay extends StatelessWidget {
  final CircleUser user;
  final String? subtitle;
  final Widget? badge;
  final Widget? actions;
  final VoidCallback? onTap;
  final double avatarSize;

  const UserDisplay({
    super.key,
    required this.user,
    this.subtitle,
    this.badge,
    this.actions,
    this.onTap,
    this.avatarSize = 48.0,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // Avatar
        GestureDetector(
          onTap: onTap,
          child: Container(
            width: avatarSize,
            height: avatarSize,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: AppTheme.primaryPurple.withOpacity(0.2),
                width: 2,
              ),
            ),
            child: ClipOval(
              child: user.avatar != null && user.avatar!.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: user.avatar!,
                      width: avatarSize,
                      height: avatarSize,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        color: AppTheme.backgroundLight,
                        child: Center(
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppTheme.primaryPurple,
                          ),
                        ),
                      ),
                      errorWidget: (context, url, error) => Container(
                        color: AppTheme.primaryPurple.withOpacity(0.1),
                        child: Icon(
                          Icons.person,
                          size: avatarSize * 0.5,
                          color: AppTheme.primaryPurple,
                        ),
                      ),
                    )
                  : Container(
                      color: AppTheme.primaryPurple.withOpacity(0.1),
                      child: Icon(
                        Icons.person,
                        size: avatarSize * 0.5,
                        color: AppTheme.primaryPurple,
                      ),
                    ),
            ),
          ),
        ),

        const SizedBox(width: 12),

        // User info
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Flexible(
                    child: GestureDetector(
                      onTap: onTap,
                      child: Text(
                        user.name,
                        style: AppTheme.labelMedium.copyWith(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                  if (badge != null) ...[
                    const SizedBox(width: 8),
                    badge!,
                  ],
                ],
              ),
              if (user.username != null || subtitle != null)
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Text(
                    [
                      if (user.username != null) '@${user.username}',
                      if (subtitle != null) subtitle,
                    ].join(' • '),
                    style: AppTheme.bodySmall.copyWith(
                      color: AppTheme.textSecondary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
            ],
          ),
        ),

        // Actions
        if (actions != null) ...[
          const SizedBox(width: 8),
          actions!,
        ],
      ],
    );
  }
}
