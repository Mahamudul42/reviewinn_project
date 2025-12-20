import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../config/app_theme.dart';
import '../models/notification_model.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<AppNotification> _allNotifications = [];
  List<AppNotification> _unreadNotifications = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadNotifications();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _loadNotifications() {
    // Mock notifications data
    final now = DateTime.now();
    _allNotifications = [
      AppNotification(
        notificationId: 1,
        type: NotificationType.comment,
        title: 'New Comment',
        message: 'Sarah Johnson commented on your review: "Great review! I had a similar experience."',
        actorName: 'Sarah Johnson',
        actorAvatar: 'https://i.pravatar.cc/150?img=1',
        relatedId: 123,
        isRead: false,
        createdAt: now.subtract(const Duration(hours: 2)),
      ),
      AppNotification(
        notificationId: 2,
        type: NotificationType.like,
        title: 'Review Liked',
        message: 'Michael Chen and 3 others liked your review',
        actorName: 'Michael Chen',
        actorAvatar: 'https://i.pravatar.cc/150?img=3',
        relatedId: 123,
        isRead: false,
        createdAt: now.subtract(const Duration(hours: 5)),
      ),
      AppNotification(
        notificationId: 3,
        type: NotificationType.follow,
        title: 'New Follower',
        message: 'Emily Davis started following you',
        actorName: 'Emily Davis',
        actorAvatar: 'https://i.pravatar.cc/150?img=5',
        isRead: true,
        createdAt: now.subtract(const Duration(days: 1)),
      ),
      AppNotification(
        notificationId: 4,
        type: NotificationType.groupInvite,
        title: 'Group Invitation',
        message: 'You were invited to join "Tech Reviewers" group',
        actorName: 'Alex Kim',
        actorAvatar: 'https://i.pravatar.cc/150?img=8',
        relatedId: 456,
        isRead: true,
        createdAt: now.subtract(const Duration(days: 2)),
      ),
      AppNotification(
        notificationId: 5,
        type: NotificationType.mention,
        title: 'Mentioned in Comment',
        message: 'James Wilson mentioned you in a comment',
        actorName: 'James Wilson',
        actorAvatar: 'https://i.pravatar.cc/150?img=12',
        relatedId: 789,
        isRead: true,
        createdAt: now.subtract(const Duration(days: 3)),
      ),
      AppNotification(
        notificationId: 6,
        type: NotificationType.entityUpdate,
        title: 'Entity Update',
        message: 'Tesla Model 3 has a new review',
        imageUrl: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400',
        relatedId: 321,
        isRead: true,
        createdAt: now.subtract(const Duration(days: 5)),
      ),
      AppNotification(
        notificationId: 7,
        type: NotificationType.system,
        title: 'Welcome to ReviewInn!',
        message: 'Start sharing your experiences and help others make better decisions.',
        isRead: true,
        createdAt: now.subtract(const Duration(days: 7)),
      ),
    ];

    _unreadNotifications = _allNotifications.where((n) => !n.isRead).toList();
    setState(() {});
  }

  void _markAsRead(AppNotification notification) {
    setState(() {
      final index = _allNotifications.indexWhere((n) => n.notificationId == notification.notificationId);
      if (index != -1) {
        _allNotifications[index] = AppNotification(
          notificationId: notification.notificationId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          imageUrl: notification.imageUrl,
          actorName: notification.actorName,
          actorAvatar: notification.actorAvatar,
          relatedId: notification.relatedId,
          isRead: true,
          createdAt: notification.createdAt,
        );
        _unreadNotifications = _allNotifications.where((n) => !n.isRead).toList();
      }
    });
  }

  void _markAllAsRead() {
    setState(() {
      _allNotifications = _allNotifications.map((n) => AppNotification(
        notificationId: n.notificationId,
        type: n.type,
        title: n.title,
        message: n.message,
        imageUrl: n.imageUrl,
        actorName: n.actorName,
        actorAvatar: n.actorAvatar,
        relatedId: n.relatedId,
        isRead: true,
        createdAt: n.createdAt,
      )).toList();
      _unreadNotifications.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppTheme.primaryPurple,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Notifications',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          if (_unreadNotifications.isNotEmpty)
            TextButton(
              onPressed: _markAllAsRead,
              child: Text(
                'Mark all read',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                ),
              ),
            ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          labelStyle: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
          tabs: [
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('All'),
                  if (_allNotifications.isNotEmpty) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${_allNotifications.length}',
                        style: TextStyle(fontSize: 12),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Unread'),
                  if (_unreadNotifications.isNotEmpty) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppTheme.errorRed,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${_unreadNotifications.length}',
                        style: TextStyle(fontSize: 12),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildNotificationList(_allNotifications),
          _buildNotificationList(_unreadNotifications),
        ],
      ),
    );
  }

  Widget _buildNotificationList(List<AppNotification> notifications) {
    if (notifications.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: AppTheme.primaryPurpleLight.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.notifications_none_rounded,
                size: 64,
                color: AppTheme.primaryPurple.withOpacity(0.5),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'No notifications',
              style: AppTheme.headingMedium.copyWith(
                color: AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'You\'re all caught up!',
              style: AppTheme.bodyMedium.copyWith(
                color: AppTheme.textTertiary,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(AppTheme.spaceM),
      itemCount: notifications.length,
      itemBuilder: (context, index) {
        return _buildNotificationItem(notifications[index]);
      },
    );
  }

  Widget _buildNotificationItem(AppNotification notification) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppTheme.spaceM),
      decoration: BoxDecoration(
        color: notification.isRead 
            ? Colors.white 
            : AppTheme.primaryPurpleLight.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: notification.isRead 
              ? AppTheme.borderLight 
              : AppTheme.primaryPurple.withOpacity(0.2),
          width: notification.isRead ? 1 : 2,
        ),
        boxShadow: notification.isRead
            ? []
            : [
                BoxShadow(
                  color: AppTheme.primaryPurple.withOpacity(0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
      ),
      child: InkWell(
        onTap: () {
          if (!notification.isRead) {
            _markAsRead(notification);
          }
          // Navigate to related content based on notification type
          _handleNotificationTap(notification);
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(AppTheme.spaceM),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Avatar or Icon
              _buildNotificationIcon(notification),
              const SizedBox(width: AppTheme.spaceM),
              
              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            notification.title,
                            style: AppTheme.labelMedium.copyWith(
                              fontWeight: notification.isRead 
                                  ? FontWeight.w600 
                                  : FontWeight.bold,
                            ),
                          ),
                        ),
                        Text(
                          notification.getTimeAgo(),
                          style: AppTheme.bodySmall.copyWith(
                            color: AppTheme.textTertiary,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      notification.message,
                      style: AppTheme.bodyMedium.copyWith(
                        color: AppTheme.textSecondary,
                        height: 1.4,
                      ),
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              
              // Unread indicator
              if (!notification.isRead) ...[
                const SizedBox(width: AppTheme.spaceS),
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryPurple,
                    shape: BoxShape.circle,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNotificationIcon(AppNotification notification) {
    IconData iconData;
    Color iconColor;

    switch (notification.type) {
      case NotificationType.comment:
        iconData = Icons.comment_rounded;
        iconColor = AppTheme.infoBlue;
        break;
      case NotificationType.like:
        iconData = Icons.favorite_rounded;
        iconColor = AppTheme.errorRed;
        break;
      case NotificationType.follow:
        iconData = Icons.person_add_rounded;
        iconColor = AppTheme.successGreen;
        break;
      case NotificationType.groupInvite:
        iconData = Icons.group_add_rounded;
        iconColor = AppTheme.primaryPurple;
        break;
      case NotificationType.mention:
        iconData = Icons.alternate_email_rounded;
        iconColor = AppTheme.accentYellow;
        break;
      case NotificationType.entityUpdate:
        iconData = Icons.update_rounded;
        iconColor = AppTheme.infoBlue;
        break;
      case NotificationType.system:
        iconData = Icons.info_rounded;
        iconColor = AppTheme.textSecondary;
        break;
    }

    if (notification.actorAvatar != null) {
      return Stack(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: AppTheme.borderLight,
            backgroundImage: CachedNetworkImageProvider(notification.actorAvatar!),
          ),
          Positioned(
            bottom: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: iconColor,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
              ),
              child: Icon(
                iconData,
                size: 12,
                color: Colors.white,
              ),
            ),
          ),
        ],
      );
    }

    if (notification.imageUrl != null) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: CachedNetworkImage(
          imageUrl: notification.imageUrl!,
          width: 48,
          height: 48,
          fit: BoxFit.cover,
          placeholder: (context, url) => Container(
            color: AppTheme.borderLight,
          ),
          errorWidget: (context, url, error) => Container(
            color: AppTheme.borderLight,
            child: Icon(iconData, color: iconColor),
          ),
        ),
      );
    }

    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: iconColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(
        iconData,
        color: iconColor,
        size: 24,
      ),
    );
  }

  void _handleNotificationTap(AppNotification notification) {
    // Navigate based on notification type
    // This would navigate to the actual review, profile, group, etc.
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Opening ${notification.type.toString().split('.').last}...'),
        duration: const Duration(seconds: 1),
      ),
    );
  }
}
