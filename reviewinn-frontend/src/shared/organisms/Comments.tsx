import React, { useState, useEffect } from 'react';
import { Send, MoreHorizontal, Reply, Flag, Trash2 } from 'lucide-react';
import type { Comment } from '../../types';
import SocialReactionButton from '../molecules/SocialReactionButton';

interface CommentsProps {
  comments: Comment[];
  onAddComment: (content: string, parentId?: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onReactionChange: (commentId: string, reaction: string | null) => void;
  entityName?: string;
  allowCompanyReply?: boolean;
}

interface CommentItemProps {
  comment: Comment;
  onReply: (content: string, parentId: string) => void;
  onDelete?: (commentId: string) => void;
  onReactionChange: (commentId: string, reaction: string | null) => void;
  depth?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onDelete,
  onReactionChange,
  depth = 0
}) => {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  // Robust fallback for userName
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
    <div className="space-y-3" style={{ marginLeft: `${marginLeft}px` }}>
      <div className="flex space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">
              {safeUserName.charAt(0)}
            </span>
          </div>
        </div>

        {/* Comment content */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-2xl px-4 py-3">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-medium text-sm text-gray-900">
                {safeUserName}
              </span>
              <span className="text-xs text-gray-500">
                {formatTimeAgo(comment.createdAt)}
              </span>
            </div>
            <p className="text-sm text-gray-800 leading-relaxed">{comment.content}</p>
          </div>

          {/* Comment actions */}
          <div className="flex items-center space-x-4 mt-2 px-4">
            <SocialReactionButton
              reactions={comment.reactions}
              userReaction={comment.userReaction}
              onReactionChange={(reaction) => onReactionChange(comment.id, reaction)}
            />
            
            <button
              onClick={() => setShowReplyBox(!showReplyBox)}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium"
            >
              <Reply className="h-3 w-3 inline mr-1" />
              Reply
            </button>
            
            {onDelete && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-xs text-gray-500 hover:text-red-600 font-medium"
              >
                <Trash2 className="h-3 w-3 inline mr-1" />
                Delete
              </button>
            )}
            
            <button className="text-xs text-gray-500 hover:text-gray-700">
              <Flag className="h-3 w-3 inline mr-1" />
              Report
            </button>
            
            <button className="text-xs text-gray-500 hover:text-gray-700">
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

const Comments: React.FC<CommentsProps> = ({
  comments,
  onAddComment,
  onDeleteComment,
  onReactionChange,
  entityName,
  allowCompanyReply = false
}) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = () => {
    if (newComment.trim()) {
      console.log('Submitting comment:', newComment);
      onAddComment(newComment);
      setNewComment('');
    }
  };

  const handleReply = (content: string, parentId: string) => {
    console.log('Submitting reply:', content, 'to parent:', parentId);
    onAddComment(content, parentId);
  };

  // Debug: log comments array before rendering
  useEffect(() => {
    console.log('Comments component received comments:', comments);
    console.log('Comments array length:', comments?.length || 0);
    console.log('Comments array type:', typeof comments);
    console.log('Is comments array?', Array.isArray(comments));
  }, [comments]);

  return (
    <div className="space-y-6">
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
              disabled={!newComment.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>Comment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-4">
        {comments && Array.isArray(comments) && comments.length > 0 ? (
          comments.map((comment, idx) => (
            <CommentItem
              key={comment.id ? `comment-${comment.id}` : `idx-${idx}`}
              comment={comment}
              onReply={handleReply}
              onDelete={onDeleteComment}
              onReactionChange={onReactionChange}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Comments;
