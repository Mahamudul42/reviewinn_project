import { API_CONFIG, API_ENDPOINTS } from '../config';
import { getAuthHeaders, createAuthenticatedRequestInit } from '../../shared/utils/auth';
import type { Comment } from '../../types';

export interface CommentCreateData {
  content: string;
}

export interface CommentListParams {
  page?: number;
  limit?: number;
  sortBy?: 'newest' | 'oldest' | 'most_relevant' | 'most_liked';
  cursor?: string;
}

export interface CommentListResponse {
  comments: Comment[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export type CommentSortOption = 'newest' | 'oldest' | 'most_relevant' | 'most_liked';

// API response types
interface ApiCommentResponse {
  comment_id: number;
  review_id: number;
  user_id: number;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
  likes: number;
  reactions: Record<string, number>;
  user_reaction?: string;
  relevance_score?: number;
}

interface ApiCommentListResponse {
  comments: ApiCommentResponse[];
  total: number;
  has_more: boolean;
  next_cursor?: string;
}

export class CommentService {
  /**
   * Get comments for a review with Facebook-style pagination
   */
  async getReviewComments(
    reviewId: string,
    params: CommentListParams = {}
  ): Promise<CommentListResponse> {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'newest',
      cursor 
    } = params;
    
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort_by: sortBy
    });
    
    if (cursor) {
      queryParams.append('cursor', cursor);
    }
    
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.REVIEWS.COMMENTS(reviewId)}?${queryParams.toString()}`;
    const fetchResponse = await fetch(url, createAuthenticatedRequestInit({
      method: 'GET',
      credentials: 'include',
    }));

    if (!fetchResponse.ok) {
      throw new Error(`Failed to get comments: ${fetchResponse.statusText}`);
    }

    const response = await fetchResponse.json();
    
    if (!response.data) {
      throw new Error('Failed to fetch comments');
    }
    
    // Transform API response to frontend format
    const transformedComments = response.data.comments.map(apiComment => ({
      id: apiComment.comment_id.toString(),
      reviewId: apiComment.review_id.toString(),
      userId: apiComment.user_id.toString(),
      userName: apiComment.user_name,
      content: apiComment.content,
      authorName: apiComment.user_name,
      createdAt: new Date(apiComment.created_at),
      reactions: apiComment.reactions || {},
      userReaction: apiComment.user_reaction
    }));
    
    return {
      comments: transformedComments,
      total: response.data.total,
      hasMore: response.data.has_more,
      nextCursor: response.data.next_cursor
    };
  }

  /**
   * Get initial comments (first batch) for a review
   */
  async getInitialComments(
    reviewId: string,
    limit: number = 5,
    sortBy: CommentSortOption = 'newest'
  ): Promise<CommentListResponse> {
    return this.getReviewComments(reviewId, { 
      page: 1, 
      limit, 
      sortBy 
    });
  }

  /**
   * Load more comments using cursor-based pagination
   */
  async loadMoreComments(
    reviewId: string,
    cursor: string,
    limit: number = 10,
    sortBy: CommentSortOption = 'newest'
  ): Promise<CommentListResponse> {
    return this.getReviewComments(reviewId, { 
      limit, 
      sortBy, 
      cursor 
    });
  }

  /**
   * Get comments with specific sorting
   */
  async getCommentsWithSort(
    reviewId: string,
    sortBy: CommentSortOption,
    limit: number = 20
  ): Promise<CommentListResponse> {
    return this.getReviewComments(reviewId, { 
      page: 1, 
      limit, 
      sortBy 
    });
  }

  /**
   * Get comment count for a review
   */
  async getCommentCount(reviewId: string): Promise<number> {
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.REVIEWS.COMMENT_COUNT(reviewId)}`;
    const fetchResponse = await fetch(url, createAuthenticatedRequestInit({
      method: 'GET',
      credentials: 'include',
    }));

    if (!fetchResponse.ok) {
      throw new Error(`Failed to get comment count: ${fetchResponse.statusText}`);
    }

    const response = await fetchResponse.json();
    return response.data?.count || response.count || 0;
  }

  /**
   * Create a new comment on a review
   */
  async createComment(
    reviewId: string,
    commentData: CommentCreateData
  ): Promise<Comment> {
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.REVIEWS.COMMENTS(reviewId)}`;
    
    console.log('Creating comment with URL:', url);
    console.log('Comment data:', commentData);
    
    try {
      const fetchResponse = await fetch(url, createAuthenticatedRequestInit({
        method: 'POST',
        body: JSON.stringify({ content: commentData.content }),
        credentials: 'include',
      }));

      if (!fetchResponse.ok) {
        throw new Error(`Failed to create comment: ${fetchResponse.statusText}`);
      }

      const response = await fetchResponse.json();
      
      if (!response.data) {
        throw new Error('Failed to create comment - no response data');
      }
      
      console.log('Comment created successfully:', response.data);
      
      // Transform API response to frontend format
      return {
        id: response.data.comment_id.toString(),
        reviewId: response.data.review_id.toString(),
        userId: response.data.user_id.toString(),
        userName: response.data.user_name,
        content: response.data.content,
        authorName: response.data.user_name,
        createdAt: new Date(response.data.created_at),
        reactions: response.data.reactions || {},
        userReaction: response.data.user_reaction
      };
    } catch (error) {
      console.error('Error creating comment:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to create comment: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(reviewId: string, commentId: string): Promise<void> {
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.REVIEWS.COMMENT_DETAIL(reviewId, commentId)}`;
    const fetchResponse = await fetch(url, createAuthenticatedRequestInit({
      method: 'DELETE',
      credentials: 'include',
    }));

    if (!fetchResponse.ok) {
      throw new Error(`Failed to delete comment: ${fetchResponse.statusText}`);
    }
  }

  /**
   * Add or update a reaction for a comment
   */
  async addOrUpdateReaction(commentId: string, reactionType: string): Promise<any> {
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.REVIEWS.COMMENT_REACTIONS(commentId)}`;
    const fetchResponse = await fetch(url, createAuthenticatedRequestInit({
      method: 'POST',
      body: JSON.stringify({ reaction_type: reactionType }),
      credentials: 'include',
    }));

    if (!fetchResponse.ok) {
      throw new Error(`Failed to add comment reaction: ${fetchResponse.statusText}`);
    }

    const response = await fetchResponse.json();
    return response.data || response;
  }

  /**
   * Remove a reaction for a comment
   */
  async removeReaction(commentId: string): Promise<any> {
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.REVIEWS.COMMENT_REACTIONS(commentId)}`;
    const fetchResponse = await fetch(url, createAuthenticatedRequestInit({
      method: 'DELETE',
      credentials: 'include',
    }));
    
    if (!fetchResponse.ok) {
      throw new Error(`Failed to remove comment reaction: ${fetchResponse.statusText}`);
    }
    
    const response = await fetchResponse.json();
    return response.data || response;
  }

  /**
   * Get reaction counts for a comment
   */
  async getReactionCounts(commentId: string): Promise<any> {
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.REVIEWS.COMMENT_REACTIONS(commentId)}`;
    const fetchResponse = await fetch(url, createAuthenticatedRequestInit({
      method: 'GET',
      credentials: 'include',
    }));
    
    if (!fetchResponse.ok) {
      throw new Error(`Failed to get comment reaction counts: ${fetchResponse.statusText}`);
    }
    
    const response = await fetchResponse.json();
    return response.data || response;
  }
} 