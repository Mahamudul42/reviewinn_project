class User {
  final int userId;
  final String username;
  final String? email;
  final String? fullName;
  final String? avatar;
  final String? bio;
  final int? reviewCount;
  final int? followersCount;
  final int? followingCount;
  final bool? isFollowing;
  final DateTime? joinedAt;

  User({
    required this.userId,
    required this.username,
    this.email,
    this.fullName,
    this.avatar,
    this.bio,
    this.reviewCount,
    this.followersCount,
    this.followingCount,
    this.isFollowing,
    this.joinedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      userId: json['user_id'] ?? json['id'] ?? 0,
      username: json['username'] ?? '',
      email: json['email'],
      fullName: json['full_name'] ?? json['fullName'],
      avatar: json['avatar'],
      bio: json['bio'],
      reviewCount: json['review_count'] ?? 0,
      followersCount: json['followers_count'] ?? 0,
      followingCount: json['following_count'] ?? 0,
      isFollowing: json['is_following'],
      joinedAt: json['joined_at'] != null || json['created_at'] != null
          ? DateTime.parse(json['joined_at'] ?? json['created_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user_id': userId,
      'username': username,
      'email': email,
      'full_name': fullName,
      'avatar': avatar,
      'bio': bio,
      'review_count': reviewCount,
      'followers_count': followersCount,
      'following_count': followingCount,
      'is_following': isFollowing,
      'joined_at': joinedAt?.toIso8601String(),
    };
  }
}
