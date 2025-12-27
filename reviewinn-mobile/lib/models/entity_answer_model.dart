import 'package:flutter/material.dart';

// Enum for vote status
enum VoteStatus {
  none,
  upvoted,
  downvoted,
}

// Extension for VoteStatus enum
extension VoteStatusExtension on VoteStatus {
  String get displayName {
    switch (this) {
      case VoteStatus.none:
        return 'None';
      case VoteStatus.upvoted:
        return 'Upvoted';
      case VoteStatus.downvoted:
        return 'Downvoted';
    }
  }

  IconData get icon {
    switch (this) {
      case VoteStatus.none:
        return Icons.thumb_up_outlined;
      case VoteStatus.upvoted:
        return Icons.thumb_up;
      case VoteStatus.downvoted:
        return Icons.thumb_down;
    }
  }

  String get apiValue {
    switch (this) {
      case VoteStatus.none:
        return 'none';
      case VoteStatus.upvoted:
        return 'upvote';
      case VoteStatus.downvoted:
        return 'downvote';
    }
  }

  static VoteStatus fromString(String value) {
    switch (value.toLowerCase()) {
      case 'upvote':
      case 'up':
      case 'upvoted':
        return VoteStatus.upvoted;
      case 'downvote':
      case 'down':
      case 'downvoted':
        return VoteStatus.downvoted;
      default:
        return VoteStatus.none;
    }
  }
}

class EntityAnswer {
  final int answerId;
  final int questionId;
  final String content;
  final int userId;
  final String username;
  final String? userAvatar;
  final bool isOfficial;
  final String? officialRole;
  final int upvotes;
  final int downvotes;
  final VoteStatus voteStatus;
  final DateTime createdAt;
  final DateTime? updatedAt;

  EntityAnswer({
    required this.answerId,
    required this.questionId,
    required this.content,
    required this.userId,
    required this.username,
    this.userAvatar,
    this.isOfficial = false,
    this.officialRole,
    this.upvotes = 0,
    this.downvotes = 0,
    this.voteStatus = VoteStatus.none,
    required this.createdAt,
    this.updatedAt,
  });

  int get score => upvotes - downvotes;

  factory EntityAnswer.fromJson(Map<String, dynamic> json) {
    return EntityAnswer(
      answerId: json['answer_id'] ?? json['id'] ?? 0,
      questionId: json['question_id'] ?? 0,
      content: json['content'] ?? '',
      userId: json['user_id'] ?? 0,
      username: json['username'] ?? json['user']?['name'] ?? 'Anonymous',
      userAvatar: json['user_avatar'] ?? json['user']?['avatar'],
      isOfficial: json['is_official'] ?? false,
      officialRole: json['official_role'],
      upvotes: json['upvotes'] ?? 0,
      downvotes: json['downvotes'] ?? 0,
      voteStatus: json['vote_status'] != null
          ? VoteStatusExtension.fromString(json['vote_status'].toString())
          : VoteStatus.none,
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
      'answer_id': answerId,
      'question_id': questionId,
      'content': content,
      'user_id': userId,
      'username': username,
      'user_avatar': userAvatar,
      'is_official': isOfficial,
      'official_role': officialRole,
      'upvotes': upvotes,
      'downvotes': downvotes,
      'vote_status': voteStatus.apiValue,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }
}
