class Comment {
  final int commentId;
  final String content;
  final int userId;
  final String username;
  final String? userAvatar;
  final int? parentCommentId;
  final int likesCount;
  final bool isLiked;
  final DateTime createdAt;
  final DateTime? updatedAt;

  Comment({
    required this.commentId,
    required this.content,
    required this.userId,
    required this.username,
    this.userAvatar,
    this.parentCommentId,
    this.likesCount = 0,
    this.isLiked = false,
    required this.createdAt,
    this.updatedAt,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      commentId: json['comment_id'] ?? json['id'] ?? 0,
      content: json['content'] ?? '',
      userId: json['user_id'] ?? 0,
      username: json['username'] ?? json['user']?['name'] ?? 'Anonymous',
      userAvatar: json['user_avatar'] ?? json['user']?['avatar'],
      parentCommentId: json['parent_comment_id'],
      likesCount: json['likes_count'] ?? 0,
      isLiked: json['is_liked'] ?? false,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'comment_id': commentId,
      'content': content,
      'user_id': userId,
      'username': username,
      'user_avatar': userAvatar,
      'parent_comment_id': parentCommentId,
      'likes_count': likesCount,
      'is_liked': isLiked,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }
}
