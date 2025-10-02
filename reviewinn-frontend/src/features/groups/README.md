# Modular Groups Feature

This directory contains a modular, well-structured implementation of the Groups feature with clean separation of concerns.

> **Note**: The original monolithic `UnifiedGroupsPage` has been replaced with this modular version. All functionality remains the same with improved architecture.

## 📁 Project Structure

```
groups/
├── components/               # UI Components
│   ├── GroupsTabs.tsx       # Tab navigation component
│   ├── YourGroupsTab.tsx    # User's groups tab content
│   ├── DiscoverGroupsTab.tsx # Public groups discovery tab
│   ├── CreateGroupTab.tsx   # Group creation tab content
│   ├── UserGroupCard.tsx    # Card component for user groups
│   ├── PublicGroupCard.tsx  # Card component for public groups
│   ├── GroupCreationForm.tsx # Group creation form
│   ├── GroupMemberManagement.tsx # Group member management (for detail pages)
│   ├── GroupSettings.tsx    # Group settings (for detail pages)
│   ├── GroupReviews.tsx     # Group reviews (for detail pages)
│   ├── GroupFeed.tsx        # Group feed (for detail pages)
│   └── ImageUpload.tsx      # Image upload component
├── hooks/                   # Custom React Hooks
│   ├── useGroupsLogic.ts    # Main groups page state management hook
│   └── useGroups.ts         # Legacy hooks for detail pages
├── services/                # API & Business Logic
│   ├── groupsApiService.ts  # Groups API service (modular)
│   ├── groupService.ts      # Legacy group service (for detail pages)
│   ├── groupCreationService.ts # Group creation logic
│   └── imageUploadService.ts # Image upload service
├── utils/                   # Utility Functions
│   └── groupUtils.ts        # Helper functions (initials, navigation, etc.)
├── types/                   # TypeScript Interfaces
│   └── index.ts             # All type definitions
├── UnifiedGroupsPage.tsx    # Modular main groups page
├── GroupDetailPage.tsx      # Group detail page (uses legacy components)
└── index.ts                 # Public API exports
```

## 🚀 Usage

### Using the Main Groups Page

```tsx
import { UnifiedGroupsPage } from '../features/groups';

// Use directly in your routing - same as before
<Route path="/groups" component={UnifiedGroupsPage} />
```

### Using Individual Components

```tsx
import { 
  GroupsTabs, 
  YourGroupsTab, 
  DiscoverGroupsTab,
  useGroupsPage 
} from '../features/groups';

function CustomGroupsPage() {
  const { activeTab, setActiveTab, userGroups, loading, isAuthenticated } = useGroupsPage();

  return (
    <div>
      <GroupsTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'your-groups' && (
        <YourGroupsTab 
          groups={userGroups} 
          loading={loading} 
          isAuthenticated={isAuthenticated} 
        />
      )}
    </div>
  );
}
```

### Using the Custom Hook

```tsx
import { useGroupsPage } from '../features/groups/hooks/useGroupsLogic';

function MyComponent() {
  const {
    userGroups,
    filteredPublicGroups,
    loading,
    joinGroup,
    refreshGroupsData
  } = useGroupsPage();

  // Use the state and methods as needed
}
```

## 🧩 Key Components

### 1. **useGroups Hook**
Central state management for all groups functionality:
- Manages user groups, public groups, loading states
- Handles group joining, searching, and data refresh
- Provides computed values like filtered groups

### 2. **GroupsApiService**
Clean API abstraction:
- Handles authentication tokens
- Provides methods for fetching groups, joining groups, creating groups
- Centralized error handling and logging

### 3. **Modular Tab Components**
Each tab is a separate component:
- **YourGroupsTab**: Displays user's joined groups
- **DiscoverGroupsTab**: Public groups with search and join functionality
- **CreateGroupTab**: Group creation interface
- **GroupsTabs**: Navigation between tabs

### 4. **Card Components**
Reusable group display components:
- **UserGroupCard**: For groups the user belongs to
- **PublicGroupCard**: For discoverable groups with join button

## 🎯 Benefits of Modular Architecture

### **🔧 Maintainability**
- Each component has a single responsibility
- Easy to locate and fix issues
- Clear separation between UI, logic, and data

### **🔄 Reusability**
- Components can be used independently
- Easy to create custom group interfaces
- Hook can be reused in different contexts

### **🧪 Testability**
- Individual components can be unit tested
- Business logic is separated from UI
- Mocking is straightforward

### **📈 Scalability**
- Easy to add new features without affecting existing code
- Components can be enhanced independently
- Clear interfaces between modules

### **👥 Team Collaboration**
- Different developers can work on different components
- Clear boundaries reduce merge conflicts
- Self-documenting structure

## 🔄 What Changed

### ✅ Migration Complete

The original monolithic `UnifiedGroupsPage.tsx` has been **replaced** with a modular version that provides:

- **Same Functionality**: All original features work exactly the same
- **Same API**: No changes to how you import or use the component
- **Improved Architecture**: Clean separation of concerns with modular components
- **Better Maintainability**: Each component has a single responsibility
- **Enhanced Reusability**: Components can be used independently

### Key Improvements Made

1. **Modular Components**: Split the large component into focused sub-components
2. **Custom Hook**: Extracted business logic into `useGroupsPage()` hook  
3. **Service Layer**: Separated API calls into dedicated service classes
4. **Type Safety**: Improved TypeScript interfaces and type definitions
5. **Utility Functions**: Common helpers moved to utility modules

### Backward Compatibility

✅ **No breaking changes** - your existing imports and usage continue to work:

```tsx
// This still works exactly the same
import { UnifiedGroupsPage } from './features/groups';
<Route path="/groups" component={UnifiedGroupsPage} />
```

The component now uses the new modular architecture under the hood while maintaining the same external interface.

## 🛠️ Development Guidelines

### Adding New Features

1. **New Tab**: Create a new tab component in `components/`
2. **New API**: Add methods to `groupsApiService.ts`
3. **New State**: Extend the `useGroups` hook
4. **New Types**: Add to `types/index.ts`

### Component Guidelines

- Keep components focused on presentation
- Use the `useGroups` hook for state management
- Handle business logic in services
- Use TypeScript interfaces for all props

### Testing Strategy

- Unit test individual components
- Integration test the `useGroups` hook
- Mock API calls in tests
- Test user interactions and state changes

## 📋 API Reference

### useGroupsPage Hook

```tsx
const {
  // State
  userGroups: Group[],
  publicGroups: Group[],
  loading: boolean,
  searchQuery: string,
  joiningGroupId: number | null,
  isCreatingGroup: boolean,
  activeTab: TabType,
  filteredPublicGroups: Group[],
  isAuthenticated: boolean,
  
  // Actions
  setActiveTab: (tab: TabType) => void,
  updateState: (updates: Partial<GroupsState>) => void,
  refreshGroupsData: () => Promise<{ userGroups: Group[]; publicGroups: Group[]; }>,
  joinGroup: (groupId: number) => Promise<void>,
  
  // Computed
  hasUserGroups: boolean,
  hasPublicGroups: boolean,
} = useGroupsPage();
```

### GroupsApiService

```tsx
import { groupsApiService } from './services/groupsApiService';

// Fetch groups
const groups = await groupsApiService.fetchGroups(userGroupsOnly?: boolean);

// Join a group
await groupsApiService.joinGroup(groupId: number);

// Create a group
const newGroup = await groupsApiService.createGroup(groupData: any);
```

## 🎨 Styling

The modular components use the same Tailwind CSS classes as the original, ensuring visual consistency while improving code organization.

## 🔮 Future Enhancements

- Add group management features
- Implement real-time updates
- Add more sophisticated search and filtering
- Enhance accessibility features
- Add animations and transitions

---

This modular architecture provides a solid foundation for scaling the Groups feature while maintaining code quality and developer experience.