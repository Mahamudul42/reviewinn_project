# Review Card Action Modals

This directory contains all the modal components used for review card actions.

## Components

### 1. ReportReviewModal
- **Purpose**: Report inappropriate reviews
- **Features**:
  - Multiple predefined report reasons
  - Custom reason input
  - Review preview
  - Detailed descriptions for each reason
  - Form validation

### 2. BlockUserModal  
- **Purpose**: Block users from interactions
- **Features**:
  - User information display
  - Clear explanation of blocking effects
  - Confirmation required
  - Warning about consequences

### 3. SaveReviewModal
- **Purpose**: Save/bookmark reviews with organization
- **Features**:
  - Collection organization (Favorites, To Read Later, etc.)
  - Custom collection creation
  - Tag system with suggestions
  - Save/unsave toggle
  - Review preview

### 4. NotificationToggleModal
- **Purpose**: Manage notification preferences for reviews
- **Features**:
  - Multiple notification types (comments, reactions, updates)
  - Entity-specific notifications
  - Clear descriptions for each option
  - Settings summary

### 5. UnfollowEntityModal
- **Purpose**: Unfollow entities with confirmation
- **Features**:
  - Entity information display
  - Clear explanation of unfollowing effects
  - Visual entity preview with stats
  - Helpful tips about re-following

## Usage

All modals are automatically imported and used in `ReviewFeedCard.tsx`. Each modal:

- Has consistent design and UX patterns
- Includes loading states and error handling
- Provides clear user feedback
- Has proper keyboard accessibility
- Uses proper TypeScript interfaces

## Common Props

All modals share these common props:
- `isOpen: boolean` - Controls modal visibility
- `onClose: () => void` - Handler for closing the modal
- `review: Review` - The review being acted upon

## Error Handling

All modals include:
- Try/catch blocks for API calls
- Error state display
- Loading states during operations
- Graceful degradation