class Review {
  final int reviewId;
  final String title;
  final String? content;
  final double rating;
  final int? userId;
  final String? username;
  final String? userAvatar;
  final int? entityId;
  final String? entityName;
  final String? entityAvatar;
  final String? entityRootCategoryName;
  final int? entityRootCategoryId;
  final String? entityRootCategoryIcon;
  final String? entityFinalCategoryName;
  final int? entityFinalCategoryId;
  final String? entityFinalCategoryIcon;
  final int? entityReviewCount;
  final double? entityAverageRating;
  final List<String>? images;
  final int? likesCount;
  final int? commentsCount;
  final int? helpfulCount;
  final int? viewCount;
  final bool? isLiked;
  final bool? isHelpful;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final List<String>? pros;
  final List<String>? cons;
  // Group-related fields
  final int? groupId;
  final String? groupName;
  final String? groupAvatar;
  final String? reviewScope; // "public", "group_only", or "mixed"

  Review({
    required this.reviewId,
    required this.title,
    this.content,
    required this.rating,
    this.userId,
    this.username,
    this.userAvatar,
    this.entityId,
    this.entityName,
    this.entityAvatar,
    this.entityRootCategoryName,
    this.entityRootCategoryId,
    this.entityRootCategoryIcon,
    this.entityFinalCategoryName,
    this.entityFinalCategoryId,
    this.entityFinalCategoryIcon,
    this.entityReviewCount,
    this.entityAverageRating,
    this.images,
    this.likesCount,
    this.commentsCount,
    this.helpfulCount,
    this.viewCount,
    this.isLiked,
    this.isHelpful,
    this.createdAt,
    this.updatedAt,
    this.pros,
    this.cons,
    this.groupId,
    this.groupName,
    this.groupAvatar,
    this.reviewScope,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    // Parse entity category data - support both nested objects and flat fields
    String? entityRootCategoryName;
    int? entityRootCategoryId;
    String? entityRootCategoryIcon;
    String? entityFinalCategoryName;
    int? entityFinalCategoryId;
    String? entityFinalCategoryIcon;

    // Check if entity data is provided as nested object
    if (json['entity'] != null && json['entity'] is Map) {
      final entity = json['entity'];
      if (entity['root_category'] != null && entity['root_category'] is Map) {
        entityRootCategoryName = entity['root_category']['name'];
        entityRootCategoryId = entity['root_category']['id'];
        entityRootCategoryIcon = entity['root_category']['icon'];
      } else {
        entityRootCategoryName = entity['root_category_name'];
        entityRootCategoryId = entity['root_category_id'];
        entityRootCategoryIcon = entity['root_category_icon'];
      }

      if (entity['final_category'] != null && entity['final_category'] is Map) {
        entityFinalCategoryName = entity['final_category']['name'];
        entityFinalCategoryId = entity['final_category']['id'];
        entityFinalCategoryIcon = entity['final_category']['icon'];
      } else {
        entityFinalCategoryName = entity['final_category_name'];
        entityFinalCategoryId = entity['final_category_id'];
        entityFinalCategoryIcon = entity['final_category_icon'];
      }
    } else {
      // Use flat fields
      entityRootCategoryName = json['entity_root_category_name'];
      entityRootCategoryId = json['entity_root_category_id'];
      entityRootCategoryIcon = json['entity_root_category_icon'];
      entityFinalCategoryName = json['entity_final_category_name'];
      entityFinalCategoryId = json['entity_final_category_id'];
      entityFinalCategoryIcon = json['entity_final_category_icon'];
    }

    int? entityReviewCount;
    double? entityAverageRating;
    if (json['entity'] != null && json['entity'] is Map) {
      entityReviewCount = json['entity']['review_count'];
      entityAverageRating = json['entity']['average_rating']?.toDouble();
    } else {
      entityReviewCount = json['entity_review_count'];
      entityAverageRating = json['entity_average_rating']?.toDouble();
    }

    // Parse group data - support both nested objects and flat fields
    int? groupId;
    String? groupName;
    String? groupAvatar;
    String? reviewScope;

    if (json['group'] != null && json['group'] is Map) {
      groupId = json['group']['group_id'];
      groupName = json['group']['name'];
      groupAvatar = json['group']['avatar'];
    } else {
      groupId = json['group_id'];
      groupName = json['group_name'];
      groupAvatar = json['group_avatar'];
    }
    reviewScope = json['review_scope'] ?? 'public';

    return Review(
      reviewId: json['review_id'] ?? json['id'] ?? 0,
      title: json['title'] ?? '',
      content: json['content'],
      rating: json['rating']?.toDouble() ?? 0.0,
      userId: json['user_id'],
      username: json['username'] ?? json['user_name'],
      userAvatar: json['user_avatar'],
      entityId: json['entity_id'],
      entityName: json['entity_name'],
      entityAvatar: json['entity_avatar'],
      entityRootCategoryName: entityRootCategoryName,
      entityRootCategoryId: entityRootCategoryId,
      entityRootCategoryIcon: entityRootCategoryIcon,
      entityFinalCategoryName: entityFinalCategoryName,
      entityFinalCategoryId: entityFinalCategoryId,
      entityFinalCategoryIcon: entityFinalCategoryIcon,
      entityReviewCount: entityReviewCount,
      entityAverageRating: entityAverageRating,
      images: json['images'] != null ? List<String>.from(json['images']) : null,
      likesCount: json['likes_count'] ?? 0,
      commentsCount: json['comments_count'] ?? 0,
      helpfulCount: json['helpful_count'] ?? 0,
      viewCount: json['view_count'] ?? 0,
      isLiked: json['is_liked'] ?? false,
      isHelpful: json['is_helpful'] ?? false,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
      pros: json['pros'] != null ? List<String>.from(json['pros']) : null,
      cons: json['cons'] != null ? List<String>.from(json['cons']) : null,
      groupId: groupId,
      groupName: groupName,
      groupAvatar: groupAvatar,
      reviewScope: reviewScope,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'review_id': reviewId,
      'title': title,
      'content': content,
      'rating': rating,
      'user_id': userId,
      'username': username,
      'user_avatar': userAvatar,
      'entity_id': entityId,
      'entity_name': entityName,
      'entity_avatar': entityAvatar,
      'entity_root_category_name': entityRootCategoryName,
      'entity_root_category_id': entityRootCategoryId,
      'entity_root_category_icon': entityRootCategoryIcon,
      'entity_final_category_name': entityFinalCategoryName,
      'entity_final_category_id': entityFinalCategoryId,
      'entity_final_category_icon': entityFinalCategoryIcon,
      'entity_review_count': entityReviewCount,
      'entity_average_rating': entityAverageRating,
      'images': images,
      'likes_count': likesCount,
      'comments_count': commentsCount,
      'view_count': viewCount,
      'is_liked': isLiked,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
      'pros': pros,
      'cons': cons,
      'group_id': groupId,
      'group_name': groupName,
      'group_avatar': groupAvatar,
      'review_scope': reviewScope,
    };
  }
}
