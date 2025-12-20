import 'package:flutter/foundation.dart';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class ReviewDraft {
  final String entityId;
  final String entityName;
  final int rating;
  final String content;
  final List<String> imageUrls;
  final DateTime savedAt;

  ReviewDraft({
    required this.entityId,
    required this.entityName,
    required this.rating,
    required this.content,
    required this.imageUrls,
    required this.savedAt,
  });

  Map<String, dynamic> toJson() => {
        'entityId': entityId,
        'entityName': entityName,
        'rating': rating,
        'content': content,
        'imageUrls': imageUrls,
        'savedAt': savedAt.toIso8601String(),
      };

  factory ReviewDraft.fromJson(Map<String, dynamic> json) => ReviewDraft(
        entityId: json['entityId'],
        entityName: json['entityName'],
        rating: json['rating'],
        content: json['content'],
        imageUrls: List<String>.from(json['imageUrls']),
        savedAt: DateTime.parse(json['savedAt']),
      );
}

class DraftProvider with ChangeNotifier {
  List<ReviewDraft> _drafts = [];
  static const String _draftsKey = 'review_drafts';

  List<ReviewDraft> get drafts => _drafts;

  DraftProvider() {
    _loadDrafts();
  }

  Future<void> _loadDrafts() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final draftsJson = prefs.getString(_draftsKey);
      
      if (draftsJson != null) {
        final List<dynamic> decodedList = json.decode(draftsJson);
        _drafts = decodedList.map((item) => ReviewDraft.fromJson(item)).toList();
        
        // Sort by most recent first
        _drafts.sort((a, b) => b.savedAt.compareTo(a.savedAt));
        notifyListeners();
      }
    } catch (e) {
      print('Error loading drafts: $e');
    }
  }

  Future<void> _saveDrafts() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final draftsJson = json.encode(_drafts.map((d) => d.toJson()).toList());
      await prefs.setString(_draftsKey, draftsJson);
    } catch (e) {
      print('Error saving drafts: $e');
    }
  }

  Future<void> saveDraft(ReviewDraft draft) async {
    // Remove existing draft for the same entity
    _drafts.removeWhere((d) => d.entityId == draft.entityId);
    
    // Add new draft
    _drafts.insert(0, draft);
    
    // Limit to 10 most recent drafts
    if (_drafts.length > 10) {
      _drafts = _drafts.sublist(0, 10);
    }
    
    await _saveDrafts();
    notifyListeners();
  }

  Future<void> deleteDraft(String entityId) async {
    _drafts.removeWhere((d) => d.entityId == entityId);
    await _saveDrafts();
    notifyListeners();
  }

  ReviewDraft? getDraft(String entityId) {
    try {
      return _drafts.firstWhere((d) => d.entityId == entityId);
    } catch (e) {
      return null;
    }
  }

  Future<void> clearAllDrafts() async {
    _drafts.clear();
    await _saveDrafts();
    notifyListeners();
  }
}
