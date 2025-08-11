# Entity Image Priority Fix

## Problem
Entity images were not loading properly due to incorrect priority order in image field selection.

## Solution
Fixed the image priority order to ensure **`imageUrl` has first priority, then `avatar`**.

## Changes Made

### 1. Updated EntityListCard.tsx
**Before:**
```typescript
const entityAvatar = entity?.imageUrl || entity?.image_url || entity?.avatar;
```

**After:**
```typescript
const displayAvatar = getEntityImage(entity, entityName);
```

### 2. Updated entityUtils.ts  
**Before:**
```typescript
avatar: entity.avatar || entity.imageUrl,
```

**After:**
```typescript
avatar: entity.imageUrl || entity.avatar,
```

### 3. Created imageUtils.ts
New utility module with standardized functions:
- `getEntityImage()` - Get entity image with correct priority
- `hasRealEntityImage()` - Check if entity has real (non-generated) image  
- `getEntityAvatar()` - Alias for getEntityImage()
- `getEntityImageSource()` - Get source of image being used (for debugging)

## Image Priority Order

The standardized priority order is now:

1. **`imageUrl`** - Primary image field (camelCase format)
2. **`avatar`** - Secondary image field (legacy/alternate field)  
3. **`image_url`** - Backend variant (snake_case format)
4. **Generated fallback** - UI-avatars with entity name

## Files Modified

- `/src/shared/components/EntityListCard.tsx` - Updated to use imageUtils
- `/src/shared/utils/entityUtils.ts` - Fixed avatar field priority
- `/src/shared/utils/imageUtils.ts` - **New file** with image utilities

## Benefits

1. **Consistent Priority**: `imageUrl` always checked first across the entire app
2. **Centralized Logic**: Single source of truth for image handling in `imageUtils.ts`
3. **Better Debugging**: Can identify which image source is being used
4. **Future-Proof**: Easy to modify priority or add new image fields

## Usage

```typescript
import { getEntityImage, hasRealEntityImage } from '../utils/imageUtils';

// Get entity image with proper priority
const imageUrl = getEntityImage(entity, entityName);

// Check if entity has real image
const hasRealImg = hasRealEntityImage(entity);
```

## Testing

- ✅ Build passes without errors
- ✅ TypeScript compilation successful
- ✅ All image priority logic updated consistently

The fix ensures that entities will show their `imageUrl` first, then fall back to `avatar`, providing the correct image display priority as requested.