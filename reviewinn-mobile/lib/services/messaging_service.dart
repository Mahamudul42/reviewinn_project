import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/message_models.dart';

class MessagingService {
  final String baseUrl = ApiConfig.baseUrl;

  Future<List<Conversation>> getConversations(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/messenger/conversations'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final dynamic responseData = json.decode(response.body);
        // Handle both array response and object with data key
        final List<dynamic> data = responseData is List 
            ? responseData 
            : (responseData['conversations'] ?? responseData['data'] ?? []);
        return data.map((json) => Conversation.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching conversations: $e');
      return [];
    }
  }

  Future<List<Message>> getMessages(String token, String conversationId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/messenger/conversations/$conversationId/messages'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final dynamic responseData = json.decode(response.body);
        // Handle both array response and object with data key
        final List<dynamic> data = responseData is List 
            ? responseData 
            : (responseData['messages'] ?? responseData['data'] ?? []);
        return data.map((json) => Message.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching messages: $e');
      return [];
    }
  }

  Future<Message?> sendMessage(
    String token,
    String conversationId,
    String content,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/messenger/conversations/$conversationId/messages'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'content': content,
          'message_type': 'text',
        }),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final dynamic responseData = json.decode(response.body);
        // Handle both direct message object and object with data/message key
        final messageData = responseData['message'] ?? responseData['data'] ?? responseData;
        return Message.fromJson(messageData);
      }
      return null;
    } catch (e) {
      print('Error sending message: $e');
      return null;
    }
  }

  Future<Conversation?> createConversation(
    String token,
    String userId,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/messenger/conversations'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'participant_ids': [int.parse(userId)],
          'conversation_type': 'direct',
        }),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final dynamic responseData = json.decode(response.body);
        final conversationData = responseData['conversation'] ?? responseData['data'] ?? responseData;
        return Conversation.fromJson(conversationData);
      }
      return null;
    } catch (e) {
      print('Error creating conversation: $e');
      return null;
    }
  }

  Future<bool> markAsRead(String token, String conversationId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/messenger/conversations/$conversationId/read'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      print('Error marking as read: $e');
      return false;
    }
  }

  Future<bool> deleteConversation(String token, String conversationId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/messenger/conversations/$conversationId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200 || response.statusCode == 204;
    } catch (e) {
      print('Error deleting conversation: $e');
      return false;
    }
  }
}
