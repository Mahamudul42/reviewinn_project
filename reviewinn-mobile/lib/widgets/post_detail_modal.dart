import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/community_post_model.dart';
import '../models/comment_model.dart';
import '../providers/community_provider.dart';
import '../providers/auth_provider.dart';
import '../config/app_theme.dart';
import '../screens/login_screen.dart';
import '../screens/edit_post_screen.dart';
import 'edit_comment_modal.dart';

class PostDetailModal extends StatefulWidget {
  final CommunityPost post;

  const PostDetailModal({super.key, required this.post});

  @override
  State<PostDetailModal> createState() => _PostDetailModalState();
}

class _PostDetailModalState extends State<PostDetailModal> {
  final TextEditingController _commentController = TextEditingController();
  bool _isSubmittingComment = false;

  @override
  void initState() {
    super.initState();
    // Load comments for this post
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<CommunityProvider>(context, listen: false)
          .fetchPostComments(widget.post.postId);
    });
  }

  @override
  void dispose() {
    _commentController.dispose();
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

  Future<void> _handleLike() async {
    final provider = Provider.of<CommunityProvider>(context, listen: false);
    await provider.toggleLike(widget.post.postId);
  }

  Future<void> _submitComment() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (!authProvider.isAuthenticated) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
      return;
    }

    if (_commentController.text.trim().isEmpty) return;

    setState(() => _isSubmittingComment = true);

    final provider = Provider.of<CommunityProvider>(context, listen: false);
    final success = await provider.addComment(
      widget.post.postId,
      _commentController.text.trim(),
    );

    setState(() => _isSubmittingComment = false);

    if (success) {
      _commentController.clear();
      FocusScope.of(context).unfocus();
    }
  }

  bool _isOwnPost() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    return authProvider.user?.userId == widget.post.userId;
  }

  Future<void> _handleEditPost() async {
    Navigator.pop(context); // Close modal

    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => EditPostScreen(post: widget.post),
      ),
    );

    if (result == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Post updated successfully!'),
          backgroundColor: AppTheme.successGreen,
        ),
      );
    }
  }

  Future<void> _handleDeletePost() async {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Post'),
        content: const Text(
          'Are you sure you want to delete this post? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context); // Close dialog
              Navigator.pop(context); // Close modal

              try {
                final communityProvider =
                    Provider.of<CommunityProvider>(context, listen: false);
                await communityProvider.deletePost(widget.post.postId);

                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Post deleted successfully'),
                      backgroundColor: AppTheme.successGreen,
                    ),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Failed to delete post: $e'),
                      backgroundColor: AppTheme.errorRed,
                    ),
                  );
                }
              }
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  void _showOptionsMenu() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Icon(Icons.edit, color: AppTheme.primaryPurple),
              title: const Text('Edit Post'),
              onTap: () {
                Navigator.pop(context);
                _handleEditPost();
              },
            ),
            ListTile(
              leading: Icon(Icons.delete, color: Colors.red),
              title: const Text('Delete Post', style: TextStyle(color: Colors.red)),
              onTap: () {
                Navigator.pop(context);
                _handleDeletePost();
              },
            ),
          ],
        ),
      ),
    );
  }

  // Comment helper methods
  bool _isOwnComment(Comment comment) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    return authProvider.user?.userId == comment.userId;
  }

  Future<void> _handleEditComment(Comment comment) async {
    final result = await EditCommentModal.show(context, comment);

    if (result == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Comment updated successfully!'),
          backgroundColor: AppTheme.successGreen,
        ),
      );
    }
  }

  Future<void> _handleDeleteComment(Comment comment) async {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Comment'),
        content: const Text(
          'Are you sure you want to delete this comment? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context); // Close dialog

              try {
                final communityProvider =
                    Provider.of<CommunityProvider>(context, listen: false);
                await communityProvider.deleteComment(
                  comment.commentId,
                  widget.post.postId,
                );

                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Comment deleted successfully'),
                      backgroundColor: AppTheme.successGreen,
                    ),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Failed to delete comment: $e'),
                      backgroundColor: AppTheme.errorRed,
                    ),
                  );
                }
              }
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  void _showCommentOptionsMenu(Comment comment) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Icon(Icons.edit, color: AppTheme.primaryPurple),
              title: const Text('Edit Comment'),
              onTap: () {
                Navigator.pop(context);
                _handleEditComment(comment);
              },
            ),
            ListTile(
              leading: Icon(Icons.delete, color: Colors.red),
              title: const Text('Delete Comment',
                  style: TextStyle(color: Colors.red)),
              onTap: () {
                Navigator.pop(context);
                _handleDeleteComment(comment);
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 32),
      child: Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.85,
          maxWidth: 600,
        ),
        decoration: BoxDecoration(
          color: Colors.white,
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
                border: Border(
                  bottom: BorderSide(color: Colors.grey.shade200),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'Discussion',
                      style: AppTheme.headingMedium.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  // Show edit/delete menu for own posts
                  if (_isOwnPost())
                    IconButton(
                      icon: const Icon(Icons.more_vert),
                      onPressed: _showOptionsMenu,
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
            ),

            // Content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
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
                          backgroundImage: widget.post.userAvatar != null
                              ? CachedNetworkImageProvider(
                                  widget.post.userAvatar!)
                              : null,
                          child: widget.post.userAvatar == null
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
                                widget.post.username,
                                style: AppTheme.bodyLarge.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                _formatTimeAgo(widget.post.createdAt),
                                style: AppTheme.bodySmall.copyWith(
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (widget.post.isPinned)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.accentYellow.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.push_pin,
                                    size: 12, color: AppTheme.accentYellow),
                                const SizedBox(width: 4),
                                Text(
                                  'Pinned',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: AppTheme.accentYellow,
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
                      widget.post.title,
                      style: AppTheme.headingMedium.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Content
                    Text(
                      widget.post.content,
                      style: AppTheme.bodyLarge.copyWith(height: 1.6),
                    ),
                    const SizedBox(height: 16),

                    // Tags
                    if (widget.post.tags != null &&
                        widget.post.tags!.isNotEmpty)
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: widget.post.tags!.map((tag) {
                          return Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryPurple.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Text(
                              '#$tag',
                              style: TextStyle(
                                fontSize: 13,
                                color: AppTheme.primaryPurple,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          );
                        }).toList(),
                      ),

                    // Linked entity (if any)
                    if (widget.post.entityId != null) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.business,
                                size: 20, color: Colors.grey[700]),
                            const SizedBox(width: 8),
                            Text(
                              'Related to: ${widget.post.entityName}',
                              style: AppTheme.bodyMedium.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 20),
                    Divider(color: Colors.grey.shade300),
                    const SizedBox(height: 16),

                    // Actions
                    Row(
                      children: [
                        InkWell(
                          onTap: _handleLike,
                          child: Row(
                            children: [
                              Icon(
                                widget.post.isLiked
                                    ? Icons.favorite
                                    : Icons.favorite_border,
                                color: widget.post.isLiked
                                    ? Colors.red
                                    : Colors.grey[600],
                                size: 22,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                '${widget.post.likesCount}',
                                style: AppTheme.bodyMedium.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 24),
                        Row(
                          children: [
                            Icon(Icons.comment_outlined,
                                color: Colors.grey[600], size: 22),
                            const SizedBox(width: 6),
                            Text(
                              '${widget.post.commentsCount}',
                              style: AppTheme.bodyMedium.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(width: 24),
                        Row(
                          children: [
                            Icon(Icons.visibility_outlined,
                                color: Colors.grey[600], size: 22),
                            const SizedBox(width: 6),
                            Text(
                              '${widget.post.viewCount}',
                              style: AppTheme.bodyMedium.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),

                    const SizedBox(height: 20),
                    Divider(color: Colors.grey.shade300),
                    const SizedBox(height: 16),

                    // Comments section
                    Consumer<CommunityProvider>(
                      builder: (context, provider, child) {
                        if (provider.isLoading) {
                          return const Center(
                            child: Padding(
                              padding: EdgeInsets.all(20),
                              child: CircularProgressIndicator(),
                            ),
                          );
                        }

                        final comments = provider.postComments;

                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Comments (${comments.length})',
                              style: AppTheme.headingSmall.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 12),
                            if (comments.isEmpty)
                              Center(
                                child: Padding(
                                  padding: const EdgeInsets.all(20),
                                  child: Text(
                                    'No comments yet',
                                    style: AppTheme.bodyMedium.copyWith(
                                      color: Colors.grey[600],
                                    ),
                                  ),
                                ),
                              )
                            else
                              ...comments.map((comment) => _buildCommentCard(comment)),
                          ],
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),

            // Comment input
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(
                  top: BorderSide(color: Colors.grey.shade200),
                ),
                borderRadius:
                    const BorderRadius.vertical(bottom: Radius.circular(20)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _commentController,
                      decoration: InputDecoration(
                        hintText: 'Write a comment...',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide(color: Colors.grey.shade300),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide(color: Colors.grey.shade300),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide:
                              BorderSide(color: AppTheme.primaryPurple),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                      ),
                      maxLines: null,
                      textCapitalization: TextCapitalization.sentences,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    decoration: BoxDecoration(
                      gradient: AppTheme.purpleGradient,
                      shape: BoxShape.circle,
                    ),
                    child: IconButton(
                      icon: _isSubmittingComment
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor:
                                    AlwaysStoppedAnimation(Colors.white),
                              ),
                            )
                          : const Icon(Icons.send, color: Colors.white),
                      onPressed:
                          _isSubmittingComment ? null : _submitComment,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCommentCard(Comment comment) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 14,
                backgroundColor: AppTheme.primaryPurple.withOpacity(0.1),
                backgroundImage: comment.userAvatar != null
                    ? CachedNetworkImageProvider(comment.userAvatar!)
                    : null,
                child: comment.userAvatar == null
                    ? Icon(Icons.person,
                        size: 14, color: AppTheme.primaryPurple)
                    : null,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      comment.username,
                      style: AppTheme.bodyMedium.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      _formatTimeAgo(comment.createdAt),
                      style: AppTheme.bodySmall.copyWith(
                        color: Colors.grey[600],
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              if (comment.isLiked)
                Icon(Icons.favorite, size: 16, color: Colors.red),
              // Show menu button for own comments
              if (_isOwnComment(comment))
                IconButton(
                  icon: Icon(Icons.more_vert, size: 18),
                  onPressed: () => _showCommentOptionsMenu(comment),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  color: Colors.grey[600],
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            comment.content,
            style: AppTheme.bodyMedium.copyWith(height: 1.5),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.favorite_border, size: 16, color: Colors.grey[600]),
              const SizedBox(width: 4),
              Text(
                '${comment.likesCount}',
                style: AppTheme.bodySmall.copyWith(color: Colors.grey[600]),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
