import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../config/app_theme.dart';
import '../models/message_models.dart';
import '../services/mock_messaging_service.dart';
import 'chat_screen.dart';

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  final MockMessagingService _messagingService = MockMessagingService();
  final TextEditingController _searchController = TextEditingController();

  List<Conversation> _conversations = [];
  List<Conversation> _filteredConversations = [];
  bool _isLoading = true;
  String? _error;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadConversations();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadConversations() async {
    setState(() => _isLoading = true);

    try {
      // Using mock service - no token needed
      final conversations = await _messagingService.getConversations('mock_token');
      setState(() {
        _conversations = conversations;
        _filteredConversations = conversations;
        _isLoading = false;
        _error = null;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = 'Failed to load conversations';
      });
    }
  }

  void _filterConversations(String query) {
    setState(() {
      _searchQuery = query;
      if (query.isEmpty) {
        _filteredConversations = _conversations;
      } else {
        _filteredConversations = _conversations.where((conversation) {
          return conversation.otherUser.name
                  .toLowerCase()
                  .contains(query.toLowerCase()) ||
              (conversation.otherUser.username?.toLowerCase() ?? '')
                  .contains(query.toLowerCase()) ||
              (conversation.lastMessage?.content.toLowerCase() ?? '')
                  .contains(query.toLowerCase());
        }).toList();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppTheme.infoBlue.withOpacity(0.05),
              AppTheme.backgroundWhite,
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header
              _buildHeader(),

              // Search Bar
              _buildSearchBar(),

              // Conversations List
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : _error != null
                        ? _buildError()
                        : _filteredConversations.isEmpty
                            ? _buildEmptyState()
                            : _buildConversationsList(),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // TODO: Navigate to new message screen
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('New message feature coming soon'),
            ),
          );
        },
        backgroundColor: AppTheme.infoBlue,
        child: Icon(Icons.edit, color: Colors.white),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spaceL),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(
            color: AppTheme.borderLight,
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [AppTheme.infoBlue, AppTheme.infoBlue.withOpacity(0.7)],
              ),
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.infoBlue.withOpacity(0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Icon(
              Icons.forum_rounded,
              color: Colors.white,
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Messages',
                style: AppTheme.headingMedium.copyWith(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary,
                ),
              ),
              if (_conversations.isNotEmpty)
                Text(
                  '${_conversations.length} conversation${_conversations.length > 1 ? 's' : ''}',
                  style: AppTheme.bodySmall.copyWith(
                    color: AppTheme.textSecondary,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(
        AppTheme.spaceL,
        AppTheme.spaceM,
        AppTheme.spaceL,
        AppTheme.spaceM,
      ),
      child: TextField(
        controller: _searchController,
        onChanged: _filterConversations,
        decoration: InputDecoration(
          hintText: 'Search conversations...',
          prefixIcon: Icon(
            Icons.search,
            color: AppTheme.textTertiary,
          ),
          suffixIcon: _searchQuery.isNotEmpty
              ? IconButton(
                  icon: Icon(
                    Icons.clear,
                    color: AppTheme.textTertiary,
                  ),
                  onPressed: () {
                    _searchController.clear();
                    _filterConversations('');
                  },
                )
              : null,
          filled: true,
          fillColor: AppTheme.backgroundLight,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: AppTheme.spaceL,
            vertical: AppTheme.spaceM,
          ),
        ),
      ),
    );
  }

  Widget _buildConversationsList() {
    return RefreshIndicator(
      onRefresh: _loadConversations,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: AppTheme.spaceS),
        itemCount: _filteredConversations.length,
        itemBuilder: (context, index) {
          final conversation = _filteredConversations[index];
          return _buildConversationCard(conversation);
        },
      ),
    );
  }

  Widget _buildConversationCard(Conversation conversation) {
    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ChatScreen(
              conversation: conversation,
            ),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppTheme.spaceL,
          vertical: AppTheme.spaceM,
        ),
        decoration: BoxDecoration(
          color: conversation.unreadCount > 0
              ? AppTheme.infoBlue.withOpacity(0.05)
              : Colors.white,
          border: Border(
            bottom: BorderSide(
              color: AppTheme.borderLight.withOpacity(0.5),
              width: 0.5,
            ),
          ),
        ),
        child: Row(
          children: [
            // Avatar with online indicator
            Stack(
              children: [
                Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: conversation.unreadCount > 0
                          ? AppTheme.infoBlue
                          : AppTheme.borderLight,
                      width: 2,
                    ),
                  ),
                  child: ClipOval(
                    child: conversation.otherUser.avatar != null
                        ? CachedNetworkImage(
                            imageUrl: conversation.otherUser.avatar!,
                            width: 56,
                            height: 56,
                            fit: BoxFit.cover,
                            placeholder: (context, url) => Container(
                              width: 56,
                              height: 56,
                              color: AppTheme.backgroundLight,
                              child: Center(
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: AppTheme.infoBlue,
                                ),
                              ),
                            ),
                            errorWidget: (context, url, error) => Container(
                              width: 56,
                              height: 56,
                              color: AppTheme.infoBlue.withOpacity(0.1),
                              child: Icon(
                                Icons.person,
                                size: 28,
                                color: AppTheme.infoBlue,
                              ),
                            ),
                          )
                        : Container(
                            width: 56,
                            height: 56,
                            color: AppTheme.infoBlue.withOpacity(0.1),
                            child: Icon(
                              Icons.person,
                              size: 28,
                              color: AppTheme.infoBlue,
                            ),
                          ),
                  ),
                ),
                if (conversation.isOnline)
                  Positioned(
                    right: 2,
                    bottom: 2,
                    child: Container(
                      width: 14,
                      height: 14,
                      decoration: BoxDecoration(
                        color: AppTheme.successGreen,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: Colors.white,
                          width: 2,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: AppTheme.spaceM),

            // Conversation Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          conversation.otherUser.name,
                          style: AppTheme.labelMedium.copyWith(
                            fontSize: 16,
                            fontWeight: conversation.unreadCount > 0
                                ? FontWeight.w700
                                : FontWeight.w600,
                            color: AppTheme.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _formatTime(conversation.updatedAt),
                        style: AppTheme.bodySmall.copyWith(
                          color: conversation.unreadCount > 0
                              ? AppTheme.infoBlue
                              : AppTheme.textTertiary,
                          fontWeight: conversation.unreadCount > 0
                              ? FontWeight.w600
                              : FontWeight.normal,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          conversation.lastMessage?.content ?? 'No messages yet',
                          style: AppTheme.bodyMedium.copyWith(
                            color: conversation.unreadCount > 0
                                ? AppTheme.textPrimary
                                : AppTheme.textSecondary,
                            fontWeight: conversation.unreadCount > 0
                                ? FontWeight.w600
                                : FontWeight.normal,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (conversation.unreadCount > 0) ...[
                        const SizedBox(width: 8),
                        Container(
                          constraints: const BoxConstraints(minWidth: 20),
                          height: 20,
                          padding: const EdgeInsets.symmetric(horizontal: 6),
                          decoration: BoxDecoration(
                            color: AppTheme.infoBlue,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Center(
                            child: Text(
                              conversation.unreadCount > 99
                                  ? '99+'
                                  : conversation.unreadCount.toString(),
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
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
                Icons.forum_outlined,
                size: 64,
                color: AppTheme.infoBlue.withOpacity(0.5),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              _searchQuery.isEmpty ? 'No Messages Yet' : 'No Results Found',
              style: AppTheme.headingMedium,
            ),
            const SizedBox(height: 12),
            Text(
              _searchQuery.isEmpty
                  ? 'Start a conversation with reviewers\nand community members'
                  : 'Try searching with different keywords',
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
            Text(
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
              onPressed: _loadConversations,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.infoBlue,
                foregroundColor: Colors.white,
              ),
              child: Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays == 0) {
      // Today - show time
      return '${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else {
      return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
    }
  }
}
