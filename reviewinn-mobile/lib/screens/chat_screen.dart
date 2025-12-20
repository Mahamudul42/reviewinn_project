import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../config/app_theme.dart';
import '../models/message_models.dart';
import '../services/messaging_service.dart';
import '../services/auth_service.dart';

class ChatScreen extends StatefulWidget {
  final Conversation conversation;

  const ChatScreen({
    super.key,
    required this.conversation,
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final MessagingService _messagingService = MessagingService();
  final AuthService _authService = AuthService();
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  List<Message> _messages = [];
  bool _isLoading = true;
  bool _isSending = false;
  String? _error;
  String? _currentUserId;

  @override
  void initState() {
    super.initState();
    _initializeChat();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _initializeChat() async {
    final token = await _authService.getToken();
    final userId = await _authService.getUserId();

    if (token == null || userId == null) {
      setState(() {
        _isLoading = false;
        _error = 'Not authenticated';
      });
      return;
    }

    setState(() => _currentUserId = userId);

    await _loadMessages(token);
    await _markAsRead(token);
  }

  Future<void> _loadMessages(String token) async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final messages = await _messagingService.getMessages(
        token,
        widget.conversation.id,
      );

      setState(() {
        _messages = messages.reversed.toList();
        _isLoading = false;
      });

      // Scroll to bottom after loading messages
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scrollController.hasClients) {
          _scrollController.animateTo(
            _scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        }
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = 'Failed to load messages';
      });
    }
  }

  Future<void> _markAsRead(String token) async {
    try {
      await _messagingService.markAsRead(token, widget.conversation.id);
    } catch (e) {
      // Silently fail - not critical
      print('Failed to mark as read: $e');
    }
  }

  Future<void> _sendMessage() async {
    final content = _messageController.text.trim();
    if (content.isEmpty || _isSending) return;

    final token = await _authService.getToken();
    if (token == null) return;

    setState(() {
      _isSending = true;
      _messageController.clear();
    });

    try {
      final message = await _messagingService.sendMessage(
        token,
        widget.conversation.id,
        content,
      );

      if (message != null) {
        setState(() {
          _messages.add(message);
          _isSending = false;
        });

        // Scroll to bottom after sending
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (_scrollController.hasClients) {
            _scrollController.animateTo(
              _scrollController.position.maxScrollExtent,
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOut,
            );
          }
        });
      } else {
        setState(() => _isSending = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Failed to send message'),
              backgroundColor: AppTheme.errorRed,
            ),
          );
        }
      }
    } catch (e) {
      setState(() => _isSending = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: AppTheme.errorRed,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: _buildAppBar(),
      body: Column(
        children: [
          // Messages List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? _buildError()
                    : _messages.isEmpty
                        ? _buildEmptyState()
                        : _buildMessagesList(),
          ),

          // Message Input
          _buildMessageInput(),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 1,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back, color: AppTheme.textPrimary),
        onPressed: () => Navigator.pop(context),
      ),
      title: Row(
        children: [
          // Avatar
          Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: AppTheme.borderLight,
                width: 2,
              ),
            ),
            child: ClipOval(
              child: widget.conversation.otherUser.avatar != null
                  ? CachedNetworkImage(
                      imageUrl: widget.conversation.otherUser.avatar!,
                      width: 36,
                      height: 36,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        width: 36,
                        height: 36,
                        color: AppTheme.backgroundLight,
                        child: const Center(
                          child: SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        ),
                      ),
                      errorWidget: (context, url, error) => Container(
                        width: 36,
                        height: 36,
                        color: AppTheme.infoBlue.withOpacity(0.1),
                        child: Icon(
                          Icons.person,
                          size: 20,
                          color: AppTheme.infoBlue,
                        ),
                      ),
                    )
                  : Container(
                      width: 36,
                      height: 36,
                      color: AppTheme.infoBlue.withOpacity(0.1),
                      child: Icon(
                        Icons.person,
                        size: 20,
                        color: AppTheme.infoBlue,
                      ),
                    ),
            ),
          ),
          const SizedBox(width: 12),

          // User Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.conversation.otherUser.name,
                  style: AppTheme.labelMedium.copyWith(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (widget.conversation.isOnline)
                  Row(
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: AppTheme.successGreen,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Online',
                        style: AppTheme.bodySmall.copyWith(
                          color: AppTheme.successGreen,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.more_vert, color: AppTheme.textPrimary),
          onPressed: () {
            _showMoreOptions(context);
          },
        ),
      ],
    );
  }

  Widget _buildMessagesList() {
    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.all(AppTheme.spaceL),
      itemCount: _messages.length,
      itemBuilder: (context, index) {
        final message = _messages[index];
        final isMyMessage = message.senderId == _currentUserId;
        final showAvatar = index == 0 ||
            _messages[index - 1].senderId != message.senderId;

        return _buildMessageBubble(message, isMyMessage, showAvatar);
      },
    );
  }

  Widget _buildMessageBubble(Message message, bool isMyMessage, bool showAvatar) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: AppTheme.spaceM,
        left: isMyMessage ? 48 : 0,
        right: isMyMessage ? 0 : 48,
      ),
      child: Row(
        mainAxisAlignment:
            isMyMessage ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // Other user's avatar (left side)
          if (!isMyMessage && showAvatar)
            Container(
              width: 32,
              height: 32,
              margin: const EdgeInsets.only(right: 8),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: AppTheme.borderLight,
                  width: 1,
                ),
              ),
              child: ClipOval(
                child: widget.conversation.otherUser.avatar != null
                    ? CachedNetworkImage(
                        imageUrl: widget.conversation.otherUser.avatar!,
                        fit: BoxFit.cover,
                        errorWidget: (context, url, error) => Container(
                          color: AppTheme.infoBlue.withOpacity(0.1),
                          child: Icon(
                            Icons.person,
                            size: 16,
                            color: AppTheme.infoBlue,
                          ),
                        ),
                      )
                    : Container(
                        color: AppTheme.infoBlue.withOpacity(0.1),
                        child: Icon(
                          Icons.person,
                          size: 16,
                          color: AppTheme.infoBlue,
                        ),
                      ),
              ),
            )
          else if (!isMyMessage && !showAvatar)
            const SizedBox(width: 40),

          // Message bubble
          Flexible(
            child: Column(
              crossAxisAlignment:
                  isMyMessage ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: isMyMessage
                        ? AppTheme.infoBlue
                        : Colors.white,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(18),
                      topRight: const Radius.circular(18),
                      bottomLeft: Radius.circular(isMyMessage ? 18 : 4),
                      bottomRight: Radius.circular(isMyMessage ? 4 : 18),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Text(
                    message.content,
                    style: AppTheme.bodyMedium.copyWith(
                      color: isMyMessage ? Colors.white : AppTheme.textPrimary,
                      height: 1.4,
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _formatMessageTime(message.createdAt),
                  style: AppTheme.bodySmall.copyWith(
                    color: AppTheme.textTertiary,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageInput() {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spaceL),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            // Text Input
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: AppTheme.backgroundLight,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: TextField(
                  controller: _messageController,
                  decoration: InputDecoration(
                    hintText: 'Type a message...',
                    hintStyle: AppTheme.bodyMedium.copyWith(
                      color: AppTheme.textTertiary,
                    ),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 12,
                    ),
                  ),
                  maxLines: null,
                  textCapitalization: TextCapitalization.sentences,
                  enabled: !_isSending,
                ),
              ),
            ),

            const SizedBox(width: 8),

            // Send Button
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppTheme.infoBlue, AppTheme.infoBlue.withOpacity(0.8)],
                ),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.infoBlue.withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: _isSending ? null : _sendMessage,
                  borderRadius: BorderRadius.circular(24),
                  child: Container(
                    width: 48,
                    height: 48,
                    padding: const EdgeInsets.all(12),
                    child: _isSending
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(
                            Icons.send_rounded,
                            color: Colors.white,
                            size: 20,
                          ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spaceXL),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: AppTheme.infoBlue.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.chat_bubble_outline_rounded,
                size: 64,
                color: AppTheme.infoBlue.withOpacity(0.5),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Start Chatting',
              style: AppTheme.headingMedium,
            ),
            const SizedBox(height: 12),
            Text(
              'Send a message to start the conversation',
              style: AppTheme.bodyLarge.copyWith(
                color: AppTheme.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spaceXL),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: AppTheme.errorRed.withOpacity(0.5),
            ),
            const SizedBox(height: 24),
            const Text(
              'Oops!',
              style: AppTheme.headingMedium,
            ),
            const SizedBox(height: 12),
            Text(
              _error ?? 'Something went wrong',
              style: AppTheme.bodyLarge.copyWith(
                color: AppTheme.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () async {
                final token = await _authService.getToken();
                if (token != null) {
                  await _loadMessages(token);
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.infoBlue,
                foregroundColor: Colors.white,
              ),
              child: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }

  void _showMoreOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: AppTheme.borderLight,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            ListTile(
              leading: Icon(Icons.refresh, color: AppTheme.infoBlue),
              title: const Text('Refresh Messages'),
              onTap: () async {
                Navigator.pop(context);
                final token = await _authService.getToken();
                if (token != null) {
                  await _loadMessages(token);
                }
              },
            ),
            ListTile(
              leading: Icon(Icons.delete_outline, color: AppTheme.errorRed),
              title: Text(
                'Delete Conversation',
                style: TextStyle(color: AppTheme.errorRed),
              ),
              onTap: () async {
                Navigator.pop(context);
                final confirm = await _showDeleteConfirmation();
                if (confirm == true) {
                  await _deleteConversation();
                }
              },
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Future<bool?> _showDeleteConfirmation() {
    return showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Conversation'),
        content: const Text(
          'Are you sure you want to delete this conversation? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(
              foregroundColor: AppTheme.errorRed,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteConversation() async {
    final token = await _authService.getToken();
    if (token == null) return;

    try {
      final success = await _messagingService.deleteConversation(
        token,
        widget.conversation.id,
      );

      if (success && mounted) {
        Navigator.pop(context, true); // Return to messages screen
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Conversation deleted'),
            backgroundColor: AppTheme.successGreen,
          ),
        );
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to delete conversation'),
            backgroundColor: AppTheme.errorRed,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: AppTheme.errorRed,
          ),
        );
      }
    }
  }

  String _formatMessageTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays == 0) {
      // Today - show time
      final hour = dateTime.hour > 12 ? dateTime.hour - 12 : dateTime.hour;
      final amPm = dateTime.hour >= 12 ? 'PM' : 'AM';
      return '${hour == 0 ? 12 : hour}:${dateTime.minute.toString().padLeft(2, '0')} $amPm';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else {
      return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
    }
  }
}
