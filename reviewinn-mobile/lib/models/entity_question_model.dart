class EntityQuestion {
  final int questionId;
  final String title;
  final String? description;
  final int entityId;
  final String? entityName;
  final int userId;
  final String username;
  final String? userAvatar;
  final int answersCount;
  final int viewCount;
  final bool hasOfficialAnswer;
  final DateTime createdAt;
  final DateTime? updatedAt;

  EntityQuestion({
    required this.questionId,
    required this.title,
    this.description,
    required this.entityId,
    this.entityName,
    required this.userId,
    required this.username,
    this.userAvatar,
    this.answersCount = 0,
    this.viewCount = 0,
    this.hasOfficialAnswer = false,
    required this.createdAt,
    this.updatedAt,
  });

  factory EntityQuestion.fromJson(Map<String, dynamic> json) {
    return EntityQuestion(
      questionId: json['question_id'] ?? json['id'] ?? 0,
      title: json['title'] ?? '',
      description: json['description'],
      entityId: json['entity_id'] ?? 0,
      entityName: json['entity_name'] ?? json['entity']?['name'],
      userId: json['user_id'] ?? 0,
      username: json['username'] ?? json['user']?['name'] ?? 'Anonymous',
      userAvatar: json['user_avatar'] ?? json['user']?['avatar'],
      answersCount: json['answers_count'] ?? 0,
      viewCount: json['view_count'] ?? 0,
      hasOfficialAnswer: json['has_official_answer'] ?? false,
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
      'question_id': questionId,
      'title': title,
      'description': description,
      'entity_id': entityId,
      'entity_name': entityName,
      'user_id': userId,
      'username': username,
      'user_avatar': userAvatar,
      'answers_count': answersCount,
      'view_count': viewCount,
      'has_official_answer': hasOfficialAnswer,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }
}
