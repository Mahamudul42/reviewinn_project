# ReviewInn Mobile Database Schema Guide

## 📁 Schema File
`mobile_optimized_schema.sql` - Complete database schema optimized for mobile app performance

## 🚀 Quick Start

### 1. Create Database
```bash
# Create PostgreSQL database
createdb reviewinn_mobile

# Or in psql
psql -U postgres
CREATE DATABASE reviewinn_mobile;
```

### 2. Run Schema
```bash
psql -U postgres -d reviewinn_mobile -f mobile_optimized_schema.sql
```

## 📊 Database Tables (16 Total)

### Core Tables
1. **users** - User accounts with JSONB preferences, stats, metadata
2. **entities** - Businesses/professionals/products with JSONB categories, tags, metadata
3. **reviews** ⭐ - Main table (denormalized for fast homepage)
4. **review_comments** - Comment threads
5. **review_likes** - Like tracking
6. **review_helpful_votes** - Helpful/not helpful votes

### Social Features
7. **user_connections** - Follow/circle/block with JSONB metadata
8. **bookmarks** - Saved items with JSONB preview data
9. **groups** - Community groups with JSONB settings
10. **group_members** - Group membership with roles

### Messaging
11. **conversations** - Chat containers with JSONB participant data
12. **messages** - Messages with JSONB attachments

### Other
13. **notifications** - User alerts with JSONB data
14. **badges** - Badge definitions with JSONB criteria
15. **user_badges** - User badge awards
16. **categories** - Hierarchical categories

## ⚡ Performance Features

### 1. Homepage Single-Table Query
```sql
-- ALL data in ONE query, NO JOINS!
SELECT * FROM reviews
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 15;
```

**Why it's fast:**
- User data denormalized (username, avatar, stats)
- Entity data denormalized (name, avatar, categories)
- Engagement cached (likes_count, comments_count, helpful_count)
- Uses single index: `idx_reviews_feed`

### 2. Auto-Updating Counters
All counters update automatically via triggers:
- `reviews.likes_count` - auto-updates when likes added/removed
- `reviews.comments_count` - auto-updates when comments added/removed
- `reviews.helpful_count` - auto-updates when votes added/removed
- `users.review_count` - auto-updates when reviews added/removed
- `users.follower_count` - auto-updates when follows added/removed
- `entities.review_count` - auto-updates when reviews added/removed
- `entities.average_rating` - auto-recalculates when reviews change
- `groups.member_count` - auto-updates when members join/leave
- `conversations.last_message_*` - auto-updates on new messages

### 3. JSONB Flexibility
No schema changes needed for:
- Adding new user preferences
- Adding custom entity metadata
- Storing review pros/cons/ratings
- Category hierarchies
- Notification data
- Message attachments
- Badge criteria

### 4. Strategic Indexes
- **GIN indexes** on all JSONB fields for fast filtering
- **Composite indexes** for common query patterns
- **Partial indexes** for filtered queries (is_active = true)
- **Full-text search** with pg_trgm extension

## 🔑 JSONB Fields Reference

### users.preferences
```json
{
  "theme": "dark",
  "language": "en",
  "notifications": {
    "email": true,
    "push": true,
    "comments": true,
    "likes": true
  },
  "privacy": {
    "show_email": false,
    "show_profile": true
  }
}
```

### users.stats
```json
{
  "level": 5,
  "points": 1250,
  "badges": ["first_review", "top_reviewer"],
  "achievements": [
    {"name": "10 Reviews", "earned_at": "2025-01-15"}
  ],
  "is_verified": true
}
```

### entities.metadata
```json
{
  "address": "123 Main St, City",
  "phone": "+1234567890",
  "website": "https://example.com",
  "hours": {
    "monday": "9:00-17:00",
    "tuesday": "9:00-17:00"
  },
  "social": {
    "instagram": "@username",
    "facebook": "page-id"
  },
  "business_info": {
    "founded": "2020",
    "employees": "50-100"
  }
}
```

### reviews.ratings
```json
{
  "food": 4.5,
  "service": 5.0,
  "ambiance": 3.5,
  "value": 4.0
}
```

### user_connections.metadata
```json
{
  "trust_level": "trusted_reviewer",
  "taste_match": 85,
  "notes": "Great taste in restaurants",
  "tags": ["foodie", "coffee_lover"]
}
```

### bookmarks.item_data
```json
{
  "title": "Amazing Italian Restaurant",
  "image": "https://...",
  "preview": "Best pasta I've ever had...",
  "rating": 4.8,
  "entity_name": "Luigi's Trattoria"
}
```

### messages.attachments
```json
[
  {
    "type": "image",
    "url": "https://...",
    "size": 1024,
    "name": "photo.jpg",
    "thumbnail": "https://..."
  }
]
```

### notifications.data
```json
{
  "actor": {
    "user_id": "uuid",
    "username": "john",
    "avatar": "https://..."
  },
  "entity": {
    "type": "review",
    "id": "uuid",
    "title": "Great restaurant"
  },
  "action_url": "/reviews/uuid",
  "preview": "John liked your review"
}
```

## 📈 Common Queries

### Homepage Feed (Paginated)
```sql
SELECT * FROM reviews
WHERE is_active = true
  AND review_scope = 'public'
ORDER BY created_at DESC
LIMIT 15 OFFSET 0;
```

### Entity Detail + Reviews
```sql
-- Get entity
SELECT * FROM entities WHERE entity_id = $1;

-- Get reviews for entity
SELECT * FROM reviews
WHERE entity_id = $1
  AND is_active = true
ORDER BY created_at DESC
LIMIT 10;
```

### User Profile + Stats
```sql
SELECT
  user_id,
  username,
  full_name,
  avatar,
  bio,
  review_count,
  follower_count,
  following_count,
  stats,
  created_at
FROM users
WHERE username = $1;
```

### Search Entities by Category
```sql
SELECT * FROM entities
WHERE root_category->>'slug' = 'restaurants'
  AND tags @> '["vegan"]'::jsonb
  AND is_active = true
ORDER BY average_rating DESC
LIMIT 20;
```

### User's Bookmarks
```sql
SELECT
  bookmark_id,
  item_type,
  item_id,
  item_data,
  created_at
FROM bookmarks
WHERE user_id = $1
ORDER BY created_at DESC;
```

### User's Circle (Connections)
```sql
SELECT
  c.connection_id,
  c.to_user_id,
  c.metadata,
  u.username,
  u.avatar,
  u.stats
FROM user_connections c
JOIN users u ON c.to_user_id = u.user_id
WHERE c.from_user_id = $1
  AND c.connection_type = 'circle'
ORDER BY c.created_at DESC;
```

### Group Members
```sql
SELECT * FROM group_members
WHERE group_id = $1
ORDER BY
  CASE role
    WHEN 'owner' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'moderator' THEN 3
    ELSE 4
  END,
  joined_at DESC;
```

### Unread Notifications
```sql
SELECT * FROM notifications
WHERE user_id = $1
  AND is_read = false
ORDER BY created_at DESC
LIMIT 50;
```

### Conversation List
```sql
SELECT * FROM conversations
WHERE participant_ids @> jsonb_build_array($1::text)
ORDER BY updated_at DESC;
```

## 🔄 Data Sync Strategy

### When Creating a Review
```sql
-- Insert review with denormalized data
INSERT INTO reviews (
  user_id, entity_id, title, content, rating,
  user_username, user_full_name, user_avatar,
  entity_name, entity_avatar, entity_categories
)
SELECT
  $1, $2, $3, $4, $5,
  u.username, u.full_name, u.avatar,
  e.name, e.avatar, e.categories
FROM users u, entities e
WHERE u.user_id = $1 AND e.entity_id = $2;

-- Triggers automatically update:
-- - users.review_count
-- - entities.review_count
-- - entities.average_rating
```

### When User Updates Profile
```sql
-- Update user
UPDATE users
SET full_name = $2, avatar = $3
WHERE user_id = $1;

-- Sync to reviews (keep denormalized data fresh)
UPDATE reviews
SET user_full_name = $2, user_avatar = $3
WHERE user_id = $1;
```

### When Entity Updates Name/Avatar
```sql
-- Update entity
UPDATE entities
SET name = $2, avatar = $3
WHERE entity_id = $1;

-- Sync to reviews
UPDATE reviews
SET entity_name = $2, entity_avatar = $3
WHERE entity_id = $1;
```

## 🎯 Migration from Old Schema

If migrating from existing schema:

```sql
-- 1. Backup old database
pg_dump reviewinn > backup.sql

-- 2. Create new database with new schema
createdb reviewinn_mobile
psql -d reviewinn_mobile -f mobile_optimized_schema.sql

-- 3. Migrate data (example for users)
INSERT INTO reviewinn_mobile.users (
  user_id, username, email, hashed_password,
  full_name, avatar, bio, preferences, stats
)
SELECT
  user_id, username, email, hashed_password,
  CONCAT(first_name, ' ', last_name) as full_name,
  avatar, bio,
  COALESCE(profile_data, '{}'::jsonb) as preferences,
  jsonb_build_object(
    'level', level,
    'points', points,
    'is_verified', is_verified
  ) as stats
FROM reviewinn.core_users;

-- 4. Migrate reviews with denormalized data
INSERT INTO reviewinn_mobile.reviews (...)
SELECT ... -- complex query to denormalize user/entity data
FROM reviewinn.review_main;
```

## ✅ Validation Queries

### Check Trigger Functionality
```sql
-- Insert test review
INSERT INTO reviews (...) VALUES (...);

-- Check if users.review_count incremented
SELECT review_count FROM users WHERE user_id = '...';

-- Add a like
INSERT INTO review_likes (review_id, user_id) VALUES ('...', '...');

-- Check if reviews.likes_count incremented
SELECT likes_count FROM reviews WHERE review_id = '...';
```

### Check Index Usage
```sql
EXPLAIN ANALYZE
SELECT * FROM reviews
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 15;

-- Should use: idx_reviews_feed
-- Should NOT show: Seq Scan
```

## 🔧 Maintenance

### Rebuild Indexes
```sql
REINDEX DATABASE reviewinn_mobile;
```

### Vacuum and Analyze
```sql
VACUUM ANALYZE;
```

### Check Database Size
```sql
SELECT
  pg_size_pretty(pg_database_size('reviewinn_mobile')) as db_size;
```

### Check Table Sizes
```sql
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 🐛 Troubleshooting

### If counters get out of sync:
```sql
-- Recalculate review counts
UPDATE users u
SET review_count = (
  SELECT COUNT(*) FROM reviews WHERE user_id = u.user_id
);

-- Recalculate likes counts
UPDATE reviews r
SET likes_count = (
  SELECT COUNT(*) FROM review_likes WHERE review_id = r.review_id
);

-- Recalculate average ratings
UPDATE entities e
SET average_rating = (
  SELECT COALESCE(AVG(rating), 0)::DECIMAL(3,2)
  FROM reviews
  WHERE entity_id = e.entity_id AND is_active = true
);
```

## 📚 Next Steps

1. ✅ Run schema file to create tables
2. Create FastAPI SQLAlchemy models matching this schema
3. Create Alembic migrations for version control
4. Add sample data for testing
5. Test homepage query performance
6. Update Flutter app API service to match endpoints
7. Implement file upload for images
8. Set up Redis for caching
9. Configure backup strategy
10. Deploy with Docker

---

**Created:** 2025-12-26
**Schema File:** `mobile_optimized_schema.sql`
**Total Tables:** 16
**Optimization Level:** High - Single table homepage queries
