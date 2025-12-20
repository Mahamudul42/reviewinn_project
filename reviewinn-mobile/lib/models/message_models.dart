// Message-related models for ReviewInn mobile app

class MessageUser {
  final String id;
  final String name;
  final String? username;
  final String? avatar;

  MessageUser({
    required this.id,
    required this.name,
    this.username,
    this.avatar,
  });

  factory MessageUser.fromJson(Map<String, dynamic> json) {
    return MessageUser(
      id: (json['id'] ?? json['user_id'] ?? '').toString(),
      name: json['name'] ?? '',
      username: json['username'],
      avatar: json['avatar'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'username': username,
      'avatar': avatar,
    };
  }
}

class Message {
  final String id;
  final String conversationId;
  final String senderId;
  final String content;
  final DateTime createdAt;
  final bool isRead;
  final MessageType type;

  Message({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.content,
    required this.createdAt,
    this.isRead = false,
    this.type = MessageType.text,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['id']?.toString() ?? json['message_id']?.toString() ?? '',
      conversationId: json['conversation_id']?.toString() ?? '',
      senderId: json['sender_id']?.toString() ?? '',
      content: json['content'] ?? json['text'] ?? '',
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
      isRead: json['is_read'] ?? false,
      type: MessageTypeExtension.fromString(json['type'] ?? 'text'),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'conversation_id': conversationId,
      'sender_id': senderId,
      'content': content,
      'created_at': createdAt.toIso8601String(),
      'is_read': isRead,
      'type': type.value,
    };
  }
}

enum MessageType {
  text,
  image,
  file,
}

extension MessageTypeExtension on MessageType {
  String get value {
    switch (this) {
      case MessageType.text:
        return 'text';
      case MessageType.image:
        return 'image';
      case MessageType.file:
        return 'file';
    }
  }

  static MessageType fromString(String value) {
    switch (value.toLowerCase()) {
      case 'image':
        return MessageType.image;
      case 'file':
        return MessageType.file;
      default:
        return MessageType.text;
    }
  }
}

class Conversation {
  final String id;
  final MessageUser otherUser;
  final Message? lastMessage;
  final int unreadCount;
  final DateTime updatedAt;
  final bool isOnline;

  Conversation({
    required this.id,
    required this.otherUser,
    this.lastMessage,
    this.unreadCount = 0,
    required this.updatedAt,
    this.isOnline = false,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      id: json['id']?.toString() ?? json['conversation_id']?.toString() ?? '',
      otherUser: MessageUser.fromJson(json['other_user'] ?? json['user'] ?? {}),
      lastMessage: json['last_message'] != null
          ? Message.fromJson(json['last_message'])
          : null,
      unreadCount: json['unread_count'] ?? 0,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : DateTime.now(),
      isOnline: json['is_online'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'other_user': otherUser.toJson(),
      'last_message': lastMessage?.toJson(),
      'unread_count': unreadCount,
      'updated_at': updatedAt.toIso8601String(),
      'is_online': isOnline,
    };
  }
}
