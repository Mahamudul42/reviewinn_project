enum NotificationType {
  comment,
  like,
  follow,
  groupInvite,
  mention,
  entityUpdate,
  system,
}

class AppNotification {
  final int notificationId;
  final NotificationType type;
  final String title;
  final String message;
  final String? imageUrl;
  final String? actorName;
  final String? actorAvatar;
  final int? relatedId; // review_id, entity_id, etc.
  final bool isRead;
  final DateTime createdAt;

  AppNotification({
    required this.notificationId,
    required this.type,
    required this.title,
    required this.message,
    this.imageUrl,
    this.actorName,
    this.actorAvatar,
    this.relatedId,
    this.isRead = false,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      notificationId: json['notification_id'] ?? json['id'] ?? 0,
      type: _parseNotificationType(json['type'] ?? 'system'),
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      imageUrl: json['image_url'],
      actorName: json['actor_name'],
      actorAvatar: json['actor_avatar'],
      relatedId: json['related_id'],
      isRead: json['is_read'] ?? false,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
    );
  }

  static NotificationType _parseNotificationType(String type) {
    switch (type.toLowerCase()) {
      case 'comment':
        return NotificationType.comment;
      case 'like':
        return NotificationType.like;
      case 'follow':
        return NotificationType.follow;
      case 'group_invite':
        return NotificationType.groupInvite;
      case 'mention':
        return NotificationType.mention;
      case 'entity_update':
        return NotificationType.entityUpdate;
      default:
        return NotificationType.system;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'notification_id': notificationId,
      'type': type.toString().split('.').last,
      'title': title,
      'message': message,
      'image_url': imageUrl,
      'actor_name': actorName,
      'actor_avatar': actorAvatar,
      'related_id': relatedId,
      'is_read': isRead,
      'created_at': createdAt.toIso8601String(),
    };
  }

  String getTimeAgo() {
    final now = DateTime.now();
    final difference = now.difference(createdAt);

    if (difference.inDays > 30) {
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
}
