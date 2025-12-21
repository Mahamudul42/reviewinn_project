# Group Features - Quick Guide

## 🚀 Quick Access

### For Non-Members
```
Group Header → [Join Button] → Instant Access
```

### For Members
```
Reviews Tab → [FAB: Add Review] → Write group-specific review
Discussion Tab → [FAB: New Post] → Start discussion
Members Tab → [Invite Members] → Share group link
Members Tab → [Leave Button] → Leave group
```

### For Admins
```
Discussion Tab → Any post → [⋮] → Pin/Unpin post
Members Tab → Any member → [⋮] → Make Moderator / Remove Member
```

## 📋 Tab Structure

### 1️⃣ Reviews Tab
**What you see:**
- Filter bar showing review count
- Group-specific reviews only
- Pull-to-refresh

**Actions:**
- Tap FAB to add review (members only)
- Tap Filter button for sorting options
- Pull down to refresh

### 2️⃣ Discussion Tab
**What you see:**
- Pinned posts at top (with 📌 icon)
- Recent discussions
- Like and comment counts

**Actions:**
- Tap FAB to create new post
- Tap post to view details
- Like/Comment on posts
- Admin: Tap ⋮ to pin/unpin

### 3️⃣ About Tab
**What you see:**
- Group description
- Reviewable entity types
- Category-specific guidelines

**Actions:**
- Read group information
- Check what you can review

### 4️⃣ Members Tab
**What you see:**
- Complete member list
- Role badges (Admin/Moderator/Member)
- Join date and review count

**Actions:**
- Invite members (members only)
- Leave group (members only)
- Admin: Manage member roles

## 🎯 Key Features

### Group-Specific Reviews
✓ Reviews filtered by group ID
✓ Dedicated add review button
✓ Group context preserved

### Social Features
✓ Join/Leave functionality
✓ Member invitations via link
✓ Discussion posts
✓ Like and comment system

### Admin Tools
✓ Pin important posts
✓ Manage member roles
✓ Remove members
✓ Visual admin badge

## 💡 Tips

1. **First Time Visitor**: Click "Join" in the header to unlock all features
2. **Want to Share**: Use Members tab → Invite Members → Copy link
3. **Create Content**: FAB changes based on active tab - Reviews or Discussions
4. **Find Members**: Check Members tab for full list with roles
5. **Leave Safely**: Leave button in Members tab with confirmation dialog

## 🎨 Visual Indicators

| Icon | Meaning |
|------|---------|
| 📌 | Pinned post (important) |
| ⭐ | Admin role |
| 🎯 | Moderator role |
| 👤 | Regular member |
| ✓ | Verified badge |

## 🔔 State-Based UI

### Non-Member
- Join button in header (yellow)
- Limited access message in empty states
- About tab fully accessible

### Member
- Floating Action Buttons visible
- All tabs accessible
- Invite and Leave buttons available

### Admin
- All member features plus:
- Three-dot menus on posts
- Three-dot menus on members
- Pin/unpin functionality

## 📱 Responsive Elements

- **Header**: Collapses on scroll, shows group name
- **FAB**: Changes per tab, hides for non-members
- **Tabs**: Swipeable with scroll indicators
- **Cards**: Consistent spacing and shadows

## ⚡ Quick Actions

**Write a Review**
```
1. Go to Reviews tab
2. Tap FAB (floating button bottom-right)
3. Fill in review details
4. Submit
```

**Start a Discussion**
```
1. Go to Discussion tab
2. Tap FAB (floating button bottom-right)
3. Type your message
4. Add images/links (optional)
5. Tap Post
```

**Invite Friends**
```
1. Go to Members tab
2. Tap "Invite Members" button
3. Copy link or share directly
```

**Leave Group**
```
1. Go to Members tab
2. Tap "Leave" button (top right)
3. Confirm in dialog
```

## 🎯 Empty States

### No Reviews Yet (Member)
```
📝 Icon
"No Reviews Yet"
"Be the first to share a review in this group!"
[Write First Review] button
```

### Join to View (Non-Member)
```
🔒 Icon
"Join to View Reviews"
"Join [Group Name] to see and share reviews..."
[Join Group] button
```

---

**Quick Reference**: This guide covers the essential group features. For detailed implementation, see `GROUP_FEATURES_SUMMARY.md`
