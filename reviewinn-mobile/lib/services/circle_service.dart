import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/circle_models.dart';

class CircleService {
  final String baseUrl = ApiConfig.baseUrl;

  Future<List<CircleMember>> getMembers(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/circle/members'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => CircleMember.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching circle members: $e');
      return [];
    }
  }

  Future<List<CircleInvite>> getInvites(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/circle/invites'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => CircleInvite.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching circle invites: $e');
      return [];
    }
  }

  Future<List<CircleRequest>> getSentRequests(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/circle/sent-requests'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => CircleRequest.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching sent requests: $e');
      return [];
    }
  }

  Future<List<CircleSuggestion>> getSuggestions(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/circle/suggestions'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => CircleSuggestion.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching circle suggestions: $e');
      return [];
    }
  }

  Future<bool> acceptInvite(String token, String inviteId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/circle/invites/$inviteId/accept'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error accepting invite: $e');
      return false;
    }
  }

  Future<bool> rejectInvite(String token, String inviteId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/circle/invites/$inviteId/reject'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error rejecting invite: $e');
      return false;
    }
  }

  Future<bool> sendRequest(String token, String userId, String message) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/circle/requests'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'recipient_id': userId,
          'message': message,
        }),
      );

      return response.statusCode == 201 || response.statusCode == 200;
    } catch (e) {
      print('Error sending request: $e');
      return false;
    }
  }

  Future<bool> cancelRequest(String token, String requestId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/circle/requests/$requestId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error canceling request: $e');
      return false;
    }
  }

  Future<bool> updateTrustLevel(
    String token,
    String connectionId,
    TrustLevel trustLevel,
  ) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/circle/members/$connectionId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'trust_level': trustLevel.apiValue,
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error updating trust level: $e');
      return false;
    }
  }

  Future<bool> removeMember(String token, String connectionId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/circle/members/$connectionId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error removing member: $e');
      return false;
    }
  }

  Future<bool> blockUser(String token, String userId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/circle/block'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'user_id': userId,
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error blocking user: $e');
      return false;
    }
  }

  // Helper methods for UI
  String getTrustLevelColor(TrustLevel trustLevel) {
    switch (trustLevel) {
      case TrustLevel.reviewer:
        return 'bg-blue-100 text-blue-800';
      case TrustLevel.trustedReviewer:
        return 'bg-green-100 text-green-800';
      case TrustLevel.reviewAlly:
        return 'bg-purple-100 text-purple-800';
      case TrustLevel.reviewMentor:
        return 'bg-orange-100 text-orange-800';
    }
  }

  String getTasteMatchColor(double score) {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  }
}
