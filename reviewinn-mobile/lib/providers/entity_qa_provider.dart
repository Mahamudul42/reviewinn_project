import 'package:flutter/material.dart';
import '../models/entity_question_model.dart';
import '../models/entity_answer_model.dart';
import '../services/api_service.dart';
import '../services/mock_data.dart';
import '../config/app_config.dart';

class EntityQAProvider with ChangeNotifier {
  final ApiService _api = ApiService();

  Map<int, List<EntityQuestion>> _questionsByEntity = {};
  Map<int, List<EntityAnswer>> _answersByQuestion = {};
  bool _isLoading = false;
  bool _isLoadingMore = false;
  String? _error;

  // Pagination per entity
  Map<int, int> _currentPages = {};
  static const int _pageSize = 15;
  Map<int, bool> _hasMoreQuestions = {};

  // Getters
  List<EntityQuestion> getQuestionsForEntity(int entityId) {
    return _questionsByEntity[entityId] ?? [];
  }

  List<EntityAnswer> getAnswersForQuestion(int questionId) {
    return _answersByQuestion[questionId] ?? [];
  }

  bool get isLoading => _isLoading;
  bool get isLoadingMore => _isLoadingMore;
  String? get error => _error;

  bool hasMoreQuestions(int entityId) {
    return _hasMoreQuestions[entityId] ?? true;
  }

  // Fetch questions for an entity
  Future<void> fetchQuestions(int entityId, {bool refresh = false}) async {
    if (refresh) {
      _currentPages[entityId] = 1;
      _questionsByEntity[entityId] = [];
      _hasMoreQuestions[entityId] = true;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    if (AppConfig.useMockData) {
      try {
        await Future.delayed(const Duration(milliseconds: 500));

        final allQuestions = MockData.getMockEntityQuestions(entityId);
        final page = _currentPages[entityId] ?? 1;
        final startIndex = (page - 1) * _pageSize;
        final endIndex = startIndex + _pageSize;

        if (startIndex < allQuestions.length) {
          final pageQuestions = allQuestions.sublist(
            startIndex,
            endIndex > allQuestions.length ? allQuestions.length : endIndex,
          );

          _questionsByEntity[entityId] =
              (_questionsByEntity[entityId] ?? [])..addAll(pageQuestions);
          _hasMoreQuestions[entityId] = endIndex < allQuestions.length;
        } else {
          _hasMoreQuestions[entityId] = false;
        }

        _error = null;
        _isLoading = false;
        notifyListeners();
        return;
      } catch (e) {
        _error = 'Error loading mock data: $e';
        _isLoading = false;
        notifyListeners();
        return;
      }
    }

    // Real API call
    try {
      final page = _currentPages[entityId] ?? 1;
      final response = await _api.get(
        '/entities/$entityId/questions?page=$page&limit=$_pageSize',
        includeAuth: false,
      );

      if (response is Map && response['success'] == true) {
        final questionsData = response['data'] as List;
        final newQuestions = questionsData
            .map((json) => EntityQuestion.fromJson(json))
            .toList();

        _questionsByEntity[entityId] =
            (_questionsByEntity[entityId] ?? [])..addAll(newQuestions);
        _hasMoreQuestions[entityId] = newQuestions.length >= _pageSize;
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _questionsByEntity[entityId] = MockData.getMockEntityQuestions(entityId);
      _error = null;
      _isLoading = false;
      notifyListeners();
    }
  }

  // Load more questions
  Future<void> loadMoreQuestions(int entityId) async {
    if (_isLoadingMore || !hasMoreQuestions(entityId)) return;

    _isLoadingMore = true;
    _currentPages[entityId] = (_currentPages[entityId] ?? 1) + 1;
    notifyListeners();

    await fetchQuestions(entityId);

    _isLoadingMore = false;
    notifyListeners();
  }

  // Fetch answers for a question
  Future<void> fetchAnswers(int questionId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    if (AppConfig.useMockData) {
      await Future.delayed(const Duration(milliseconds: 300));
      _answersByQuestion[questionId] =
          MockData.getMockEntityAnswers(questionId);
      _isLoading = false;
      notifyListeners();
      return;
    }

    try {
      final response = await _api.get(
        '/questions/$questionId/answers',
        includeAuth: false,
      );

      if (response is List) {
        _answersByQuestion[questionId] =
            response.map((json) => EntityAnswer.fromJson(json)).toList();
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _answersByQuestion[questionId] =
          MockData.getMockEntityAnswers(questionId);
      _error = null;
      _isLoading = false;
      notifyListeners();
    }
  }

  // Ask a question
  Future<bool> askQuestion({
    required int entityId,
    required String title,
    String? description,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _api.post(
        '/entities/$entityId/questions',
        body: {
          'title': title,
          'description': description,
        },
      );

      _isLoading = false;
      notifyListeners();

      // Refresh questions
      await fetchQuestions(entityId, refresh: true);
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Submit an answer
  Future<bool> submitAnswer({
    required int questionId,
    required String content,
  }) async {
    try {
      await _api.post(
        '/questions/$questionId/answers',
        body: {'content': content},
      );

      // Refresh answers
      await fetchAnswers(questionId);

      // Update answer count in question
      for (var questions in _questionsByEntity.values) {
        final qIndex = questions.indexWhere((q) => q.questionId == questionId);
        if (qIndex != -1) {
          final q = questions[qIndex];
          questions[qIndex] = EntityQuestion(
            questionId: q.questionId,
            title: q.title,
            description: q.description,
            entityId: q.entityId,
            entityName: q.entityName,
            userId: q.userId,
            username: q.username,
            userAvatar: q.userAvatar,
            answersCount: q.answersCount + 1,
            viewCount: q.viewCount,
            hasOfficialAnswer: q.hasOfficialAnswer,
            createdAt: q.createdAt,
            updatedAt: q.updatedAt,
          );
          notifyListeners();
          break;
        }
      }

      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  // Vote on an answer
  Future<void> voteAnswer(int answerId, int questionId, bool isUpvote) async {
    try {
      await _api.post(
        '/answers/$answerId/vote',
        body: {'vote_type': isUpvote ? 'upvote' : 'downvote'},
      );

      // Update local state
      final answers = _answersByQuestion[questionId];
      if (answers != null) {
        final answerIndex = answers.indexWhere((a) => a.answerId == answerId);
        if (answerIndex != -1) {
          final answer = answers[answerIndex];
          final currentVote = answer.voteStatus;

          int newUpvotes = answer.upvotes;
          int newDownvotes = answer.downvotes;
          VoteStatus newStatus;

          if (isUpvote) {
            if (currentVote == VoteStatus.upvoted) {
              // Remove upvote
              newUpvotes--;
              newStatus = VoteStatus.none;
            } else if (currentVote == VoteStatus.downvoted) {
              // Switch from downvote to upvote
              newDownvotes--;
              newUpvotes++;
              newStatus = VoteStatus.upvoted;
            } else {
              // Add upvote
              newUpvotes++;
              newStatus = VoteStatus.upvoted;
            }
          } else {
            if (currentVote == VoteStatus.downvoted) {
              // Remove downvote
              newDownvotes--;
              newStatus = VoteStatus.none;
            } else if (currentVote == VoteStatus.upvoted) {
              // Switch from upvote to downvote
              newUpvotes--;
              newDownvotes++;
              newStatus = VoteStatus.downvoted;
            } else {
              // Add downvote
              newDownvotes++;
              newStatus = VoteStatus.downvoted;
            }
          }

          answers[answerIndex] = EntityAnswer(
            answerId: answer.answerId,
            questionId: answer.questionId,
            content: answer.content,
            userId: answer.userId,
            username: answer.username,
            userAvatar: answer.userAvatar,
            isOfficial: answer.isOfficial,
            officialRole: answer.officialRole,
            upvotes: newUpvotes,
            downvotes: newDownvotes,
            voteStatus: newStatus,
            createdAt: answer.createdAt,
            updatedAt: answer.updatedAt,
          );

          notifyListeners();
        }
      }
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
