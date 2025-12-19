class Entity {
  final int entityId;
  final String name;
  final String? description;
  final double? averageRating;
  final int? reviewCount;
  final String? avatar;
  final List<String>? images;
  final String? categoryName;
  final String? rootCategoryName;
  final int? rootCategoryId;
  final String? rootCategoryIcon;
  final String? finalCategoryName;
  final int? finalCategoryId;
  final String? finalCategoryIcon;
  final List<String>? tags;
  final bool? isFollowing;
  final DateTime? createdAt;

  Entity({
    required this.entityId,
    required this.name,
    this.description,
    this.averageRating,
    this.reviewCount,
    this.avatar,
    this.images,
    this.categoryName,
    this.rootCategoryName,
    this.rootCategoryId,
    this.rootCategoryIcon,
    this.finalCategoryName,
    this.finalCategoryId,
    this.finalCategoryIcon,
    this.tags,
    this.isFollowing,
    this.createdAt,
  });

  factory Entity.fromJson(Map<String, dynamic> json) {
    // Handle root category - check both object and string fields
    String? rootCategoryName;
    int? rootCategoryId;
    String? rootCategoryIcon;

    if (json['root_category'] != null && json['root_category'] is Map) {
      rootCategoryName = json['root_category']['name'];
      rootCategoryId = json['root_category']['id'];
      rootCategoryIcon = json['root_category']['icon'];
    } else {
      rootCategoryName = json['root_category_name'];
      rootCategoryId = json['root_category_id'];
      rootCategoryIcon = json['root_category_icon'];
    }

    // Handle final category - check both object and string fields
    String? finalCategoryName;
    int? finalCategoryId;
    String? finalCategoryIcon;

    if (json['final_category'] != null && json['final_category'] is Map) {
      finalCategoryName = json['final_category']['name'];
      finalCategoryId = json['final_category']['id'];
      finalCategoryIcon = json['final_category']['icon'];
    } else {
      finalCategoryName = json['final_category_name'];
      finalCategoryId = json['final_category_id'];
      finalCategoryIcon = json['final_category_icon'];
    }

    return Entity(
      entityId: json['entity_id'] ?? json['id'] ?? 0,
      name: json['name'] ?? '',
      description: json['description'],
      averageRating: json['average_rating']?.toDouble(),
      reviewCount: json['review_count'] ?? 0,
      avatar: json['avatar'],
      images: json['images'] != null ? List<String>.from(json['images']) : null,
      categoryName: json['category_name'],
      rootCategoryName: rootCategoryName,
      rootCategoryId: rootCategoryId,
      rootCategoryIcon: rootCategoryIcon,
      finalCategoryName: finalCategoryName,
      finalCategoryId: finalCategoryId,
      finalCategoryIcon: finalCategoryIcon,
      tags: json['tags'] != null ? List<String>.from(json['tags']) : null,
      isFollowing: json['is_following'],
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'entity_id': entityId,
      'name': name,
      'description': description,
      'average_rating': averageRating,
      'review_count': reviewCount,
      'avatar': avatar,
      'images': images,
      'category_name': categoryName,
      'root_category_name': rootCategoryName,
      'root_category_id': rootCategoryId,
      'root_category_icon': rootCategoryIcon,
      'final_category_name': finalCategoryName,
      'final_category_id': finalCategoryId,
      'final_category_icon': finalCategoryIcon,
      'tags': tags,
      'is_following': isFollowing,
      'created_at': createdAt?.toIso8601String(),
    };
  }
}
