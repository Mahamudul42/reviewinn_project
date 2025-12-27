import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/entity_question_model.dart';
import '../models/entity_answer_model.dart';
import '../providers/entity_qa_provider.dart';
import '../providers/auth_provider.dart';
import '../config/app_theme.dart';
import 'package:cached_network_image/cached_network_image.dart';

class QuestionDetailModal extends StatefulWidget {
  final EntityQuestion question;

  const QuestionDetailModal({
    super.key,
    required this.question,
  });

  @override
  State<QuestionDetailModal> createState() => _QuestionDetailModalState();
}

class _QuestionDetailModalState extends State<QuestionDetailModal> {
  final TextEditingController _answerController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<EntityQAProvider>(context, listen: false)
          .fetchAnswers(widget.question.questionId);
    });
  }

  @override
  void dispose() {
    _answerController.dispose();
    super.dispose();
  }

  String _formatTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 365) {
      return '${(difference.inDays / 365).floor()}y ago';
    } else if (difference.inDays > 30) {
      return '${(difference.inDays / 30).floor()}mo ago';
    } else if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }

  Future<void> _submitAnswer() async {
    if (_answerController.text.trim().isEmpty) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (!authProvider.isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please login to answer questions')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final qaProvider = Provider.of<EntityQAProvider>(context, listen: false);
    final success = await qaProvider.submitAnswer(
      questionId: widget.question.questionId,
      content: _answerController.text.trim(),
    );

    setState(() => _isSubmitting = false);

    if (success) {
      _answerController.clear();
      FocusScope.of(context).unfocus();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to submit answer')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.all(16),
      child: Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.85,
          maxWidth: 600,
        ),
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(20)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'Question Details',
                      style: AppTheme.headingMedium.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                    iconSize: 24,
                  ),
                ],
              ),
            ),

            // Content
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Question Card
                    Container(
                      margin: const EdgeInsets.all(16),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: widget.question.hasOfficialAnswer
                              ? Colors.green.withOpacity(0.3)
                              : Colors.grey.shade200,
                          width: widget.question.hasOfficialAnswer ? 2 : 1,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // User info
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 20,
                                backgroundColor:
                                    AppTheme.primaryPurple.withOpacity(0.1),
                                backgroundImage:
                                    widget.question.userAvatar != null
                                        ? CachedNetworkImageProvider(
                                            widget.question.userAvatar!)
                                        : null,
                                child: widget.question.userAvatar == null
                                    ? Icon(Icons.person,
                                        size: 20, color: AppTheme.primaryPurple)
                                    : null,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      widget.question.username,
                                      style: AppTheme.bodyMedium.copyWith(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    Text(
                                      _formatTimeAgo(widget.question.createdAt),
                                      style: AppTheme.bodySmall.copyWith(
                                        color: Colors.grey[600],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              if (widget.question.hasOfficialAnswer)
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.green.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                        color: Colors.green.withOpacity(0.3)),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        Icons.verified,
                                        size: 14,
                                        color: Colors.green,
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        'Answered',
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: Colors.green[700],
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 16),

                          // Title
                          Text(
                            widget.question.title,
                            style: AppTheme.headingSmall.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),

                          // Description
                          if (widget.question.description != null &&
                              widget.question.description!.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Text(
                              widget.question.description!,
                              style: AppTheme.bodyMedium.copyWith(
                                color: Colors.grey[700],
                              ),
                            ),
                          ],

                          const SizedBox(height: 16),
                          Divider(height: 1, color: Colors.grey[200]),
                          const SizedBox(height: 12),

                          // Stats
                          Row(
                            children: [
                              Icon(
                                Icons.question_answer_outlined,
                                size: 18,
                                color: Colors.grey[600],
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '${widget.question.answersCount} ${widget.question.answersCount == 1 ? 'answer' : 'answers'}',
                                style: AppTheme.bodySmall.copyWith(
                                  color: Colors.grey[700],
                                ),
                              ),
                              const SizedBox(width: 16),
                              Icon(
                                Icons.visibility_outlined,
                                size: 18,
                                color: Colors.grey[600],
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '${widget.question.viewCount} views',
                                style: AppTheme.bodySmall.copyWith(
                                  color: Colors.grey[700],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // Answers Section
                    Consumer<EntityQAProvider>(
                      builder: (context, qaProvider, child) {
                        final answers = qaProvider
                            .getAnswersForQuestion(widget.question.questionId);

                        if (qaProvider.isLoading && answers.isEmpty) {
                          return const Padding(
                            padding: EdgeInsets.all(32.0),
                            child: Center(
                              child: CircularProgressIndicator(),
                            ),
                          );
                        }

                        if (answers.isEmpty) {
                          return Container(
                            margin: const EdgeInsets.symmetric(horizontal: 16),
                            padding: const EdgeInsets.all(32),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Column(
                              children: [
                                Icon(
                                  Icons.question_answer_outlined,
                                  size: 48,
                                  color: Colors.grey[400],
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  'No answers yet',
                                  style: AppTheme.bodyMedium.copyWith(
                                    color: Colors.grey[600],
                                  ),
                                ),
                              ],
                            ),
                          );
                        }

                        // Sort answers: official first, then by score
                        final sortedAnswers = List<EntityAnswer>.from(answers);
                        sortedAnswers.sort((a, b) {
                          if (a.isOfficial && !b.isOfficial) return -1;
                          if (!a.isOfficial && b.isOfficial) return 1;
                          return b.score.compareTo(a.score);
                        });

                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 16),
                              child: Text(
                                '${answers.length} ${answers.length == 1 ? 'Answer' : 'Answers'}',
                                style: AppTheme.headingSmall.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            const SizedBox(height: 12),
                            ...sortedAnswers.map((answer) => _buildAnswerCard(
                                  context,
                                  answer,
                                  qaProvider,
                                )),
                          ],
                        );
                      },
                    ),

                    const SizedBox(height: 100),
                  ],
                ),
              ),
            ),

            // Answer Input
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius:
                    const BorderRadius.vertical(bottom: Radius.circular(20)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 8,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _answerController,
                      decoration: InputDecoration(
                        hintText: 'Write your answer...',
                        filled: true,
                        fillColor: AppTheme.backgroundLight,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                      ),
                      maxLines: null,
                      textInputAction: TextInputAction.newline,
                    ),
                  ),
                  const SizedBox(width: 12),
                  _isSubmitting
                      ? const SizedBox(
                          width: 40,
                          height: 40,
                          child: Center(
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        )
                      : IconButton(
                          onPressed: _submitAnswer,
                          icon: Icon(
                            Icons.send,
                            color: AppTheme.primaryPurple,
                          ),
                          iconSize: 28,
                        ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAnswerCard(
    BuildContext context,
    EntityAnswer answer,
    EntityQAProvider qaProvider,
  ) {
    final scoreColor = answer.score > 0
        ? Colors.green
        : answer.score < 0
            ? Colors.red
            : Colors.grey;

    return Container(
      margin: const EdgeInsets.only(left: 16, right: 16, bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: answer.isOfficial
            ? Colors.green.withOpacity(0.05)
            : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: answer.isOfficial
              ? Colors.green.withOpacity(0.3)
              : Colors.grey.shade200,
          width: answer.isOfficial ? 2 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // User info
          Row(
            children: [
              CircleAvatar(
                radius: 16,
                backgroundColor: AppTheme.primaryPurple.withOpacity(0.1),
                backgroundImage: answer.userAvatar != null
                    ? CachedNetworkImageProvider(answer.userAvatar!)
                    : null,
                child: answer.userAvatar == null
                    ? Icon(Icons.person,
                        size: 16, color: AppTheme.primaryPurple)
                    : null,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          answer.username,
                          style: AppTheme.bodyMedium.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (answer.isOfficial) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.green.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.verified,
                                  size: 12,
                                  color: Colors.green[700],
                                ),
                                const SizedBox(width: 3),
                                Text(
                                  answer.officialRole ?? 'Official',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: Colors.green[700],
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                    Text(
                      _formatTimeAgo(answer.createdAt),
                      style: AppTheme.bodySmall.copyWith(
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Answer content
          Text(
            answer.content,
            style: AppTheme.bodyMedium,
          ),

          const SizedBox(height: 12),
          Divider(height: 1, color: Colors.grey[200]),
          const SizedBox(height: 12),

          // Voting buttons
          Row(
            children: [
              // Upvote button
              InkWell(
                onTap: () => qaProvider.voteAnswer(
                  answer.answerId,
                  widget.question.questionId,
                  true,
                ),
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: answer.voteStatus == VoteStatus.upvoted
                        ? Colors.green.withOpacity(0.1)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: answer.voteStatus == VoteStatus.upvoted
                          ? Colors.green
                          : Colors.grey.shade300,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.arrow_upward,
                        size: 16,
                        color: answer.voteStatus == VoteStatus.upvoted
                            ? Colors.green
                            : Colors.grey[600],
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${answer.upvotes}',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: answer.voteStatus == VoteStatus.upvoted
                              ? Colors.green
                              : Colors.grey[700],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // Downvote button
              InkWell(
                onTap: () => qaProvider.voteAnswer(
                  answer.answerId,
                  widget.question.questionId,
                  false,
                ),
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: answer.voteStatus == VoteStatus.downvoted
                        ? Colors.red.withOpacity(0.1)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: answer.voteStatus == VoteStatus.downvoted
                          ? Colors.red
                          : Colors.grey.shade300,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.arrow_downward,
                        size: 16,
                        color: answer.voteStatus == VoteStatus.downvoted
                            ? Colors.red
                            : Colors.grey[600],
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${answer.downvotes}',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: answer.voteStatus == VoteStatus.downvoted
                              ? Colors.red
                              : Colors.grey[700],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 16),

              // Score
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: scoreColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Score: ',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[700],
                      ),
                    ),
                    Text(
                      answer.score > 0 ? '+${answer.score}' : '${answer.score}',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: scoreColor,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
