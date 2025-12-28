import 'package:flutter/material.dart';
import '../models/entity_question_model.dart';
import '../config/app_theme.dart';
import '../config/app_colors.dart';
import '../utils/formatters/date_formatter.dart';
import 'package:cached_network_image/cached_network_image.dart';

/// Beautifully designed Q&A card matching community post design
class QuestionCard extends StatelessWidget {
  final EntityQuestion question;
  final VoidCallback? onTap;
  final String? entityName; // Optional entity context

  const QuestionCard({
    super.key,
    required this.question,
    this.onTap,
    this.entityName,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: colors.cardBackground,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: question.hasOfficialAnswer
                ? AppTheme.successGreen.withOpacity(0.3)
                : colors.border.withOpacity(0.1),
            width: question.hasOfficialAnswer ? 2 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: question.hasOfficialAnswer
                  ? AppTheme.successGreen.withOpacity(0.12)
                  : AppTheme.primaryPurple.withOpacity(0.08),
              blurRadius: 20,
              offset: const Offset(0, 4),
              spreadRadius: 0,
            ),
            BoxShadow(
              color: colors.shadow.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header: User info with Q&A badge
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    AppTheme.primaryPurple.withOpacity(0.02),
                    Colors.transparent,
                  ],
                ),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      // User avatar with gradient border
                      Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(
                            colors: [
                              AppTheme.infoBlue.withOpacity(0.6),
                              AppTheme.infoBlue.withOpacity(0.2),
                            ],
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.infoBlue.withOpacity(0.2),
                              blurRadius: 8,
                              spreadRadius: 1,
                            ),
                          ],
                        ),
                        padding: const EdgeInsets.all(2),
                        child: CircleAvatar(
                          radius: 24,
                          backgroundColor: colors.cardBackground,
                          backgroundImage: question.userAvatar != null
                              ? CachedNetworkImageProvider(question.userAvatar!)
                              : null,
                          child: question.userAvatar == null
                              ? Icon(Icons.person,
                                  color: colors.iconPrimary, size: 28)
                              : null,
                        ),
                      ),
                      const SizedBox(width: 12),

                      // User name and timestamp
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    question.username,
                                    style: AppTheme.bodyLarge.copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: colors.textPrimary,
                                      fontSize: 16,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                Icon(
                                  Icons.access_time,
                                  size: 12,
                                  color: colors.textSecondary,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  DateFormatter.timeAgo(question.createdAt),
                                  style: AppTheme.bodySmall.copyWith(
                                    color: colors.textSecondary,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      // Official Answer badge (top-right)
                      if (question.hasOfficialAnswer)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                AppTheme.successGreen,
                                AppTheme.successGreen.withOpacity(0.8),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.successGreen.withOpacity(0.3),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.verified,
                                size: 14,
                                color: Colors.white,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                'Answered',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),

                  // Entity context badge (if provided)
                  if (entityName != null) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            AppTheme.infoBlue.withOpacity(0.15),
                            AppTheme.infoBlue.withOpacity(0.05),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppTheme.infoBlue.withOpacity(0.3),
                          width: 1.5,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: AppTheme.infoBlue,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(
                              Icons.help_outline,
                              size: 16,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Flexible(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Question About',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: AppTheme.infoBlue.withOpacity(0.7),
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                Text(
                                  entityName!,
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: AppTheme.infoBlue,
                                    fontWeight: FontWeight.bold,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),

            // Content section
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Question title with icon
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        margin: const EdgeInsets.only(top: 2),
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              AppTheme.infoBlue.withOpacity(0.15),
                              AppTheme.infoBlue.withOpacity(0.05),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          Icons.help_outline,
                          size: 18,
                          color: AppTheme.infoBlue,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          question.title,
                          style: AppTheme.headingMedium.copyWith(
                            fontWeight: FontWeight.bold,
                            color: colors.textPrimary,
                            fontSize: 18,
                            height: 1.3,
                          ),
                        ),
                      ),
                    ],
                  ),

                  // Description (if available)
                  if (question.description != null &&
                      question.description!.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Text(
                      question.description!,
                      style: AppTheme.bodyMedium.copyWith(
                        color: colors.textPrimary,
                        fontSize: 15,
                        height: 1.5,
                      ),
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),

            // Divider
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Divider(
                color: colors.border.withOpacity(0.3),
                height: 1,
              ),
            ),

            // Stats row with beautiful design
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  _buildStat(
                    context: context,
                    icon: Icons.question_answer_outlined,
                    label:
                        '${question.answersCount} ${question.answersCount == 1 ? 'answer' : 'answers'}',
                    color: colors.iconSecondary,
                    isActive: question.answersCount > 0,
                  ),
                  const SizedBox(width: 24),
                  _buildStat(
                    context: context,
                    icon: Icons.visibility_outlined,
                    label: '${question.viewCount} views',
                    color: colors.iconSecondary,
                    isActive: false,
                  ),
                  const Spacer(),
                  // Answer button indicator
                  _buildStat(
                    context: context,
                    icon: Icons.reply_outlined,
                    label: 'Answer',
                    color: AppTheme.primaryPurple,
                    isActive: false,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStat({
    required BuildContext context,
    required IconData icon,
    required String label,
    required Color color,
    required bool isActive,
  }) {
    final widget = Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isActive ? color.withOpacity(0.1) : Colors.transparent,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 20,
            color: color,
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: AppTheme.bodySmall.copyWith(
              color: color,
              fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );

    return widget;
  }
}
