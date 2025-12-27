enum PostType { general, group, entity }

extension PostTypeExtension on PostType {
  String get displayName {
    switch (this) {
      case PostType.general:
        return 'Community';
      case PostType.group:
        return 'Group';
      case PostType.entity:
        return 'Entity Q&A';
    }
  }

  String get apiValue {
    switch (this) {
      case PostType.general:
        return 'general';
      case PostType.group:
        return 'group';
      case PostType.entity:
        return 'entity';
    }
  }
}

class CommunityPost {
  final int postId;
  final String title;
  final String content;
  final int userId;
  final String username;
  final String? userAvatar;
  final List<String>? images;
  final List<String>? tags;
  final int likesCount;
  final int commentsCount;
  final int viewCount;
  final bool isLiked;
  final bool isPinned;
  final bool isEdited;
  final DateTime createdAt;
  final DateTime? updatedAt;

  // Post source type
  final PostType postType;

  // Optional linked entity
  final int? entityId;
  final String? entityName;
  final String? entityAvatar;

  // Optional linked group
  final int? groupId;
  final String? groupName;
  final String? groupAvatar;

  CommunityPost({
    required this.postId,
    required this.title,
    required this.content,
    required this.userId,
    required this.username,
    this.userAvatar,
    this.images,
    this.tags,
    this.likesCount = 0,
    this.commentsCount = 0,
    this.viewCount = 0,
    this.isLiked = false,
    this.isPinned = false,
    this.isEdited = false,
    required this.createdAt,
    this.updatedAt,
    this.postType = PostType.general,
    this.entityId,
    this.entityName,
    this.entityAvatar,
    this.groupId,
    this.groupName,
    this.groupAvatar,
  });

  factory CommunityPost.fromJson(Map<String, dynamic> json) {
    PostType type = PostType.general;
    if (json['post_type'] != null) {
      switch (json['post_type']) {
        case 'group':
          type = PostType.group;
          break;
        case 'entity':
          type = PostType.entity;
          break;
        default:
          type = PostType.general;
      }
    }

    return CommunityPost(
      postId: json['post_id'] ?? json['id'] ?? 0,
      title: json['title'] ?? '',
      content: json['content'] ?? '',
      userId: json['user_id'] ?? 0,
      username: json['username'] ?? json['user']?['name'] ?? 'Anonymous',
      userAvatar: json['user_avatar'] ?? json['user']?['avatar'],
      images: json['images'] != null ? List<String>.from(json['images']) : null,
      tags: json['tags'] != null ? List<String>.from(json['tags']) : null,
      likesCount: json['likes_count'] ?? 0,
      commentsCount: json['comments_count'] ?? 0,
      viewCount: json['view_count'] ?? 0,
      isLiked: json['is_liked'] ?? false,
      isPinned: json['is_pinned'] ?? false,
      isEdited: json['is_edited'] ?? false,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
      postType: type,
      entityId: json['entity_id'],
      entityName: json['entity_name'] ?? json['entity']?['name'],
      entityAvatar: json['entity_avatar'] ?? json['entity']?['avatar'],
      groupId: json['group_id'],
      groupName: json['group_name'] ?? json['group']?['name'],
      groupAvatar: json['group_avatar'] ?? json['group']?['avatar'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'post_id': postId,
      'title': title,
      'content': content,
      'user_id': userId,
      'username': username,
      'user_avatar': userAvatar,
      'images': images,
      'tags': tags,
      'likes_count': likesCount,
      'comments_count': commentsCount,
      'view_count': viewCount,
      'is_liked': isLiked,
      'is_pinned': isPinned,
      'is_edited': isEdited,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
      'post_type': postType.apiValue,
      'entity_id': entityId,
      'entity_name': entityName,
      'entity_avatar': entityAvatar,
      'group_id': groupId,
      'group_name': groupName,
      'group_avatar': groupAvatar,
    };
  }
}
