import 'package:flutter/material.dart';
import '../models/community_post_model.dart';
import '../models/comment_model.dart';
import '../services/api_service.dart';
import '../services/mock_data.dart';
import '../config/app_config.dart';

class CommunityProvider with ChangeNotifier {
  final ApiService _api = ApiService();

  List<CommunityPost> _posts = [];
  CommunityPost? _selectedPost;
  List<Comment> _postComments = [];
  bool _isLoading = false;
  bool _isLoadingMore = false;
  String? _error;

  // Pagination
  int _currentPage = 1;
  static const int _pageSize = 15;
  bool _hasMorePosts = true;

  // Getters
  List<CommunityPost> get posts => _posts;
  CommunityPost? get selectedPost => _selectedPost;
  List<Comment> get postComments => _postComments;
  bool get isLoading => _isLoading;
  bool get isLoadingMore => _isLoadingMore;
  bool get hasMorePosts => _hasMorePosts;
  String? get error => _error;

  // Fetch community posts with pagination
  Future<void> fetchPosts({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 1;
      _posts = [];
      _hasMorePosts = true;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    // Use mock data during development
    if (AppConfig.useMockData) {
      try {
        await Future.delayed(const Duration(milliseconds: 500));

        final allPosts = MockData.getMockCommunityPosts();
        final startIndex = (_currentPage - 1) * _pageSize;
        final endIndex = startIndex + _pageSize;

        if (startIndex < allPosts.length) {
          final pagePosts = allPosts.sublist(
            startIndex,
            endIndex > allPosts.length ? allPosts.length : endIndex,
          );
          _posts.addAll(pagePosts);
          _hasMorePosts = endIndex < allPosts.length;
        } else {
          _hasMorePosts = false;
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
      final response = await _api.get(
        '/community/posts?page=$_currentPage&limit=$_pageSize',
        includeAuth: false,
      );

      if (response is Map && response['success'] == true) {
        final postsData = response['data'] as List;
        final newPosts =
            postsData.map((json) => CommunityPost.fromJson(json)).toList();
        _posts.addAll(newPosts);
        _hasMorePosts = newPosts.length >= _pageSize;
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      // Fallback to mock data
      _posts = MockData.getMockCommunityPosts();
      _error = null;
      _isLoading = false;
      notifyListeners();
    }
  }

  // Load more posts
  Future<void> loadMorePosts() async {
    if (_isLoadingMore || !_hasMorePosts) return;

    _isLoadingMore = true;
    _currentPage++;
    notifyListeners();

    await fetchPosts();

    _isLoadingMore = false;
    notifyListeners();
  }

  // Create new post
  Future<bool> createPost({
    required String title,
    required String content,
    List<String>? images,
    List<String>? tags,
    int? linkedEntityId,
    int? linkedGroupId,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _api.post(
        '/community/posts',
        body: {
          'title': title,
          'content': content,
          'images': images,
          'tags': tags,
          'entity_id': linkedEntityId,
          'group_id': linkedGroupId,
        },
      );

      _isLoading = false;
      notifyListeners();

      // Refresh posts after creation
      await fetchPosts(refresh: true);
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Like/Unlike post
  Future<void> toggleLike(int postId) async {
    try {
      await _api.post('/community/posts/$postId/like', body: {});

      // Update local state
      final postIndex = _posts.indexWhere((p) => p.postId == postId);
      if (postIndex != -1) {
        final post = _posts[postIndex];
        _posts[postIndex] = CommunityPost(
          postId: post.postId,
          title: post.title,
          content: post.content,
          userId: post.userId,
          username: post.username,
          userAvatar: post.userAvatar,
          images: post.images,
          tags: post.tags,
          likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1,
          commentsCount: post.commentsCount,
          viewCount: post.viewCount,
          isLiked: !post.isLiked,
          isPinned: post.isPinned,
          isEdited: post.isEdited,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          postType: post.postType,
          entityId: post.entityId,
          entityName: post.entityName,
          entityAvatar: post.entityAvatar,
          groupId: post.groupId,
          groupName: post.groupName,
          groupAvatar: post.groupAvatar,
        );
        notifyListeners();
      }
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  // Fetch comments for a post
  Future<void> fetchPostComments(int postId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    if (AppConfig.useMockData) {
      await Future.delayed(const Duration(milliseconds: 300));
      _postComments = MockData.getMockComments(postId);
      _isLoading = false;
      notifyListeners();
      return;
    }

    try {
      final response = await _api.get(
        '/community/posts/$postId/comments',
        includeAuth: false,
      );

      if (response is List) {
        _postComments =
            response.map((json) => Comment.fromJson(json)).toList();
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _postComments = MockData.getMockComments(postId);
      _error = null;
      _isLoading = false;
      notifyListeners();
    }
  }

  // Add comment
  Future<bool> addComment(int postId, String content) async {
    try {
      await _api.post(
        '/community/posts/$postId/comments',
        body: {'content': content},
      );

      // Refresh comments
      await fetchPostComments(postId);

      // Update comment count
      final postIndex = _posts.indexWhere((p) => p.postId == postId);
      if (postIndex != -1) {
        final post = _posts[postIndex];
        _posts[postIndex] = CommunityPost(
          postId: post.postId,
          title: post.title,
          content: post.content,
          userId: post.userId,
          username: post.username,
          userAvatar: post.userAvatar,
          images: post.images,
          tags: post.tags,
          likesCount: post.likesCount,
          commentsCount: post.commentsCount + 1,
          viewCount: post.viewCount,
          isLiked: post.isLiked,
          isPinned: post.isPinned,
          isEdited: post.isEdited,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          postType: post.postType,
          entityId: post.entityId,
          entityName: post.entityName,
          entityAvatar: post.entityAvatar,
          groupId: post.groupId,
          groupName: post.groupName,
          groupAvatar: post.groupAvatar,
        );
        notifyListeners();
      }

      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  // Update comment
  Future<void> updateComment({
    required int commentId,
    required String content,
  }) async {
    try {
      if (AppConfig.useMockData) {
        // Mock implementation - update comment in local state
        await Future.delayed(const Duration(milliseconds: 500));

        final index = _postComments.indexWhere((c) => c.commentId == commentId);
        if (index != -1) {
          final oldComment = _postComments[index];
          _postComments[index] = Comment(
            commentId: oldComment.commentId,
            content: content,
            userId: oldComment.userId,
            username: oldComment.username,
            userAvatar: oldComment.userAvatar,
            likesCount: oldComment.likesCount,
            isLiked: oldComment.isLiked,
            createdAt: oldComment.createdAt,
            updatedAt: DateTime.now(),
            parentCommentId: oldComment.parentCommentId,
          );
        }

        notifyListeners();
        return;
      }

      // Real API call would go here
      // await _api.put('/community/comments/$commentId', body: {'content': content});

      notifyListeners();
    } catch (e) {
      _error = 'Failed to update comment: $e';
      notifyListeners();
      rethrow;
    }
  }

  // Delete comment
  Future<void> deleteComment(int commentId, int postId) async {
    try {
      if (AppConfig.useMockData) {
        // Mock implementation - remove comment from local state
        await Future.delayed(const Duration(milliseconds: 500));

        _postComments.removeWhere((c) => c.commentId == commentId);

        // Update comment count in post
        final postIndex = _posts.indexWhere((p) => p.postId == postId);
        if (postIndex != -1) {
          final post = _posts[postIndex];
          _posts[postIndex] = CommunityPost(
            postId: post.postId,
            title: post.title,
            content: post.content,
            userId: post.userId,
            username: post.username,
            userAvatar: post.userAvatar,
            images: post.images,
            tags: post.tags,
            likesCount: post.likesCount,
            commentsCount: post.commentsCount - 1,
            viewCount: post.viewCount,
            isLiked: post.isLiked,
            isPinned: post.isPinned,
            isEdited: post.isEdited,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            postType: post.postType,
            entityId: post.entityId,
            entityName: post.entityName,
            entityAvatar: post.entityAvatar,
            groupId: post.groupId,
            groupName: post.groupName,
            groupAvatar: post.groupAvatar,
          );
        }

        notifyListeners();
        return;
      }

      // Real API call would go here
      // await _api.delete('/community/comments/$commentId');

      _postComments.removeWhere((c) => c.commentId == commentId);

      // Update comment count
      final postIndex = _posts.indexWhere((p) => p.postId == postId);
      if (postIndex != -1) {
        final post = _posts[postIndex];
        _posts[postIndex] = CommunityPost(
          postId: post.postId,
          title: post.title,
          content: post.content,
          userId: post.userId,
          username: post.username,
          userAvatar: post.userAvatar,
          images: post.images,
          tags: post.tags,
          likesCount: post.likesCount,
          commentsCount: post.commentsCount - 1,
          viewCount: post.viewCount,
          isLiked: post.isLiked,
          isPinned: post.isPinned,
          isEdited: post.isEdited,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          postType: post.postType,
          entityId: post.entityId,
          entityName: post.entityName,
          entityAvatar: post.entityAvatar,
          groupId: post.groupId,
          groupName: post.groupName,
          groupAvatar: post.groupAvatar,
        );
      }

      notifyListeners();
    } catch (e) {
      _error = 'Failed to delete comment: $e';
      notifyListeners();
      rethrow;
    }
  }

  // Update a post
  Future<void> updatePost({
    required int postId,
    String? title,
    String? content,
    List<String>? tags,
  }) async {
    try {
      if (AppConfig.useMockData) {
        // Mock implementation - update post in local state
        await Future.delayed(const Duration(milliseconds: 500));

        final index = _posts.indexWhere((p) => p.postId == postId);
        if (index != -1) {
          final oldPost = _posts[index];
          _posts[index] = CommunityPost(
            postId: oldPost.postId,
            title: title ?? oldPost.title,
            content: content ?? oldPost.content,
            userId: oldPost.userId,
            username: oldPost.username,
            userAvatar: oldPost.userAvatar,
            tags: tags ?? oldPost.tags,
            likesCount: oldPost.likesCount,
            commentsCount: oldPost.commentsCount,
            viewCount: oldPost.viewCount,
            isLiked: oldPost.isLiked,
            isPinned: oldPost.isPinned,
            postType: oldPost.postType,
            entityId: oldPost.entityId,
            entityName: oldPost.entityName,
            entityAvatar: oldPost.entityAvatar,
            groupId: oldPost.groupId,
            groupName: oldPost.groupName,
            createdAt: oldPost.createdAt,
          );
        }

        notifyListeners();
        return;
      }

      // Real API call would go here
      // await _api.put('/community/posts/$postId', body: {...});

      notifyListeners();
    } catch (e) {
      _error = 'Failed to update post: $e';
      notifyListeners();
      rethrow;
    }
  }

  // Delete a post
  Future<void> deletePost(int postId) async {
    try {
      if (AppConfig.useMockData) {
        // Mock implementation - remove post from local state
        await Future.delayed(const Duration(milliseconds: 500));

        _posts.removeWhere((p) => p.postId == postId);

        notifyListeners();
        return;
      }

      // Real API call would go here
      // await _api.delete('/community/posts/$postId');

      _posts.removeWhere((p) => p.postId == postId);

      notifyListeners();
    } catch (e) {
      _error = 'Failed to delete post: $e';
      notifyListeners();
      rethrow;
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
