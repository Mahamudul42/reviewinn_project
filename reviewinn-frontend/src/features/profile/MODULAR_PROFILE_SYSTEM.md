# 🎯 Modular User Profile System

## Overview

The modular user profile system provides a highly customizable and maintainable approach to building user profile pages. Each component is self-contained and can be easily modified, replaced, or extended without affecting other parts of the system.

## 🏗️ Architecture

### Core Components

The system is built around four main modular components:

1. **`ModularProfileHeader`** - User avatar, cover image, basic info, and action buttons
2. **`ModularProfileStats`** - User statistics and achievements display
3. **`ModularProfileEntitiesSection`** - User's entities/reviews with management actions
4. **`ModularProfileReviewsSection`** - User's reviews with editing capabilities

### Main Page Component

**`ModularUserProfilePage`** - Orchestrates all modular components and manages shared state

## 📁 File Structure

```
src/features/profile/
├── ModularUserProfilePage.tsx          # Main orchestrator component
├── components/
│   ├── ModularComponents.ts            # Export barrel for all modular components
│   ├── ModularProfileHeader.tsx        # Profile header with avatar & actions
│   ├── ModularProfileStats.tsx         # Statistics and achievements
│   ├── ModularProfileEntitiesSection.tsx # User's entities section
│   └── ModularProfileReviewsSection.tsx # User's reviews section
├── EnhancedUserProfilePage.tsx         # Legacy enhanced version
└── SimpleUserProfilePage.tsx           # Legacy simple version
```

## 🚀 Usage

### Basic Implementation

```tsx
import { ModularUserProfilePage } from './features/profile/ModularUserProfilePage';

// In your routing
<Route path="profile/:userIdentifier?" element={<ModularUserProfilePage />} />
```

### Custom Modular Layout

```tsx
import {
  ModularProfileHeader,
  ModularProfileStats,
  ModularProfileEntitiesSection,
  ModularProfileReviewsSection
} from './components/ModularComponents';

const CustomProfilePage = () => {
  // Your custom state management
  const [userProfile, setUserProfile] = useState(null);
  const [userReviews, setUserReviews] = useState([]);
  const [userEntities, setUserEntities] = useState([]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Custom order and styling */}
        <ModularProfileHeader
          userProfile={userProfile}
          isOwnProfile={isOwnProfile}
          currentUser={currentUser}
          stats={stats}
          onEditProfile={handleEditProfile}
          onFollow={handleFollow}
          onMessage={handleMessage}
          onAddToCircle={handleAddToCircle}
          className="custom-header-styles"
        />

        <ModularProfileStats
          userProfile={userProfile}
          isOwnProfile={isOwnProfile}
          stats={stats}
          className="custom-stats-styles"
        />

        {/* Custom sections order */}
        <ModularProfileReviewsSection
          reviews={userReviews}
          isCurrentUser={isCurrentUser}
          userName={userProfile.name}
          isLoading={reviewsLoading}
          hasMore={hasMoreReviews}
          onLoadMore={handleLoadMoreReviews}
          onReviewDropdown={handleReviewDropdown}
          reviewDropdownState={reviewDropdown}
          onCloseReviewDropdown={() => setReviewDropdown({ open: false, review: null, buttonRef: null })}
          getReviewDropdownActions={getReviewDropdownActions}
        />

        <ModularProfileEntitiesSection
          entities={userEntities}
          isCurrentUser={isCurrentUser}
          userName={userProfile.name}
          isLoading={entitiesLoading}
          hasMore={hasMoreEntities}
          onLoadMore={handleLoadMoreEntities}
          onEntityDropdown={handleEntityDropdown}
          entityDropdownState={entityDropdown}
          onCloseEntityDropdown={() => setEntityDropdown({ open: false, entity: null, buttonRef: null })}
          getEntityDropdownActions={getEntityDropdownActions}
        />
      </div>
    </DashboardLayout>
  );
};
```

## 🎨 Component Customization

### ModularProfileHeader

**Props:**
- `userProfile` - User profile data
- `isOwnProfile` - Whether current user owns this profile
- `currentUser` - Current authenticated user
- `stats` - User statistics object
- `onEditProfile` - Edit profile callback
- `onFollow` - Follow user callback
- `onMessage` - Message user callback
- `onAddToCircle` - Add to circle callback
- `className` - Custom CSS classes

**Features:**
- Beautiful gradient cover background
- Avatar with upload capability
- Action buttons (Edit, Follow, Message, Add to Circle)
- Achievement badges display
- Responsive design

### ModularProfileStats

**Props:**
- `userProfile` - User profile data
- `isOwnProfile` - Whether current user owns this profile
- `stats` - User statistics object
- `className` - Custom CSS classes

**Features:**
- Statistics cards (Reviews, Entities, Rating, Level)
- Achievement progress bars
- Responsive grid layout
- Hover effects and animations

### ModularProfileEntitiesSection

**Props:**
- `entities` - Array of user entities
- `isCurrentUser` - Whether viewing own profile
- `userName` - User's display name
- `isLoading` - Loading state
- `hasMore` - Whether more entities exist
- `onLoadMore` - Load more entities callback
- `onEntityDropdown` - Entity dropdown callback
- `entityDropdownState` - Dropdown state
- `onCloseEntityDropdown` - Close dropdown callback
- `getEntityDropdownActions` - Get dropdown actions callback

**Features:**
- Entity cards with management actions
- Infinite scroll pagination
- Edit/Delete entity functionality
- Responsive grid layout

### ModularProfileReviewsSection

**Props:**
- `reviews` - Array of user reviews
- `isCurrentUser` - Whether viewing own profile
- `userName` - User's display name
- `isLoading` - Loading state
- `hasMore` - Whether more reviews exist
- `onLoadMore` - Load more reviews callback
- `onReviewDropdown` - Review dropdown callback
- `reviewDropdownState` - Dropdown state
- `onCloseReviewDropdown` - Close dropdown callback
- `getReviewDropdownActions` - Get dropdown actions callback

**Features:**
- Review cards with editing capabilities
- Infinite scroll pagination
- Edit/Delete review functionality
- Star ratings and engagement metrics

## 🔧 State Management

The main page component (`ModularUserProfilePage`) manages all shared state:

```tsx
// Profile Data
const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
const [userReviews, setUserReviews] = useState<Review[]>([]);
const [userEntities, setUserEntities] = useState<Entity[]>([]);

// Loading States
const [isLoading, setIsLoading] = useState(true);
const [reviewsLoading, setReviewsLoading] = useState(false);
const [entitiesLoading, setEntitiesLoading] = useState(false);

// UI States
const [error, setError] = useState<string | null>(null);
const [hasMoreReviews, setHasMoreReviews] = useState(false);
const [hasMoreEntities, setHasMoreEntities] = useState(false);

// Modal States
const [editProfileModal, setEditProfileModal] = useState(false);
const [editEntityModal, setEditEntityModal] = useState<{ open: boolean; entity: Entity | null }>({ open: false, entity: null });
const [editReviewModal, setEditReviewModal] = useState<{ open: boolean; review: Review | null }>({ open: false, review: null });
```

## 🎯 Benefits

### 1. **Modularity**
- Each component is self-contained
- Easy to modify individual sections
- No tight coupling between components

### 2. **Reusability**
- Components can be used in different contexts
- Easy to create custom layouts
- Consistent styling across the app

### 3. **Maintainability**
- Clear separation of concerns
- Easy to debug and test
- Simple to add new features

### 4. **Performance**
- Lazy loading of components
- Optimized re-renders
- Efficient state management

### 5. **Customization**
- Flexible prop interfaces
- Custom styling support
- Extensible functionality

## 🔄 Migration from Legacy

The system supports easy migration from legacy profile pages:

1. **Replace the route** - Update App.tsx to use `ModularUserProfilePage`
2. **Customize components** - Modify individual modular components as needed
3. **Add custom logic** - Extend the main page component for additional functionality

## 🚀 Future Enhancements

### Planned Features:
- **Theme Support** - Dark/light mode variants
- **Animation Library** - Framer Motion integration
- **Accessibility** - ARIA labels and keyboard navigation
- **Internationalization** - Multi-language support
- **Analytics** - User interaction tracking
- **SEO** - Meta tags and structured data

### Extension Points:
- **Custom Sections** - Add new modular sections
- **Plugin System** - Third-party component integration
- **Configuration API** - Dynamic component configuration
- **Template System** - Pre-built layout templates

## 📝 Best Practices

### 1. **Component Design**
- Keep components focused and single-purpose
- Use TypeScript for type safety
- Implement proper error boundaries
- Add comprehensive prop validation

### 2. **State Management**
- Lift state up to the main component
- Use React hooks for local state
- Implement proper loading states
- Handle errors gracefully

### 3. **Performance**
- Use React.memo for expensive components
- Implement proper key props for lists
- Optimize re-renders with useCallback/useMemo
- Lazy load heavy components

### 4. **Accessibility**
- Add proper ARIA labels
- Ensure keyboard navigation
- Maintain color contrast ratios
- Support screen readers

### 5. **Testing**
- Write unit tests for each component
- Test prop variations
- Mock external dependencies
- Test user interactions

## 🎉 Conclusion

The modular user profile system provides a robust, flexible, and maintainable foundation for building user profile pages. With its clear architecture, comprehensive documentation, and extensive customization options, it enables developers to create beautiful and functional user profiles with ease.

The system is production-ready and has been successfully integrated into the ReviewInn application, replacing the legacy profile pages with a more modular and maintainable solution. 