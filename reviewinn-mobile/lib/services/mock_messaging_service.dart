import '../models/message_models.dart';

class MockMessagingService {
  // Mock current user ID
  static const String currentUserId = '1';

  // Mock users
  static final List<MessageUser> mockUsers = [
    MessageUser(
      id: '2',
      name: 'Sarah Johnson',
      username: 'sarah_j',
      avatar: 'https://i.pravatar.cc/150?img=1',
    ),
    MessageUser(
      id: '3',
      name: 'Mike Chen',
      username: 'mike_chen',
      avatar: 'https://i.pravatar.cc/150?img=3',
    ),
    MessageUser(
      id: '4',
      name: 'Emily Davis',
      username: 'emily_d',
      avatar: 'https://i.pravatar.cc/150?img=5',
    ),
    MessageUser(
      id: '5',
      name: 'David Wilson',
      username: 'david_w',
      avatar: 'https://i.pravatar.cc/150?img=8',
    ),
    MessageUser(
      id: '6',
      name: 'Lisa Anderson',
      username: 'lisa_a',
      avatar: 'https://i.pravatar.cc/150?img=9',
    ),
  ];

  // Mock conversations with messages
  static final Map<String, List<Message>> _conversationMessages = {
    'conv_1': [
      Message(
        id: 'm1',
        conversationId: 'conv_1',
        senderId: '2',
        content: 'Hey! Did you see that new restaurant review?',
        createdAt: DateTime.now().subtract(const Duration(hours: 2)),
        isRead: true,
      ),
      Message(
        id: 'm2',
        conversationId: 'conv_1',
        senderId: currentUserId,
        content: 'Yes! The one about the Italian place? Looks amazing!',
        createdAt: DateTime.now().subtract(const Duration(hours: 2, minutes: 5)),
        isRead: true,
      ),
      Message(
        id: 'm3',
        conversationId: 'conv_1',
        senderId: '2',
        content: 'We should go there this weekend!',
        createdAt: DateTime.now().subtract(const Duration(hours: 1, minutes: 30)),
        isRead: true,
      ),
      Message(
        id: 'm4',
        conversationId: 'conv_1',
        senderId: currentUserId,
        content: 'Sounds great! Let me check my schedule.',
        createdAt: DateTime.now().subtract(const Duration(hours: 1, minutes: 15)),
        isRead: true,
      ),
      Message(
        id: 'm5',
        conversationId: 'conv_1',
        senderId: '2',
        content: 'Perfect! I\'ll make a reservation for Saturday at 7 PM.',
        createdAt: DateTime.now().subtract(const Duration(minutes: 45)),
        isRead: false,
      ),
    ],
    'conv_2': [
      Message(
        id: 'm6',
        conversationId: 'conv_2',
        senderId: '3',
        content: 'Thanks for your detailed review on that coffee shop!',
        createdAt: DateTime.now().subtract(const Duration(days: 1, hours: 3)),
        isRead: true,
      ),
      Message(
        id: 'm7',
        conversationId: 'conv_2',
        senderId: currentUserId,
        content: 'You\'re welcome! It\'s my favorite spot.',
        createdAt: DateTime.now().subtract(const Duration(days: 1, hours: 2)),
        isRead: true,
      ),
      Message(
        id: 'm8',
        conversationId: 'conv_2',
        senderId: '3',
        content: 'I visited today based on your recommendation. Excellent!',
        createdAt: DateTime.now().subtract(const Duration(hours: 5)),
        isRead: false,
      ),
    ],
    'conv_3': [
      Message(
        id: 'm9',
        conversationId: 'conv_3',
        senderId: currentUserId,
        content: 'Hi Emily! Saw your review about the bookstore.',
        createdAt: DateTime.now().subtract(const Duration(days: 2)),
        isRead: true,
      ),
      Message(
        id: 'm10',
        conversationId: 'conv_3',
        senderId: '4',
        content: 'Hi! Yes, it\'s a hidden gem in the city.',
        createdAt: DateTime.now().subtract(const Duration(days: 1, hours: 20)),
        isRead: true,
      ),
      Message(
        id: 'm11',
        conversationId: 'conv_3',
        senderId: currentUserId,
        content: 'Do they have a good collection of sci-fi novels?',
        createdAt: DateTime.now().subtract(const Duration(days: 1, hours: 18)),
        isRead: true,
      ),
      Message(
        id: 'm12',
        conversationId: 'conv_3',
        senderId: '4',
        content: 'Absolutely! The second floor is dedicated to sci-fi and fantasy. You\'ll love it!',
        createdAt: DateTime.now().subtract(const Duration(days: 1, hours: 12)),
        isRead: false,
      ),
    ],
    'conv_4': [
      Message(
        id: 'm13',
        conversationId: 'conv_4',
        senderId: '5',
        content: 'Your review helped me discover the best pizza in town! 🍕',
        createdAt: DateTime.now().subtract(const Duration(hours: 8)),
        isRead: false,
      ),
    ],
    'conv_5': [
      Message(
        id: 'm14',
        conversationId: 'conv_5',
        senderId: '6',
        content: 'Hi! I noticed we both reviewed the same gym.',
        createdAt: DateTime.now().subtract(const Duration(days: 3)),
        isRead: true,
      ),
      Message(
        id: 'm15',
        conversationId: 'conv_5',
        senderId: currentUserId,
        content: 'Oh yes! Great facility, isn\'t it?',
        createdAt: DateTime.now().subtract(const Duration(days: 2, hours: 22)),
        isRead: true,
      ),
      Message(
        id: 'm16',
        conversationId: 'conv_5',
        senderId: '6',
        content: 'Definitely! Do you go for the morning or evening sessions?',
        createdAt: DateTime.now().subtract(const Duration(days: 2, hours: 20)),
        isRead: true,
      ),
      Message(
        id: 'm17',
        conversationId: 'conv_5',
        senderId: currentUserId,
        content: 'Usually mornings around 6 AM. You?',
        createdAt: DateTime.now().subtract(const Duration(days: 2, hours: 18)),
        isRead: true,
      ),
      Message(
        id: 'm18',
        conversationId: 'conv_5',
        senderId: '6',
        content: 'I\'m an evening person, usually around 7 PM. Maybe we can do a workout together sometime!',
        createdAt: DateTime.now().subtract(const Duration(days: 2, hours: 10)),
        isRead: false,
      ),
    ],
  };

  // Get all conversations for the current user
  Future<List<Conversation>> getConversations(String token) async {
    // Simulate network delay
    await Future.delayed(const Duration(milliseconds: 500));

    return mockUsers.asMap().entries.map((entry) {
      final index = entry.key;
      final user = entry.value;
      final conversationId = 'conv_${index + 1}';
      final messages = _conversationMessages[conversationId] ?? [];
      final lastMessage = messages.isNotEmpty ? messages.last : null;
      final unreadCount = messages.where((m) => !m.isRead && m.senderId != currentUserId).length;

      return Conversation(
        id: conversationId,
        otherUser: user,
        lastMessage: lastMessage,
        unreadCount: unreadCount,
        updatedAt: lastMessage?.createdAt ?? DateTime.now(),
      );
    }).toList()
      ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
  }

  // Get messages for a specific conversation
  Future<List<Message>> getMessages(String token, String conversationId) async {
    // Simulate network delay
    await Future.delayed(const Duration(milliseconds: 300));

    return _conversationMessages[conversationId] ?? [];
  }

  // Send a new message
  Future<Message?> sendMessage(
    String token,
    String conversationId,
    String content,
  ) async {
    // Simulate network delay
    await Future.delayed(const Duration(milliseconds: 400));

    final newMessage = Message(
      id: 'm_${DateTime.now().millisecondsSinceEpoch}',
      conversationId: conversationId,
      senderId: currentUserId,
      content: content,
      createdAt: DateTime.now(),
      isRead: false,
    );

    // Add to conversation messages
    if (_conversationMessages.containsKey(conversationId)) {
      _conversationMessages[conversationId]!.add(newMessage);
    } else {
      _conversationMessages[conversationId] = [newMessage];
    }

    return newMessage;
  }

  // Mark conversation as read
  Future<bool> markAsRead(String token, String conversationId) async {
    await Future.delayed(const Duration(milliseconds: 200));

    if (_conversationMessages.containsKey(conversationId)) {
      for (var message in _conversationMessages[conversationId]!) {
        if (message.senderId != currentUserId) {
          // In a real app, you'd update the message object
          // For mock, we'll just simulate success
        }
      }
    }
    return true;
  }

  // Create a new conversation
  Future<Conversation?> createConversation(String token, String userId) async {
    await Future.delayed(const Duration(milliseconds: 400));

    final user = mockUsers.firstWhere(
      (u) => u.id == userId,
      orElse: () => mockUsers.first,
    );

    final conversationId = 'conv_new_${DateTime.now().millisecondsSinceEpoch}';

    return Conversation(
      id: conversationId,
      otherUser: user,
      lastMessage: null,
      unreadCount: 0,
      updatedAt: DateTime.now(),
    );
  }

  // Delete a conversation
  Future<bool> deleteConversation(String token, String conversationId) async {
    await Future.delayed(const Duration(milliseconds: 300));

    _conversationMessages.remove(conversationId);
    return true;
  }
}
