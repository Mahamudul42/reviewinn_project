// Circle-related models for ReviewInn mobile app

enum TrustLevel {
  reviewer,
  trustedReviewer,
  reviewAlly,
  reviewMentor,
}

extension TrustLevelExtension on TrustLevel {
  String get displayName {
    switch (this) {
      case TrustLevel.reviewer:
        return 'Reviewer';
      case TrustLevel.trustedReviewer:
        return 'Trusted Reviewer';
      case TrustLevel.reviewAlly:
        return 'Review Ally';
      case TrustLevel.reviewMentor:
        return 'Review Mentor';
    }
  }

  String get apiValue {
    switch (this) {
      case TrustLevel.reviewer:
        return 'REVIEWER';
      case TrustLevel.trustedReviewer:
        return 'TRUSTED_REVIEWER';
      case TrustLevel.reviewAlly:
        return 'REVIEW_ALLY';
      case TrustLevel.reviewMentor:
        return 'REVIEW_MENTOR';
    }
  }

  static TrustLevel fromString(String value) {
    switch (value.toUpperCase()) {
      case 'REVIEWER':
        return TrustLevel.reviewer;
      case 'TRUSTED_REVIEWER':
        return TrustLevel.trustedReviewer;
      case 'REVIEW_ALLY':
        return TrustLevel.reviewAlly;
      case 'REVIEW_MENTOR':
        return TrustLevel.reviewMentor;
      default:
        return TrustLevel.reviewer;
    }
  }
}

class CircleUser {
  final String id;
  final String name;
  final String? username;
  final String? avatar;
  final String? email;

  CircleUser({
    required this.id,
    required this.name,
    this.username,
    this.avatar,
    this.email,
  });

  factory CircleUser.fromJson(Map<String, dynamic> json) {
    return CircleUser(
      id: (json['id'] ?? json['user_id'] ?? '').toString(),
      name: json['name'] ?? '',
      username: json['username'],
      avatar: json['avatar'],
      email: json['email'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'username': username,
      'avatar': avatar,
      'email': email,
    };
  }
}

class CircleMember {
  final String connectionId;
  final CircleUser user;
  final TrustLevel trustLevel;
  final double tasteMatchScore;
  final int interactionCount;
  final DateTime connectedSince;

  CircleMember({
    required this.connectionId,
    required this.user,
    required this.trustLevel,
    required this.tasteMatchScore,
    required this.interactionCount,
    required this.connectedSince,
  });

  factory CircleMember.fromJson(Map<String, dynamic> json) {
    return CircleMember(
      connectionId: json['connection_id']?.toString() ?? '',
      user: CircleUser.fromJson(json['user'] ?? {}),
      trustLevel: TrustLevelExtension.fromString(json['trust_level'] ?? 'REVIEWER'),
      tasteMatchScore: (json['taste_match_score'] ?? 0.0).toDouble(),
      interactionCount: json['interaction_count'] ?? 0,
      connectedSince: json['connected_since'] != null
          ? DateTime.parse(json['connected_since'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'connection_id': connectionId,
      'user': user.toJson(),
      'trust_level': trustLevel.apiValue,
      'taste_match_score': tasteMatchScore,
      'interaction_count': interactionCount,
      'connected_since': connectedSince.toIso8601String(),
    };
  }
}

class CircleInvite {
  final String inviteId;
  final CircleUser sender;
  final String message;
  final DateTime createdAt;

  CircleInvite({
    required this.inviteId,
    required this.sender,
    required this.message,
    required this.createdAt,
  });

  factory CircleInvite.fromJson(Map<String, dynamic> json) {
    return CircleInvite(
      inviteId: json['invite_id']?.toString() ?? json['id']?.toString() ?? '',
      sender: CircleUser.fromJson(json['sender'] ?? json['from_user'] ?? {}),
      message: json['message'] ?? '',
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'invite_id': inviteId,
      'sender': sender.toJson(),
      'message': message,
      'created_at': createdAt.toIso8601String(),
    };
  }
}

enum RequestStatus {
  pending,
  accepted,
  rejected,
}

extension RequestStatusExtension on RequestStatus {
  String get apiValue {
    switch (this) {
      case RequestStatus.pending:
        return 'pending';
      case RequestStatus.accepted:
        return 'accepted';
      case RequestStatus.rejected:
        return 'rejected';
    }
  }

  static RequestStatus fromString(String value) {
    switch (value.toLowerCase()) {
      case 'pending':
        return RequestStatus.pending;
      case 'accepted':
        return RequestStatus.accepted;
      case 'rejected':
        return RequestStatus.rejected;
      default:
        return RequestStatus.pending;
    }
  }
}

class CircleRequest {
  final String requestId;
  final CircleUser user; // recipient or sender depending on context
  final String message;
  final RequestStatus status;
  final DateTime createdAt;

  CircleRequest({
    required this.requestId,
    required this.user,
    required this.message,
    required this.status,
    required this.createdAt,
  });

  factory CircleRequest.fromJson(Map<String, dynamic> json) {
    return CircleRequest(
      requestId: json['request_id']?.toString() ?? json['id']?.toString() ?? '',
      user: CircleUser.fromJson(
        json['recipient'] ?? json['sender'] ?? json['user'] ?? json['target_user'] ?? {},
      ),
      message: json['message'] ?? '',
      status: RequestStatusExtension.fromString(json['status'] ?? 'pending'),
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'request_id': requestId,
      'user': user.toJson(),
      'message': message,
      'status': status.apiValue,
      'created_at': createdAt.toIso8601String(),
    };
  }
}

class CircleSuggestion {
  final CircleUser user;
  final String reason;
  final int mutualFriends;
  final double tasteMatchScore;

  CircleSuggestion({
    required this.user,
    required this.reason,
    required this.mutualFriends,
    required this.tasteMatchScore,
  });

  factory CircleSuggestion.fromJson(Map<String, dynamic> json) {
    return CircleSuggestion(
      user: CircleUser.fromJson(json['user'] ?? {}),
      reason: json['reason'] ?? 'Suggested for you',
      mutualFriends: json['mutual_friends'] ?? 0,
      tasteMatchScore: (json['taste_match_score'] ?? 0.0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user': user.toJson(),
      'reason': reason,
      'mutual_friends': mutualFriends,
      'taste_match_score': tasteMatchScore,
    };
  }
}
