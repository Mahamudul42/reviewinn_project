# Purple Theme Usage Guide

The purple theme system provides a consistent way to apply the brand purple colors (#9333ea) across your application. 

## Quick Usage

### 1. Using Purple Button Components (Easiest)

```tsx
import { PurpleButton } from '../shared/design-system';

// Simple purple button
<PurpleButton onClick={handleClick}>
  Click Me
</PurpleButton>

// Or just use the regular Button with purple variant
import { Button } from '../shared/ui';
<Button variant="purple" onClick={handleClick}>
  Click Me  
</Button>
```

### 2. Using Purple Theme Colors

```tsx
import { purpleTheme, purpleStyles } from '../shared/design-system';

// Using individual colors
<div style={{ backgroundColor: purpleTheme.primary }}>
  Purple background
</div>

// Using pre-built style objects
<button style={purpleStyles.button}>
  Custom purple button
</button>

// For toggles/tabs (like category modal)
<div style={purpleStyles.toggleBackground}>
  <button style={state.isActive ? purpleStyles.toggleActive : purpleStyles.toggleInactive}>
    Toggle Button
  </button>
</div>
```

### 3. Available Colors

- **Primary**: `#9333ea` (Main purple)
- **Primary Hover**: `#7c3aed` (Darker purple) 
- **Light Background**: `#e9d5ff` (Very light purple)
- **Border**: `#d8b4fe` (Light purple border)

### 4. Changing the Color System

To change the purple color across the entire app, just update the values in:
- `src/shared/design-system/colors.ts` - Update the `purple` color scale
- `src/shared/design-system/utils/purpleTheme.ts` - Colors will automatically update

## Examples in Your App

All these buttons now use the purple theme:
- ✅ "Continue" button (Category selection step)
- ✅ "Choose Image" button 
- ✅ "Skip for Now" button
- ✅ "Continue with Image" button
- ✅ Browse/Search toggle in category modal

## Single Point of Control

You can change the entire purple theme by modifying just one place:
`src/shared/design-system/colors.ts` → `purple.500` and `purple.600`

This will automatically update all buttons, toggles, and any component using the purple theme!