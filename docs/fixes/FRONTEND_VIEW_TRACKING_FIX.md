# Frontend View Count Update Solutions

## Problem
The backend view tracking is working correctly, but the frontend doesn't show updated view counts after a view is tracked.

## Root Cause
The frontend is likely not updating the UI state after the view tracking API call completes successfully.

## Solutions

### Option 1: Update Local State (Recommended)
```typescript
// In your view tracking function (useViewTracking.ts or similar)
const trackView = async (reviewId: number) => {
  try {
    const response = await viewTrackingAPI.trackReviewView(reviewId);
    
    if (response.tracked) {
      // Update local state with new view count
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, view_count: response.view_count }
          : review
      ));
      
      // Or if using global state management (Redux, Zustand, etc.)
      dispatch(updateReviewViewCount({ reviewId, viewCount: response.view_count }));
    }
  } catch (error) {
    console.error('View tracking failed:', error);
  }
};
```

### Option 2: Refetch Data After Tracking
```typescript
const trackView = async (reviewId: number) => {
  try {
    const response = await viewTrackingAPI.trackReviewView(reviewId);
    
    if (response.tracked) {
      // Refetch the review data to get updated counts
      await refetchReviews(); // Your data fetching function
      
      // Or for single review page
      await refetchReview(reviewId);
    }
  } catch (error) {
    console.error('View tracking failed:', error);
  }
};
```

### Option 3: Invalidate Cache (React Query/SWR)
```typescript
// If using React Query
const { mutate } = useMutation(viewTrackingAPI.trackReviewView, {
  onSuccess: (data, reviewId) => {
    if (data.tracked) {
      // Invalidate and refetch review data
      queryClient.invalidateQueries(['reviews']);
      queryClient.invalidateQueries(['review', reviewId]);
    }
  }
});

// If using SWR
const trackView = async (reviewId: number) => {
  const response = await viewTrackingAPI.trackReviewView(reviewId);
  
  if (response.tracked) {
    // Revalidate the data
    mutate(`/api/reviews/${reviewId}`);
    mutate('/api/reviews');
  }
};
```

### Option 4: Optimistic Updates
```typescript
const trackView = async (reviewId: number) => {
  // Optimistically update UI first
  setReviews(prev => prev.map(review => 
    review.id === reviewId 
      ? { ...review, view_count: (review.view_count || 0) + 1 }
      : review
  ));
  
  try {
    const response = await viewTrackingAPI.trackReviewView(reviewId);
    
    if (!response.tracked) {
      // Revert optimistic update if tracking failed
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, view_count: (review.view_count || 1) - 1 }
          : review
      ));
    } else {
      // Ensure we have the correct count from server
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, view_count: response.view_count }
          : review
      ));
    }
  } catch (error) {
    // Revert optimistic update on error
    setReviews(prev => prev.map(review => 
      review.id === reviewId 
        ? { ...review, view_count: (review.view_count || 1) - 1 }
        : review
    ));
  }
};
```

## Implementation Steps

1. **Find your view tracking function** (likely in `useViewTracking.ts` or `viewTracking.ts`)

2. **Identify your state management approach**:
   - Local React state (`useState`)
   - Global state (Redux, Zustand, Context)
   - Data fetching library (React Query, SWR)

3. **Implement the appropriate solution** based on your architecture

4. **Test the flow**:
   - View a review
   - Check that view count increments in UI immediately
   - Refresh page to confirm count persists

## Example for Common Patterns

### If using useState:
```typescript
// In your ReviewList component
const [reviews, setReviews] = useState([]);

const handleViewTracked = (reviewId: number, newCount: number) => {
  setReviews(prev => prev.map(review => 
    review.id === reviewId 
      ? { ...review, view_count: newCount }
      : review
  ));
};
```

### If using Context/Provider:
```typescript
// In your ReviewContext
const updateReviewViewCount = (reviewId: number, viewCount: number) => {
  setReviews(prev => prev.map(review => 
    review.id === reviewId 
      ? { ...review, view_count: viewCount }
      : review
  ));
};
```

## Backend Confirmation
✅ Backend is working perfectly:
- View tracking API: `POST /api/v1/reviews/{id}/view` 
- Returns: `{ tracked: true, view_count: 5, message: "View tracked successfully" }`
- Database properly updated
- Individual review API returns updated counts: `GET /api/v1/reviews/{id}`

The solution is purely frontend-side: **update the UI state after successful view tracking**.