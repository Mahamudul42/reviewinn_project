# Review Stats Service

The `reviewStatsService` provides a comprehensive, optimized solution for fetching and managing review statistics across the application. It ensures consistent data format and includes complete statistics like reactions, comments, views, and user interactions.

## Features

- **Comprehensive Statistics**: Automatically fetches and includes reaction counts, comment counts, view counts, and user reactions
- **Consistent Data Format**: Provides the same data structure across Homepage, User Profile, and Entity Detail pages
- **Intelligent Caching**: Caches review statistics to reduce API calls and improve performance
- **User Interaction Preservation**: Maintains user reactions and interactions across page reloads
- **Batch Processing**: Handles large sets of reviews efficiently by processing in batches
- **Optimistic Updates**: Supports real-time updates when users interact with reviews

## Usage

### Import the Service

```typescript
import { reviewStatsService } from '../services/reviewStatsService';
// Or use the hook for easier integration
import { useReviewStats } from '../hooks/useReviewStats';
```

### User Profile Page

```typescript
// Replace userService.getUserReviews with reviewStatsService
const result = await reviewStatsService.getUserReviewsWithStats(userId, {
  page: 1,
  limit: 10,
  includeAnonymous: isCurrentUser
});

// Reviews now include complete stats:
// - reactions: Record<string, number>
// - user_reaction: string | undefined  
// - view_count: number
// - comments: Comment[] (with correct length)
// - total_reactions: number
```

### Homepage Feed

```typescript
const result = await reviewStatsService.getHomepageReviewsWithStats({
  page: 1,
  limit: 15,
  sortBy: 'created_at',
  sortOrder: 'desc'
});
```

### Entity Detail Page

```typescript
const result = await reviewStatsService.getEntityReviewsWithStats(entityId, {
  page: 1,
  limit: 10,
  sortBy: 'view_count',
  sortOrder: 'desc'
});
```

### Real-time Updates

```typescript
// Update stats after user interactions
await reviewStatsService.updateReviewStats(reviewId, {
  reactions: { '👍': 5, '❤️': 3 },
  user_reaction: '👍',
  comment_count_change: 1,
  view_count_change: 1
});
```

### Cache Management

```typescript
// Invalidate cache for a specific review after updates
reviewStatsService.invalidateReviewCache(reviewId);

// Clear all cache when needed (e.g., on logout)
reviewStatsService.clearCache();

// Get cached review data
const cachedReview = reviewStatsService.getCachedReview(reviewId);
```

## Integration with Review Components

The service works seamlessly with `EnhancedReviewFeedCard` and other review components. Simply pass the callback functions to handle real-time updates:

```typescript
<EnhancedReviewFeedCard
  review={review}
  entity={review.entity}
  onReactionChange={handleReactionChange}
  onCommentAdd={handleCommentAdd}
  onCommentDelete={handleCommentDelete}
  onCommentReaction={handleCommentReaction}
/>
```

## Implementation Notes

### Why This Service?

1. **Inconsistent Data**: Previously, `userService.getUserReviews()` returned limited review data without complete statistics
2. **Missing User Reactions**: User reactions weren't preserved on page reload
3. **Inconsistent Display**: Different pages showed different levels of review information
4. **Performance Issues**: Multiple API calls for each review to get complete stats

### How It Solves These Issues

1. **Uses `reviewService` Consistently**: All methods use `reviewService.getReviews()` variants which include complete statistics
2. **Preserves User State**: Fetches current user's reactions from backend on each load
3. **Unified Interface**: Same data structure and API across all pages
4. **Smart Caching**: Reduces duplicate API calls while keeping data fresh

### Technical Details

- **Cache TTL**: 5 minutes by default
- **Batch Size**: Processes 10 reviews at a time to avoid overwhelming the server
- **Error Handling**: Gracefully degrades to original review data if enhancement fails
- **Memory Management**: Automatic cache cleanup with TTL-based expiration

## Migration Guide

### Before (User Profile)
```typescript
const result = await userService.getUserReviews(userId, params);
// Reviews missing reactions, views, user_reaction data
```

### After (User Profile)
```typescript  
const result = await reviewStatsService.getUserReviewsWithStats(userId, params);
// Reviews include complete statistics
```

This service ensures that all review displays are consistent, performant, and include all necessary user interaction data.