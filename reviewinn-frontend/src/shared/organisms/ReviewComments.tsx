import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MoreHorizontal, Reply, Flag, Trash2, ChevronDown, ChevronUp, MessageCircle, Clock, ThumbsUp, TrendingUp } from 'lucide-react';
import type { Comment } from '../../types';
import { CommentService } from '../../api/services/commentService';
import type { CommentSortOption } from '../../api/services/commentService';
import SocialReactionButton from '../molecules/SocialReactionButton';
import FacebookReactionSummary from '../molecules/FacebookReactionSummary';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import AuthModal from '../../features/auth/components/AuthModal';

interface ReviewCommentsProps {
  reviewId: string;
  initialCommentCount?: number;
  onCommentAdd?: (content: string, parentId?: string) => void;
  onCommentDelete?: (commentId: string) => void;
  onCommentReaction?: (commentId: string, reaction: string | null) => void;
  entityName?: string;
  allowCompanyReply?: boolean;
  sortBy?: CommentSortOption;
}

interface CommentItemProps {
  comment: Comment;
  onReply: (content: string, parentId: string) => void;
  onDelete?: (commentId: string) => void;
  onReactionChange: (commentId: string, reaction: string | null) => void;
  depth?: number;
  setShowAuthModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const SORT_OPTIONS = [
  {
    key: 'most_relevant',
    label: 'Most relevant',
    description: "Show friends' comments and the most engaging comments first.",
  },
  {
    key: 'newest',
    label: 'Newest',
    description: 'Show all comments with the newest comments first.',
  },
  {
    key: 'all',
    label: 'All comments',
    description: 'Show all comments, including potential spam.',
  },
] as const;

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onDelete,
  onReactionChange,
  depth = 0,
  setShowAuthModal
}) => {
  const { isAuthenticated } = useUnifiedAuth();
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const safeUserName = typeof comment.userName === 'string' && comment.userName.length > 0
    ? comment.userName
    : (typeof comment.authorName === 'string' && comment.authorName.length > 0
        ? comment.authorName
        : 'User');

  const handleReplySubmit = () => {
    if (replyContent.trim()) {
      onReply(replyContent, comment.id);
      setReplyContent('');
      setShowReplyBox(false);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const marginLeft = depth * 40;

  return (
    <div className="space-y-3 transition-all duration-200 hover:bg-blue-50/30 rounded-xl p-2 -m-2" style={{ marginLeft: `${marginLeft}px` }}>
      <div className="flex space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-sm border border-white/50">
            <span className="text-sm font-semibold text-gray-700">
              {safeUserName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Comment content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-semibold text-sm text-gray-900">
                {safeUserName}
              </span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {formatTimeAgo(comment.createdAt)}
              </span>
            </div>
            <p className="text-sm text-gray-800 leading-relaxed">{comment.content}</p>
          </div>

          {/* Facebook-style Reaction Summary */}
          <div className="relative group">
            <div className="px-4 py-1">
              <FacebookReactionSummary 
                reactions={comment.reactions}
                size="sm"
                showText={true}
                maxReactions={3}
              />
            </div>
          </div>

          {/* Comment actions */}
          <div className="flex items-center space-x-2 mt-2 px-4">
            <SocialReactionButton
              reactions={comment.reactions}
              userReaction={comment.userReaction}
              onReactionChange={async (reaction) => {
                await onReactionChange(comment.id, reaction);
              }}
              onRequireAuth={() => setShowAuthModal(true)}
            />
            
            <button
              onClick={() => setShowReplyBox(!showReplyBox)}
              className="text-xs text-gray-600 hover:text-blue-600 font-medium px-3 py-1.5 rounded-full hover:bg-blue-50 transition-all duration-200 flex items-center gap-1"
            >
              <Reply className="h-3 w-3" />
              Reply
            </button>
            
            {onDelete && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-xs text-gray-600 hover:text-red-600 font-medium px-3 py-1.5 rounded-full hover:bg-red-50 transition-all duration-200 flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            )}
            
            <button className="text-xs text-gray-600 hover:text-orange-600 font-medium px-3 py-1.5 rounded-full hover:bg-orange-50 transition-all duration-200 flex items-center gap-1">
              <Flag className="h-3 w-3" />
              Report
            </button>
            
            <button className="text-xs text-gray-600 hover:text-gray-800 p-1.5 rounded-full hover:bg-gray-100 transition-all duration-200">
              <MoreHorizontal className="h-3 w-3" />
            </button>
          </div>

          {/* Reply box */}
          {showReplyBox && (
            <div className="mt-3 px-4">
              <div className="flex space-x-2">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-gray-600">U</span>
                </div>
                <div className="flex-1">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Reply to ${safeUserName}...`}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      onClick={() => setShowReplyBox(false)}
                      className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReplySubmit}
                      disabled={!replyContent.trim()}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                    >
                      <Send className="h-3 w-3" />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ReviewComments: React.FC<ReviewCommentsProps> = ({
  reviewId,
  initialCommentCount = 5,
  onCommentAdd,
  onCommentDelete,
  onCommentReaction,
  entityName,
  allowCompanyReply = false,
  sortBy = 'most_relevant',
}) => {
  const { isAuthenticated, requireAuth } = useUnifiedAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [totalComments, setTotalComments] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const commentService = new CommentService();

  // Load initial comment count
  useEffect(() => {
    const loadCommentCount = async () => {
      try {
        const count = await commentService.getCommentCount(reviewId);
        setTotalComments(count);
        setHasMore(count > 0);
      } catch (error) {
        console.error('Failed to load comment count:', error);
      }
    };
    loadCommentCount();
  }, [reviewId]);

  // Load initial comments when showComments becomes true
  useEffect(() => {
    if (showComments && comments.length === 0) {
      loadInitialComments();
    }
  }, [showComments]);

  // Reload comments when sortBy changes
  useEffect(() => {
    if (showComments && comments.length > 0) {
      // Reset state and reload with new sorting
      setComments([]);
      setNextCursor(undefined);
      setHasMore(false);
      setIsLoading(true);
      loadInitialComments();
    }
  }, [sortBy]);

  // Add loading state effect for sort changes
  useEffect(() => {
    if (showComments) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [sortBy]);

  const loadInitialComments = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await commentService.getInitialComments(reviewId, initialCommentCount, sortBy);
      setComments(response.comments);
      setHasMore(response.hasMore);
      setNextCursor(response.nextCursor);
    } catch (error) {
      console.error('Failed to load initial comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreComments = async () => {
    if (isLoadingMore) return;
    
    console.log('Loading more comments...', { nextCursor, commentsLength: comments.length, sortBy });
    
    setIsLoadingMore(true);
    try {
      let response;
      
      if (nextCursor) {
        // Use cursor-based pagination if available
        console.log('Using cursor-based pagination');
        response = await commentService.loadMoreComments(reviewId, nextCursor, 10, sortBy);
      } else {
        // Fallback to page-based pagination
        console.log('Using page-based pagination fallback');
        const currentPage = Math.ceil(comments.length / 10) + 1;
        response = await commentService.getReviewComments(reviewId, {
          page: currentPage,
          limit: 10,
          sortBy: sortBy,
        });
      }
      
      console.log('Loaded more comments:', response);
      setComments(prev => [...prev, ...response.comments]);
      setHasMore(response.hasMore);
      setNextCursor(response.nextCursor);
    } catch (error) {
      console.error('Failed to load more comments:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      console.log('Comment is empty, not submitting');
      return;
    }
    
    if (!isAuthenticated) {
      console.log('User is not authenticated, cannot submit comment');
      alert('Please log in to comment');
      return;
    }
    
    console.log('Submitting comment with auth status:', isAuthenticated);
    
    try {
      const newCommentData = await commentService.createComment(reviewId, {
        content: newComment.trim()
      });
      
      setComments(prev => [newCommentData, ...prev]);
      setTotalComments(prev => prev + 1);
      setNewComment('');
      console.log('Comment submitted successfully:', newCommentData);
    } catch (error) {
      console.error('Failed to create comment:', error);
      if (error instanceof Error && error.message.includes('401')) {
        alert('Authentication error. Please log in again.');
      } else {
        alert('Failed to post comment. Please try again.');
      }
    }
  };

  const handleReply = async (content: string, parentId: string) => {
    try {
      const newCommentData = await commentService.createComment(reviewId, {
        content: content.trim(),
        parentId
      });
      
      setComments(prev => [newCommentData, ...prev]);
      setTotalComments(prev => prev + 1);
    } catch (error) {
      console.error('Failed to create reply:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await commentService.deleteComment(reviewId, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setTotalComments(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleReactionChange = async (commentId: string, reaction: string | null) => {
    try {
      if (reaction) {
        await commentService.addOrUpdateReaction(commentId, reaction);
      } else {
        await commentService.removeReaction(commentId);
      }
    } catch (error) {
      console.error('Failed to update reaction:', error);
    }
  };

  if (totalComments === 0) {
    return (
      <div className="space-y-4">
        {/* Add comment */}
        <div className="flex space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-gray-600">U</span>
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={`Add a comment${entityName ? ` about ${entityName}` : ''}...`}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-gray-500">
                {allowCompanyReply && (
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    Company replies allowed
                  </span>
                )}
              </div>
              <button
                onClick={handleSubmit}
                disabled={!newComment.trim() || !isAuthenticated}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Comment</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Sorting options preview */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Sorting Options Available:</span>
              <div className="flex items-center space-x-4 mt-1">
                <span className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Newest</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="h-3 w-3 rotate-180" />
                  <span>Oldest</span>
                </span>
                <span className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>Most Relevant</span>
                </span>
                <span className="flex items-center space-x-1">
                  <ThumbsUp className="h-3 w-3" />
                  <span>Most Liked</span>
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center py-8 text-gray-500">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add comment */}
      <div className="flex space-x-3">
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-medium text-gray-600">U</span>
        </div>
        <div className="flex-1">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={`Add a comment${entityName ? ` about ${entityName}` : ''}...`}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
          <div className="flex justify-between items-center mt-2">
            <div className="text-xs text-gray-500">
              {allowCompanyReply && (
                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  Company replies allowed
                </span>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!newComment.trim() || !isAuthenticated}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>Comment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comments section */}
      <div className="space-y-4">
        {/* Show comments button */}
        {!showComments && (
          <button
            onClick={() => setShowComments(true)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <MessageCircle className="h-4 w-4" />
            <span>View all {totalComments} comments</span>
            <ChevronDown className="h-4 w-4" />
          </button>
        )}

        {/* Comments list */}
        {showComments && (
          <>
            {/* Sorting status indicator */}
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg border text-sm">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  {sortBy === 'most_relevant' && (
                    <>
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-green-700 font-medium">Most Relevant</span>
                    </>
                  )}
                  {sortBy === 'newest' && (
                    <>
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-700 font-medium">Newest First</span>
                    </>
                  )}
                  {sortBy === 'oldest' && (
                    <>
                      <Clock className="w-4 h-4 text-gray-600 rotate-180" />
                      <span className="text-gray-700 font-medium">Oldest First</span>
                    </>
                  )}
                  {sortBy === 'most_liked' && (
                    <>
                      <ThumbsUp className="w-4 h-4 text-purple-600" />
                      <span className="text-purple-700 font-medium">Most Liked</span>
                    </>
                  )}
                </div>
                <span className="text-gray-500">•</span>
                <span className="text-gray-600">{totalComments} comments</span>
              </div>
              {isLoading && (
                <div className="flex items-center space-x-2 text-gray-500">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  <span className="text-xs">Sorting...</span>
                </div>
              )}
            </div>

            {/* Comments */}
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading comments...</p>
              </div>
            ) : (
              <div className="space-y-4 transition-all duration-300">
                {comments.map((comment, idx) => (
                  <div 
                    key={comment.id ? `comment-${comment.id}` : `idx-${idx}`}
                    className="animate-fadeIn"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <CommentItem
                      comment={comment}
                      onReply={handleReply}
                      onDelete={onCommentDelete ? handleDelete : undefined}
                      onReactionChange={handleReactionChange}
                      depth={0}
                      setShowAuthModal={setShowAuthModal}
                    />
                  </div>
                ))}
                
                {/* Load more button */}
                {hasMore && (
                  <div className="text-center pt-4">
                    <button
                      onClick={loadMoreComments}
                      disabled={isLoadingMore}
                      className="px-6 py-2 text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:bg-blue-50 rounded-lg"
                    >
                      {isLoadingMore ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span>Loading...</span>
                        </div>
                      ) : (
                        `Load more comments (${comments.length}/${totalComments} shown)`
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
          }}
        />
      )}
    </div>
  );
};

export default ReviewComments; 