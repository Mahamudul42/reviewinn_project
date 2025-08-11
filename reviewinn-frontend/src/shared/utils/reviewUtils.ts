// Note: Category utilities have been moved to categoryUtils.ts
// This file now focuses only on review-specific utilities

// Time formatting utility
export const formatTimeAgo = (date: Date | string): string => {
  const now = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Unknown';
  }
  
  const diffInHours = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
  return dateObj.toLocaleDateString();
};

// Avatar initials generator
export const generateInitials = (name: string): string => {
  return name 
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';
};

// Content truncation utility
export const truncateContent = (content: string | undefined, maxLength: number = 200): {
  truncated: string;
  needsTruncation: boolean;
} => {
  if (!content || typeof content !== 'string') {
    return { truncated: '', needsTruncation: false };
  }
  
  const needsTruncation = content.length > maxLength;
  const truncated = needsTruncation ? content.slice(0, maxLength) + '...' : content;
  
  return { truncated, needsTruncation };
}; 