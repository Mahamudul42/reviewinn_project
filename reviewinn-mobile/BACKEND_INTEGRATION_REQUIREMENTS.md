# Backend Integration Requirements for Group Features

## 🔌 API Endpoints Needed

### Group Management

#### 1. Join Group
```http
POST /api/groups/{groupId}/join
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Successfully joined the group",
  "group": {
    "id": 1,
    "name": "Tech Reviews",
    "memberCount": 125,
    "isMember": true,
    "isAdmin": false
  }
}
```

#### 2. Leave Group
```http
DELETE /api/groups/{groupId}/leave
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Successfully left the group"
}
```

#### 3. Get Group Details
```http
GET /api/groups/{groupId}
Authorization: Bearer {token}

Response:
{
  "id": 1,
  "name": "Tech Reviews",
  "description": "Share and discover tech reviews",
  "category": "Technology",
  "avatar": "https://...",
  "memberCount": 125,
  "postCount": 450,
  "relevantEntityTypes": ["Software", "Hardware", "Gadgets"],
  "isMember": true,
  "isAdmin": false,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Review Management

#### 4. Get Group Reviews
```http
GET /api/groups/{groupId}/reviews?page=1&limit=20&sort=recent
Authorization: Bearer {token}

Query Parameters:
- page: int (default: 1)
- limit: int (default: 20)
- sort: string (recent|popular|highest_rated)
- rating: int (optional, filter by rating)

Response:
{
  "reviews": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalReviews": 98,
    "hasMore": true
  }
}
```

#### 5. Create Review in Group
```http
POST /api/groups/{groupId}/reviews
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "entityId": 123,
  "title": "Great product!",
  "content": "Detailed review...",
  "rating": 4.5,
  "pros": ["Fast", "Reliable"],
  "cons": ["Expensive"],
  "images": ["url1", "url2"],
  "reviewScope": "group_only"
}

Response:
{
  "success": true,
  "review": { /* review object */ }
}
```

### Discussion Management

#### 6. Get Group Discussions
```http
GET /api/groups/{groupId}/discussions?page=1&limit=20
Authorization: Bearer {token}

Response:
{
  "discussions": [
    {
      "id": 1,
      "author": {
        "id": 10,
        "name": "Sarah Johnson",
        "avatar": "https://..."
      },
      "content": "Welcome to the group!",
      "isPinned": true,
      "likes": 24,
      "comments": 5,
      "createdAt": "2024-03-15T10:30:00Z"
    }
  ],
  "hasMore": true
}
```

#### 7. Create Discussion Post
```http
POST /api/groups/{groupId}/discussions
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "content": "Just had an amazing experience...",
  "images": ["url1"],
  "links": ["https://example.com"]
}

Response:
{
  "success": true,
  "discussion": { /* discussion object */ }
}
```

#### 8. Pin Discussion (Admin Only)
```http
POST /api/groups/{groupId}/discussions/{discussionId}/pin
Authorization: Bearer {token}

Response:
{
  "success": true,
  "isPinned": true
}
```

#### 9. Unpin Discussion (Admin Only)
```http
DELETE /api/groups/{groupId}/discussions/{discussionId}/pin
Authorization: Bearer {token}

Response:
{
  "success": true,
  "isPinned": false
}
```

### Member Management

#### 10. Get Group Members
```http
GET /api/groups/{groupId}/members?page=1&limit=50&role=all
Authorization: Bearer {token}

Query Parameters:
- role: string (all|admin|moderator|member)

Response:
{
  "members": [
    {
      "id": 10,
      "name": "Sarah Johnson",
      "avatar": "https://...",
      "role": "admin",
      "joinedAt": "2024-01-01T00:00:00Z",
      "reviewsCount": 45
    }
  ],
  "hasMore": false
}
```

#### 11. Update Member Role (Admin Only)
```http
PATCH /api/groups/{groupId}/members/{userId}/role
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "role": "moderator"
}

Response:
{
  "success": true,
  "member": {
    "id": 10,
    "role": "moderator"
  }
}
```

#### 12. Remove Member (Admin Only)
```http
DELETE /api/groups/{groupId}/members/{userId}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Member removed successfully"
}
```

### Invite Management

#### 13. Generate Invite Link
```http
POST /api/groups/{groupId}/invite-link
Authorization: Bearer {token}

Response:
{
  "success": true,
  "inviteLink": "https://reviewinn.com/groups/1/invite/abc123xyz",
  "expiresAt": "2024-04-15T10:30:00Z"
}
```

#### 14. Join via Invite Link
```http
POST /api/groups/join-by-invite/{inviteCode}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "group": { /* group object */ }
}
```

## 🗄️ Database Schema Requirements

### Groups Table
```sql
CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  avatar_url VARCHAR(500),
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Group Members Table
```sql
CREATE TABLE group_members (
  id SERIAL PRIMARY KEY,
  group_id INT REFERENCES groups(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- 'admin', 'moderator', 'member'
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, user_id)
);
```

### Group Reviews Table (Junction)
```sql
CREATE TABLE group_reviews (
  id SERIAL PRIMARY KEY,
  group_id INT REFERENCES groups(id) ON DELETE CASCADE,
  review_id INT REFERENCES reviews(id) ON DELETE CASCADE,
  posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, review_id)
);
```

### Group Discussions Table
```sql
CREATE TABLE group_discussions (
  id SERIAL PRIMARY KEY,
  group_id INT REFERENCES groups(id) ON DELETE CASCADE,
  author_id INT REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Group Discussion Images
```sql
CREATE TABLE group_discussion_images (
  id SERIAL PRIMARY KEY,
  discussion_id INT REFERENCES group_discussions(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Group Invite Links
```sql
CREATE TABLE group_invite_links (
  id SERIAL PRIMARY KEY,
  group_id INT REFERENCES groups(id) ON DELETE CASCADE,
  invite_code VARCHAR(100) UNIQUE NOT NULL,
  created_by INT REFERENCES users(id),
  expires_at TIMESTAMP,
  uses_count INT DEFAULT 0,
  max_uses INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Group Entity Types (What can be reviewed)
```sql
CREATE TABLE group_entity_types (
  id SERIAL PRIMARY KEY,
  group_id INT REFERENCES groups(id) ON DELETE CASCADE,
  entity_type VARCHAR(100) NOT NULL,
  UNIQUE(group_id, entity_type)
);
```

## 🔐 Authorization Rules

### Membership Checks
```javascript
// Check if user is a member
function isMember(userId, groupId) {
  return groupMembers.exists({ userId, groupId });
}

// Check if user is admin
function isAdmin(userId, groupId) {
  return groupMembers.exists({ 
    userId, 
    groupId, 
    role: 'admin' 
  });
}

// Check if user is moderator or admin
function isModerator(userId, groupId) {
  return groupMembers.exists({ 
    userId, 
    groupId, 
    role: ['admin', 'moderator'] 
  });
}
```

### Permission Matrix

| Action | Non-Member | Member | Moderator | Admin |
|--------|-----------|--------|-----------|-------|
| View Group Info | ✅ | ✅ | ✅ | ✅ |
| Join Group | ✅ | ❌ | ❌ | ❌ |
| View Reviews | ❌ | ✅ | ✅ | ✅ |
| Create Review | ❌ | ✅ | ✅ | ✅ |
| View Discussions | ❌ | ✅ | ✅ | ✅ |
| Create Post | ❌ | ✅ | ✅ | ✅ |
| View Members | ❌ | ✅ | ✅ | ✅ |
| Invite Members | ❌ | ✅ | ✅ | ✅ |
| Leave Group | ❌ | ✅ | ✅ | ⚠️* |
| Pin/Unpin Posts | ❌ | ❌ | ✅ | ✅ |
| Delete Posts | ❌ | ❌ | ✅ | ✅ |
| Make Moderator | ❌ | ❌ | ❌ | ✅ |
| Remove Members | ❌ | ❌ | ❌ | ✅ |
| Delete Group | ❌ | ❌ | ❌ | ✅ |

*Admin can't leave if they're the last admin

## 📊 Business Logic

### Review Scope Rules
```javascript
// When creating a review in a group
if (reviewScope === 'group_only') {
  // Review only visible to group members
  review.visibility = 'group';
} else if (reviewScope === 'public') {
  // Review visible to everyone
  review.visibility = 'public';
} else if (reviewScope === 'mixed') {
  // Review visible in both group and public feed
  review.visibility = 'public';
  review.groupId = groupId;
}
```

### Pinned Posts Rules
```javascript
// Max 3 pinned posts per group
const MAX_PINNED_POSTS = 3;

async function pinPost(groupId, discussionId, userId) {
  // Check if user is admin/moderator
  if (!isModerator(userId, groupId)) {
    throw new Error('Unauthorized');
  }
  
  // Check pinned posts count
  const pinnedCount = await getPinnedCount(groupId);
  if (pinnedCount >= MAX_PINNED_POSTS) {
    throw new Error('Maximum pinned posts reached');
  }
  
  // Pin the post
  await updateDiscussion(discussionId, { isPinned: true });
}
```

### Member Count Updates
```javascript
// Automatically update member count
async function joinGroup(userId, groupId) {
  await groupMembers.create({ userId, groupId });
  await groups.increment({ memberCount: 1 }, { where: { id: groupId } });
}

async function leaveGroup(userId, groupId) {
  await groupMembers.destroy({ where: { userId, groupId } });
  await groups.decrement({ memberCount: 1 }, { where: { id: groupId } });
}
```

### Post Count Updates
```javascript
// Update post count when discussion is created
async function createDiscussion(groupId, authorId, content) {
  const discussion = await groupDiscussions.create({
    groupId,
    authorId,
    content
  });
  
  await groups.increment({ postCount: 1 }, { where: { id: groupId } });
  
  return discussion;
}
```

## 🔔 Notifications

### Events to Notify
1. **New member joined** → Notify admins
2. **New review posted** → Notify all members
3. **New discussion post** → Notify all members
4. **Post pinned** → Notify all members
5. **Made moderator** → Notify the user
6. **Removed from group** → Notify the user
7. **Someone commented on your post** → Notify post author
8. **Your post was liked** → Notify post author

### Notification Payload Example
```json
{
  "type": "group_new_review",
  "groupId": 1,
  "groupName": "Tech Reviews",
  "actorId": 10,
  "actorName": "Sarah Johnson",
  "entityType": "review",
  "entityId": 123,
  "message": "Sarah Johnson posted a new review in Tech Reviews",
  "timestamp": "2024-03-15T10:30:00Z"
}
```

## 🧪 Test Cases

### Join Group
- [ ] Non-member can join public group
- [ ] Already member cannot join again
- [ ] Member count increases correctly
- [ ] User receives member role by default

### Create Review in Group
- [ ] Only members can create reviews
- [ ] Review is associated with correct group
- [ ] Review filtering works by groupId
- [ ] Review count updates correctly

### Pin Discussion
- [ ] Only admin/moderator can pin
- [ ] Maximum 3 pinned posts enforced
- [ ] Pinned posts appear first
- [ ] Unpin works correctly

### Member Management
- [ ] Admin can make member moderator
- [ ] Admin can remove member
- [ ] Admin cannot remove themselves if last admin
- [ ] Removed member loses access

### Leave Group
- [ ] Member can leave group
- [ ] Member count decreases
- [ ] Last admin cannot leave
- [ ] User's reviews remain but not visible in group

## 🚀 Next Steps

1. **Implement API endpoints** following the specifications above
2. **Set up database tables** with proper indexes
3. **Add authorization middleware** for route protection
4. **Implement notification system** for group events
5. **Create admin dashboard** for group management
6. **Add analytics** for group activity tracking
7. **Implement search** for groups and members
8. **Add moderation tools** for admins

## 📝 Frontend Integration Points

Update these files in the Flutter app:

1. **`lib/providers/review_provider.dart`**
   - Add `fetchGroupReviews(groupId)` method
   - Add `createGroupReview(groupId, reviewData)` method

2. **`lib/services/api_service.dart`**
   - Add all new API endpoints
   - Handle authentication headers

3. **`lib/screens/group_detail_screen.dart`**
   - Replace TODO comments with actual API calls
   - Connect to real data instead of mocks

4. **`lib/models/group_model.dart`** (if not exists)
   - Create Group model class
   - Add JSON serialization

5. **`lib/models/discussion_model.dart`** (create new)
   - Create Discussion model class
   - Add JSON serialization

---

**Priority**: High
**Estimated Backend Work**: 2-3 weeks
**Dependencies**: Authentication system, File upload service (for images)
