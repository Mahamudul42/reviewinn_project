# User Profile Modal System

A professional, reusable user profile modal system that can be used throughout the ReviewInn application.

## Features

### ✨ Professional Design
- Clean, modern modal with avatar, badges, and stats
- Verified and premium user indicators
- User level and points display
- Last activity status
- Comprehensive user information layout

### 🔧 Reusable Architecture
- `useUserProfile` hook for state management
- `UserProfileLink` wrapper component for easy integration
- `createUserForProfile` utility for data transformation
- Flexible props for different use cases

### 🎯 Smart Behavior
- Only shows for other users (not current user)
- Configurable action buttons
- Follow/unfollow functionality
- Direct messaging integration
- Click-outside-to-close behavior

## Components

### 1. UserProfileModal
The main modal component with professional styling and comprehensive user information.

```tsx
<UserProfileModal
  user={extendedUser}
  isOpen={showModal}
  onClose={closeModal}
  onStartConversation={(user) => handleMessage(user)}
  onFollowUser={(userId) => handleFollow(userId)}
  onUnfollowUser={(userId) => handleUnfollow(userId)}
  isFollowing={isFollowing}
  currentUserId={currentUserId}
  showActions={true}
/>
```

### 2. useUserProfile Hook
Manages modal state and provides clean open/close methods.

```tsx
const { showProfileModal, selectedUser, openProfile, closeProfile } = useUserProfile();

// Open profile for any user
openProfile(createUserForProfile(userData));
```

### 3. UserProfileLink Component
Makes any content clickable to show user profiles.

```tsx
// Simple usage
<UserProfileLink user={user}>
  <span className="text-blue-600 hover:underline">{user.name}</span>
</UserProfileLink>

// With avatar
<UserProfileLink user={user} showActions={true}>
  <img src={user.avatar} className="w-8 h-8 rounded-full" />
</UserProfileLink>
```

## Usage Examples

### In Chat Components
```tsx
// Already integrated in ChatWindow and MessageBubble
// Automatically prevents showing current user's profile
```

### In Review Lists
```tsx
<UserProfileLink 
  user={review.author} 
  currentUserId={currentUser.id}
  showActions={true}
  onStartConversation={handleStartChat}
>
  <div className="flex items-center space-x-2">
    <img src={review.author.avatar} className="w-6 h-6 rounded-full" />
    <span className="font-medium">{review.author.name}</span>
  </div>
</UserProfileLink>
```

### In User Lists
```tsx
{users.map(user => (
  <UserProfileLink 
    key={user.id}
    user={user}
    currentUserId={currentUser.id}
    onFollowUser={handleFollow}
    isFollowing={followingUsers.includes(user.id)}
  >
    <div className="p-4 border rounded-lg hover:bg-gray-50">
      <div className="flex items-center space-x-3">
        <img src={user.avatar} className="w-10 h-10 rounded-full" />
        <div>
          <h3 className="font-medium">{user.name}</h3>
          <p className="text-sm text-gray-600">@{user.username}</p>
        </div>
      </div>
    </div>
  </UserProfileLink>
))}
```

### In Comments
```tsx
<UserProfileLink user={comment.author} currentUserId={currentUser.id}>
  <span className="font-medium text-gray-900 hover:text-blue-600">
    {comment.author.name}
  </span>
</UserProfileLink>
```

## User Data Format

The system accepts flexible user data and transforms it using `createUserForProfile`:

```tsx
// Minimum required
const user = {
  user_id: 123,
  username: 'john_doe',
  name: 'John Doe'
};

// Extended format (all optional)
const extendedUser = {
  user_id: 123,
  username: 'john_doe',
  name: 'John Doe',
  full_name: 'John Michael Doe',
  avatar: 'https://example.com/avatar.jpg',
  email: 'john@example.com',
  bio: 'Software developer passionate about reviews',
  location: 'New York, NY',
  review_count: 42,
  follower_count: 150,
  following_count: 89,
  level: 5,
  points: 1250,
  is_verified: true,
  is_premium: false,
  last_active: '2025-01-15T10:30:00Z'
};
```

## Integration Points

### Messaging System ✅
- ChatWindow header avatar and title
- MessageBubble avatars and usernames
- Prevents current user profile display

### Ready for Integration
- Review lists and author names
- Comment author names
- User search results
- Follower/following lists
- Leaderboards
- Social circle member lists

## Benefits

1. **Consistent UX**: Same profile experience across the app
2. **Professional Design**: Modern, clean interface with badges and stats
3. **Smart Behavior**: Context-aware actions and restrictions
4. **Easy Integration**: Drop-in components with flexible props
5. **Type Safety**: Full TypeScript support with proper interfaces
6. **Performance**: Efficient hook-based state management

## File Structure

```
src/
├── features/messaging/components/
│   ├── UserProfileModal.tsx          # Main modal component
│   └── README-UserProfile.md         # This documentation
├── hooks/
│   └── useUserProfile.ts              # Modal state management hook
└── shared/components/
    └── UserProfileLink.tsx            # Reusable wrapper component
```

This system provides a solid foundation for user profile interactions throughout the ReviewInn application while maintaining consistency and professional appearance.