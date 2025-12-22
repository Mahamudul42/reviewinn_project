import '../models/circle_models.dart';

class MockCircleService {
  // Mock current user ID
  static const String currentUserId = '1';

  // Mock users
  static final List<CircleUser> mockUsers = [
    CircleUser(
      id: '2',
      name: 'Alex Martinez',
      username: 'alex_reviews',
      avatar: 'https://i.pravatar.cc/150?img=12',
      email: 'alex@example.com',
    ),
    CircleUser(
      id: '3',
      name: 'Priya Sharma',
      username: 'priya_foodie',
      avatar: 'https://i.pravatar.cc/150?img=9',
      email: 'priya@example.com',
    ),
    CircleUser(
      id: '4',
      name: 'James Wilson',
      username: 'james_w',
      avatar: 'https://i.pravatar.cc/150?img=13',
      email: 'james@example.com',
    ),
    CircleUser(
      id: '5',
      name: 'Maria Garcia',
      username: 'maria_explorer',
      avatar: 'https://i.pravatar.cc/150?img=24',
      email: 'maria@example.com',
    ),
    CircleUser(
      id: '6',
      name: 'David Kim',
      username: 'david_tech',
      avatar: 'https://i.pravatar.cc/150?img=15',
      email: 'david@example.com',
    ),
    CircleUser(
      id: '7',
      name: 'Sophie Chen',
      username: 'sophie_travels',
      avatar: 'https://i.pravatar.cc/150?img=44',
      email: 'sophie@example.com',
    ),
    CircleUser(
      id: '8',
      name: 'Mohammed Ali',
      username: 'mo_reviews',
      avatar: 'https://i.pravatar.cc/150?img=33',
      email: 'mo@example.com',
    ),
    CircleUser(
      id: '9',
      name: 'Emma Thompson',
      username: 'emma_t',
      avatar: 'https://i.pravatar.cc/150?img=20',
      email: 'emma@example.com',
    ),
  ];

  // Mock circle members
  static List<CircleMember> _members = [
    CircleMember(
      connectionId: 'conn_1',
      user: mockUsers[0], // Alex
      trustLevel: TrustLevel.reviewMentor,
      tasteMatchScore: 92.5,
      interactionCount: 45,
      connectedSince: DateTime.now().subtract(const Duration(days: 120)),
    ),
    CircleMember(
      connectionId: 'conn_2',
      user: mockUsers[1], // Priya
      trustLevel: TrustLevel.reviewAlly,
      tasteMatchScore: 88.0,
      interactionCount: 32,
      connectedSince: DateTime.now().subtract(const Duration(days: 90)),
    ),
    CircleMember(
      connectionId: 'conn_3',
      user: mockUsers[2], // James
      trustLevel: TrustLevel.trustedReviewer,
      tasteMatchScore: 75.5,
      interactionCount: 18,
      connectedSince: DateTime.now().subtract(const Duration(days: 60)),
    ),
    CircleMember(
      connectionId: 'conn_4',
      user: mockUsers[3], // Maria
      trustLevel: TrustLevel.reviewer,
      tasteMatchScore: 68.0,
      interactionCount: 12,
      connectedSince: DateTime.now().subtract(const Duration(days: 30)),
    ),
  ];

  // Mock invites
  static List<CircleInvite> _invites = [
    CircleInvite(
      inviteId: 'inv_1',
      sender: mockUsers[4], // David
      message: 'Hey! Love your restaurant reviews. Would you like to connect?',
      createdAt: DateTime.now().subtract(const Duration(hours: 5)),
    ),
    CircleInvite(
      inviteId: 'inv_2',
      sender: mockUsers[5], // Sophie
      message: 'I see we have similar taste in books and cafes. Let\'s connect!',
      createdAt: DateTime.now().subtract(const Duration(days: 1)),
    ),
  ];

  // Mock sent requests
  static List<CircleRequest> _sentRequests = [
    CircleRequest(
      requestId: 'req_1',
      user: mockUsers[6], // Mohammed
      message: 'Hi! I enjoyed your tech product reviews. Would love to connect!',
      status: RequestStatus.pending,
      createdAt: DateTime.now().subtract(const Duration(days: 2)),
    ),
  ];

  // Mock suggestions
  static List<CircleSuggestion> _suggestions = [
    CircleSuggestion(
      user: mockUsers[7], // Emma
      tasteMatchScore: 85.5,
      mutualFriends: 3,
      reason: 'Similar taste in restaurants and travel destinations',
    ),
    CircleSuggestion(
      user: mockUsers[6], // Mohammed (if not in sent requests)
      tasteMatchScore: 78.0,
      mutualFriends: 2,
      reason: 'Both review tech products and gaming accessories',
    ),
  ];

  // Get circle members
  Future<List<CircleMember>> getMembers(String token) async {
    await Future.delayed(const Duration(milliseconds: 500));
    return List.from(_members);
  }

  // Get circle invites
  Future<List<CircleInvite>> getInvites(String token) async {
    await Future.delayed(const Duration(milliseconds: 400));
    return List.from(_invites);
  }

  // Get sent requests
  Future<List<CircleRequest>> getSentRequests(String token) async {
    await Future.delayed(const Duration(milliseconds: 400));
    return List.from(_sentRequests);
  }

  // Get suggestions
  Future<List<CircleSuggestion>> getSuggestions(String token) async {
    await Future.delayed(const Duration(milliseconds: 500));
    return List.from(_suggestions);
  }

  // Accept invite
  Future<bool> acceptInvite(String token, String inviteId) async {
    await Future.delayed(const Duration(milliseconds: 300));
    
    final inviteIndex = _invites.indexWhere((inv) => inv.inviteId == inviteId);
    if (inviteIndex != -1) {
      final invite = _invites[inviteIndex];
      
      // Add to members
      _members.add(CircleMember(
        connectionId: 'conn_${DateTime.now().millisecondsSinceEpoch}',
        user: invite.sender,
        trustLevel: TrustLevel.reviewer,
        tasteMatchScore: 70.0,
        interactionCount: 0,
        connectedSince: DateTime.now(),
      ));
      
      // Remove from invites
      _invites.removeAt(inviteIndex);
      
      return true;
    }
    return false;
  }

  // Reject invite
  Future<bool> rejectInvite(String token, String inviteId) async {
    await Future.delayed(const Duration(milliseconds: 300));
    
    _invites.removeWhere((inv) => inv.inviteId == inviteId);
    return true;
  }

  // Send request
  Future<bool> sendRequest(String token, String userId, String message) async {
    await Future.delayed(const Duration(milliseconds: 400));
    
    final user = mockUsers.firstWhere(
      (u) => u.id == userId,
      orElse: () => mockUsers.last,
    );
    
    _sentRequests.add(CircleRequest(
      requestId: 'req_${DateTime.now().millisecondsSinceEpoch}',
      user: user,
      message: message,
      status: RequestStatus.pending,
      createdAt: DateTime.now(),
    ));
    
    // Remove from suggestions
    _suggestions.removeWhere((s) => s.user.id == userId);
    
    return true;
  }

  // Cancel request
  Future<bool> cancelRequest(String token, String requestId) async {
    await Future.delayed(const Duration(milliseconds: 300));
    
    final requestIndex = _sentRequests.indexWhere((req) => req.requestId == requestId);
    if (requestIndex != -1) {
      final request = _sentRequests[requestIndex];
      
      // Add back to suggestions
      _suggestions.add(CircleSuggestion(
        user: request.user,
        tasteMatchScore: 70.0,
        mutualFriends: 1,
        reason: 'You might be interested in their reviews',
      ));
      
      _sentRequests.removeAt(requestIndex);
      return true;
    }
    return false;
  }

  // Update trust level
  Future<bool> updateTrustLevel(
    String token,
    String connectionId,
    TrustLevel trustLevel,
  ) async {
    await Future.delayed(const Duration(milliseconds: 300));
    
    final memberIndex = _members.indexWhere((m) => m.connectionId == connectionId);
    if (memberIndex != -1) {
      final member = _members[memberIndex];
      _members[memberIndex] = CircleMember(
        connectionId: member.connectionId,
        user: member.user,
        trustLevel: trustLevel,
        tasteMatchScore: member.tasteMatchScore,
        interactionCount: member.interactionCount,
        connectedSince: member.connectedSince,
      );
      return true;
    }
    return false;
  }

  // Remove member
  Future<bool> removeMember(String token, String connectionId) async {
    await Future.delayed(const Duration(milliseconds: 300));
    
    final memberIndex = _members.indexWhere((m) => m.connectionId == connectionId);
    if (memberIndex != -1) {
      final member = _members[memberIndex];
      
      // Add to suggestions
      _suggestions.add(CircleSuggestion(
        user: member.user,
        tasteMatchScore: member.tasteMatchScore,
        mutualFriends: 0,
        reason: 'Previously in your circle',
      ));
      
      _members.removeAt(memberIndex);
      return true;
    }
    return false;
  }

  // Block member
  Future<bool> blockMember(String token, String connectionId) async {
    await Future.delayed(const Duration(milliseconds: 300));
    
    _members.removeWhere((m) => m.connectionId == connectionId);
    return true;
  }

  // Block user (for blocking from suggestions or other places)
  Future<bool> blockUser(String token, String userId) async {
    await Future.delayed(const Duration(milliseconds: 300));
    
    // Remove from members if exists
    _members.removeWhere((m) => m.user.id == userId);
    // Remove from suggestions
    _suggestions.removeWhere((s) => s.user.id == userId);
    return true;
  }
}
