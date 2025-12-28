import 'package:flutter/material.dart';
import '../models/entity_question_model.dart';
import '../config/app_theme.dart';
import '../config/app_colors.dart';
import '../utils/formatters/date_formatter.dart';
import 'package:cached_network_image/cached_network_image.dart';

class QuestionCard extends StatelessWidget {
  final EntityQuestion question;
  final VoidCallback? onTap;

  const QuestionCard({
    super.key,
    required this.question,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return InkWell(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: colors.cardBackground,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: question.hasOfficialAnswer
                ? colors.success.withOpacity(0.3)
                : colors.border,
            width: question.hasOfficialAnswer ? 2 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: colors.shadow,
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with user info
            Row(
              children: [
                CircleAvatar(
                  radius: 16,
                  backgroundColor: AppTheme.primaryPurple.withOpacity(0.1),
                  backgroundImage: question.userAvatar != null
                      ? CachedNetworkImageProvider(question.userAvatar!)
                      : null,
                  child: question.userAvatar == null
                      ? Icon(Icons.person,
                          size: 16, color: AppTheme.primaryPurple)
                      : null,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        question.username,
                        style: AppTheme.bodyMedium.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        DateFormatter.timeAgo(question.createdAt),
                        style: AppTheme.bodySmall.copyWith(
                          color: colors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                if (question.hasOfficialAnswer)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: colors.success.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: colors.success.withOpacity(0.3)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.verified,
                          size: 14,
                          color: colors.success,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Answered',
                          style: TextStyle(
                            fontSize: 11,
                            color: colors.success,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),

            // Question title
            Text(
              question.title,
              style: AppTheme.headingSmall.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),

            // Description preview (if available)
            if (question.description != null &&
                question.description!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                question.description!,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: AppTheme.bodyMedium.copyWith(
                  color: colors.textSecondary,
                ),
              ),
            ],

            const SizedBox(height: 12),
            Divider(height: 1, color: colors.divider),
            const SizedBox(height: 12),

            // Stats row (wrapped to prevent overflow)
            Wrap(
              spacing: 16,
              runSpacing: 8,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.question_answer_outlined,
                      size: 18,
                      color: colors.iconSecondary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${question.answersCount} ${question.answersCount == 1 ? 'answer' : 'answers'}',
                      style: AppTheme.bodySmall.copyWith(
                        color: colors.textSecondary,
                      ),
                    ),
                  ],
                ),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.visibility_outlined,
                      size: 18,
                      color: colors.iconSecondary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${question.viewCount} views',
                      style: AppTheme.bodySmall.copyWith(
                        color: colors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
