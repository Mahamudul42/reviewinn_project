import 'package:flutter/material.dart';
import '../models/user_model.dart';
import 'api_service.dart';
import 'storage_service.dart';
import '../config/api_config.dart';
import '../config/app_theme.dart';

class AuthService {
  final ApiService _api = ApiService();
  final StorageService _storage = StorageService();

  User? _currentUser;
  User? get currentUser => _currentUser;

  // Helper to get hex color without '#'
  String _getColorHex(Color color) {
    return color.value.toRadixString(16).substring(2).toUpperCase();
  }

  // Login
  Future<User> login(String username, String password) async {
    // Mock authentication for demo purposes
    if (username == 'hasan' && password == 'hasan12345') {
      // Create mock user
      final colorHex = _getColorHex(AppTheme.primaryPurple);
      final mockUser = User(
        userId: 1,
        username: 'hasan',
        email: 'hasan@reviewinn.com',
        avatar: 'https://ui-avatars.com/api/?name=Hasan&background=$colorHex&color=ffffff&size=200',
        bio: 'Software Developer | Tech Enthusiast | Love reviewing products',
        joinedAt: DateTime.now().subtract(const Duration(days: 365)),
      );

      // Save mock token
      await _storage.saveToken('mock_token_hasan_12345');
      await _storage.saveUserId('1');

      _currentUser = mockUser;
      return _currentUser!;
    }

    // Try API login if mock credentials don't match
    try {
      final response = await _api.post(
        ApiConfig.login,
        body: {
          'username': username,
          'password': password,
        },
        includeAuth: false,
      );

      if (response['token'] != null || response['access_token'] != null) {
        final token = response['token'] ?? response['access_token'];
        await _storage.saveToken(token);
      }

      _currentUser = User.fromJson(response['user'] ?? response);
      await _storage.saveUserId(_currentUser!.userId.toString());

      return _currentUser!;
    } catch (e) {
      throw Exception('Invalid username or password');
    }
  }

  // Register
  Future<User> register(String username, String email, String password) async {
    final response = await _api.post(
      ApiConfig.register,
      body: {
        'username': username,
        'email': email,
        'password': password,
      },
      includeAuth: false,
    );

    if (response['token'] != null || response['access_token'] != null) {
      final token = response['token'] ?? response['access_token'];
      await _storage.saveToken(token);
    }

    _currentUser = User.fromJson(response['user'] ?? response);
    await _storage.saveUserId(_currentUser!.userId.toString());

    return _currentUser!;
  }

  // Logout
  Future<void> logout() async {
    try {
      await _api.post(ApiConfig.logout);
    } catch (e) {
      // Continue with logout even if API call fails
    }

    await _storage.clearAll();
    _currentUser = null;
  }

  // Get current user profile
  Future<User> getCurrentUser() async {
    // Return mock user if using mock token
    final token = await _storage.getToken();
    if (token == 'mock_token_hasan_12345') {
      final colorHex = _getColorHex(AppTheme.primaryPurple);
      _currentUser = User(
        userId: 1,
        username: 'hasan',
        email: 'hasan@reviewinn.com',
        avatar: 'https://ui-avatars.com/api/?name=Hasan&background=$colorHex&color=ffffff&size=200',
        bio: 'Software Developer | Tech Enthusiast | Love reviewing products',
        joinedAt: DateTime.now().subtract(const Duration(days: 365)),
      );
      return _currentUser!;
    }

    // Otherwise, get from API
    try {
      final response = await _api.get(ApiConfig.profile);
      _currentUser = User.fromJson(response);
      return _currentUser!;
    } catch (e) {
      throw Exception('Failed to load user profile');
    }
  }

  // Check if user is logged in
  Future<bool> isLoggedIn() async {
    final token = await _storage.getToken();
    return token != null;
  }

  // Get stored token
  Future<String?> getToken() async {
    return await _storage.getToken();
  }

  // Get stored user ID
  Future<String?> getUserId() async {
    return await _storage.getUserId();
  }
}
