import 'package:flutter/material.dart';
import '../config/app_theme.dart';

class AddReviewStatusBar extends StatefulWidget {
  final String userAvatar;
  final String userName;
  final VoidCallback onWriteReview;
  final VoidCallback onSearch;

  const AddReviewStatusBar({
    super.key,
    required this.userAvatar,
    required this.userName,
    required this.onWriteReview,
    required this.onSearch,
  });

  @override
  State<AddReviewStatusBar> createState() => _AddReviewStatusBarState();
}

class _AddReviewStatusBarState extends State<AddReviewStatusBar>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  bool _isSearchHovered = false;
  bool _isWriteHovered = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.98).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeInOut,
      ),
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: AppTheme.yellowGradient,
        border: Border.all(
          color: AppTheme.accentYellowLight,
          width: 2,
        ),
        borderRadius: AppTheme.radiusMedium,
        boxShadow: AppTheme.yellowGlowShadow,
      ),
      padding: const EdgeInsets.all(AppTheme.spaceL),
      child: Row(
        children: [
          // User Avatar with ring
          Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: AppTheme.accentYellow.withOpacity(0.3),
                width: 2,
              ),
            ),
            child: CircleAvatar(
              radius: 20,
              backgroundImage: NetworkImage(widget.userAvatar),
              backgroundColor: AppTheme.borderLight,
            ),
          ),
          const SizedBox(width: AppTheme.spaceM),

          // Search Section with hover effect
          Expanded(
            child: MouseRegion(
              onEnter: (_) => setState(() => _isSearchHovered = true),
              onExit: (_) => setState(() => _isSearchHovered = false),
              child: GestureDetector(
                onTapDown: (_) => _animationController.forward(),
                onTapUp: (_) {
                  _animationController.reverse();
                  widget.onSearch();
                },
                onTapCancel: () => _animationController.reverse(),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppTheme.spaceS,
                    vertical: AppTheme.spaceS,
                  ),
                  decoration: BoxDecoration(
                    color: _isSearchHovered
                        ? AppTheme.primaryPurple.withOpacity(0.05)
                        : Colors.transparent,
                    borderRadius: AppTheme.radiusSmall,
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.search_rounded,
                        size: 18,
                        color: AppTheme.primaryPurple,
                      ),
                      const SizedBox(width: AppTheme.spaceS),
                      Text(
                        'Search reviews',
                        style: AppTheme.bodyMedium.copyWith(
                          fontWeight: FontWeight.w600,
                          color: _isSearchHovered
                              ? AppTheme.primaryPurple
                              : AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Divider
          Container(
            width: 1.5,
            height: 24,
            margin: const EdgeInsets.symmetric(horizontal: AppTheme.spaceS),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  AppTheme.borderLight.withOpacity(0),
                  AppTheme.borderMedium,
                  AppTheme.borderLight.withOpacity(0),
                ],
              ),
            ),
          ),

          // Write Review Section with hover effect
          Expanded(
            child: MouseRegion(
              onEnter: (_) => setState(() => _isWriteHovered = true),
              onExit: (_) => setState(() => _isWriteHovered = false),
              child: GestureDetector(
                onTapDown: (_) => _animationController.forward(),
                onTapUp: (_) {
                  _animationController.reverse();
                  widget.onWriteReview();
                },
                onTapCancel: () => _animationController.reverse(),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppTheme.spaceS,
                    vertical: AppTheme.spaceS,
                  ),
                  decoration: BoxDecoration(
                    color: _isWriteHovered
                        ? AppTheme.accentYellow.withOpacity(0.1)
                        : Colors.transparent,
                    borderRadius: AppTheme.radiusSmall,
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.edit_rounded,
                        size: 18,
                        color: AppTheme.accentYellowDark,
                      ),
                      const SizedBox(width: AppTheme.spaceS),
                      Flexible(
                        child: Text(
                          'Write a review, ${widget.userName}',
                          style: AppTheme.bodyMedium.copyWith(
                            fontWeight: FontWeight.w600,
                            color: _isWriteHovered
                                ? AppTheme.accentYellowDark
                                : AppTheme.textSecondary,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
