import 'package:flutter/material.dart';
import '../models/entity_model.dart';
import '../config/app_theme.dart';
import 'entity_info.dart';

/// Unified Entity Card Component
/// Used consistently across: HomePage, EntitiesPage, ProfilePage, SearchPage
///
/// This is a clickable card wrapper around EntityInfo
class EntityCard extends StatefulWidget {
  final Entity entity;
  final VoidCallback onTap;

  const EntityCard({
    super.key,
    required this.entity,
    required this.onTap,
  });

  @override
  State<EntityCard> createState() => _EntityCardState();
}

class _EntityCardState extends State<EntityCard> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: AppTheme.spaceL),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Colors.white,
              _isHovered ? Colors.grey.shade50 : Colors.white,
            ],
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: _isHovered
                ? AppTheme.accentYellow.withOpacity(0.4)
                : AppTheme.accentYellow.withOpacity(0.15),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: AppTheme.accentYellow.withOpacity(_isHovered ? 0.12 : 0.06),
              blurRadius: _isHovered ? 20 : 12,
              offset: Offset(0, _isHovered ? 8 : 4),
              spreadRadius: 0,
            ),
            BoxShadow(
              color: Colors.black.withOpacity(_isHovered ? 0.06 : 0.03),
              blurRadius: _isHovered ? 12 : 8,
              offset: Offset(0, _isHovered ? 4 : 2),
              spreadRadius: 0,
            ),
          ],
        ),
        child: InkWell(
          onTap: widget.onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(AppTheme.spaceL),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Reusable Entity Info Component
                Expanded(
                  child: EntityInfo.fromEntity(
                    widget.entity,
                    avatarSize: 100,
                    nameSize: 18,
                    ratingSize: 18,
                    showDescription: true,
                    showAvatar: true,
                    showVerifiedIcon: false,
                    maxDescriptionLines: 2,
                  ),
                ),

                // Navigation Arrow
                Icon(
                  Icons.chevron_right_rounded,
                  color: AppTheme.textTertiary,
                  size: 24,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
