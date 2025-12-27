# Database Schema Comparison

## Current Live Database vs Mobile Optimized Schema

---

## 📊 Overview

### **Current Live Database** (reviewinn_database)
- **File**: `current_live_schema.sql`
- **Size**: 5058 lines
- **Tables**: 55 tables
- **Approach**: Normalized, complex relationships

### **Mobile Optimized Schema** (proposed)
- **File**: `mobile_optimized_schema.sql`
- **Tables**: 16 tables
- **Approach**: Denormalized for performance, JSONB for flexibility

---

## 📋 Current Live Database Tables (55 tables)

### **Core Tables**
1. core_users
2. core_entities
3. core_notifications
4. review_main

### **User Management** (11 tables)
- core_users
- user_profiles
- user_connections
- user_sessions
- user_settings
- user_progress
- user_badges
- user_entity_views
- user_events
- user_search_history
- followers

### **Entity Management** (6 tables)
- core_entities
- entity_metadata
- entity_roles
- entity_relations
- entity_analytics
- entity_views

### **Review System** (8 tables)
- review_main
- review_comments
- review_reactions
- review_versions
- review_templates
- review_views
- review_groups
- review_comment_reactions

### **Messaging System** (10 tables)
- msg_conversations
- msg_conversation_participants
- msg_messages
- msg_message_attachments
- msg_message_reactions
- msg_message_status
- msg_typing_indicators
- msg_user_presence
- msg_threads
- msg_message_pins
- msg_message_mentions

### **Social Features** (3 tables)
- social_circle_members
- social_circle_requests
- social_circle_blocks

### **Groups** (4 tables)
- group_categories
- group_category_mappings
- group_invitations
- group_memberships

### **Gamification** (6 tables)
- badges
- badge_definitions
- badge_awards
- daily_tasks
- weekly_engagement
- whats_next_goals

### **Analytics** (3 tables)
- search_analytics
- entity_analytics
- view_analytics
- entity_comparisons

### **Other** (2 tables)
- unified_categories
- category_questions

---

## 🆚 Key Differences

### **1. Number of Tables**
- **Current**: 55 tables (normalized approach)
- **Mobile**: 16 tables (denormalized approach)

### **2. Review Table Structure**

#### **Current: review_main** (Normalized)
```sql
- review_id
- user_id (FK)
- entity_id (FK)
- role_id (FK)
- title, content, overall_rating
- JSON fields: ratings, pros, cons, images
- Cached counts: view_count, reaction_count, comment_count
- NO user/entity denormalized data
```
**Homepage Query**: Requires JOINs with core_users and core_entities

#### **Mobile: reviews** (Denormalized)
```sql
- review_id
- user_id (FK)
- entity_id (FK)
- title, content, rating
- JSONB fields: images, pros, cons, ratings
- Denormalized user data: user_username, user_full_name, user_avatar, user_stats
- Denormalized entity data: entity_name, entity_avatar, entity_categories
- Cached counts: likes_count, comments_count, helpful_count, view_count
```
**Homepage Query**: NO JOINS needed - all data in one table

### **3. User Table Structure**

#### **Current: core_users + user_profiles**
- Split across 2 tables
- Many JSON fields: profile_data, preferences, verification_data, favorite_entities, favorite_reviews, etc.
- Uses INTEGER for user_id

#### **Mobile: users**
- Single table
- UUID for user_id
- 3 main JSONB fields: preferences, stats, metadata
- Cleaner, more organized

### **4. Entity Table Structure**

#### **Current: core_entities + entity_metadata + entity_roles + entity_relations**
- Split across 4 tables
- JSON fields: images, root_category, final_category, metadata, roles, related_entities, business_info, claim_data

#### **Mobile: entities**
- Single table
- JSONB fields: images, root_category, final_category, categories, tags, metadata
- Simpler structure

### **5. Data Types**

#### **Current**
- user_id: INTEGER
- entity_id: INTEGER
- rating: DECIMAL(3,2)
- Many VARCHAR with specific lengths

#### **Mobile**
- user_id: UUID
- entity_id: UUID
- rating: DECIMAL(3,2)
- Consistent UUID usage throughout

### **6. Social Features**

#### **Current**
- social_circle_members
- social_circle_requests
- social_circle_blocks
- user_connections
- followers

#### **Mobile**
- user_connections (handles follow, circle, block all in one table with connection_type)

### **7. Groups**

#### **Current**
- review_groups (group table)
- group_memberships
- group_invitations
- group_categories
- group_category_mappings

#### **Mobile**
- groups
- group_members
(Simpler structure, removed category mappings)

### **8. Messaging**

#### **Current: 10 tables**
- Highly normalized
- Separate tables for attachments, reactions, status, pins, mentions, threads, typing

#### **Mobile: 2 tables**
- conversations (with JSONB for participant_data, metadata)
- messages (with JSONB for attachments, metadata)
- Simpler, uses JSONB for flexibility

### **9. Notifications**

#### **Current: core_notifications**
- notification_id (INTEGER)
- JSONB: notification_data
- entity_type, entity_id for polymorphic relationships

#### **Mobile: notifications**
- notification_id (UUID)
- JSONB: data
- Cleaner structure

### **10. JSONB Usage**

#### **Current**
- Heavy JSONB usage across many tables
- Multiple JSON fields in core_users (15+ fields)
- Mixed JSON and specific columns

#### **Mobile**
- Strategic JSONB usage
- Consolidated: users (3 JSONB), entities (6 JSONB), reviews (6 JSONB)
- More organized and purposeful

---

## 🎯 What Mobile Schema Is Missing (from current)

### **Tables Not Included in Mobile Schema:**
1. **user_profiles** - Merged into users table
2. **entity_metadata** - Merged into entities.metadata JSONB
3. **entity_roles** - Could add if needed
4. **entity_relations** - Could add if needed
5. **review_versions** - Edit history
6. **review_templates** - Reusable templates
7. **review_comment_reactions** - Comment likes
8. **entity_comparisons** - Entity comparison feature
9. **search_analytics** - Search tracking
10. **view_analytics** - Aggregated analytics
11. **user_events** - User activity tracking
12. **user_search_history** - Search history
13. **user_entity_views** - View tracking
14. **user_progress** - Gamification progress
15. **daily_tasks** - Daily challenges
16. **weekly_engagement** - Weekly tracking
17. **whats_next_goals** - User goals
18. **badge_definitions** - Mobile has just "badges"
19. **badge_awards** - Separate awards tracking
20. **category_questions** - Category-specific questions

### **Features Not Included:**
- Edit history (review_versions)
- Review templates
- Comment reactions/likes
- Entity comparisons
- Detailed analytics tables
- User progress tracking tables
- Daily/weekly gamification tables
- Category questions

---

## ✅ What Mobile Schema Adds (that current doesn't have explicitly)

1. **Denormalized reviews table** - User and entity data embedded
2. **Simplified structure** - 16 tables vs 55
3. **UUID primary keys** - More distributed-system friendly
4. **Bookmarks table** - Polymorphic bookmarking (review, entity, group)
5. **Consolidated user_connections** - Follow, circle, block in one table
6. **Simpler messaging** - 2 tables vs 10
7. **Strategic JSONB** - Better organized than current

---

## 🤔 Questions for You

### **1. Denormalization Trade-off**
- **Current**: Normalized, requires JOINs for homepage
- **Mobile**: Denormalized, fast single-table queries
- **Question**: Is the performance gain worth the data duplication?

### **2. Missing Features**
Do you need any of these from current database?
- Review edit history (review_versions)
- Review templates (review_templates)
- Comment reactions/likes (review_comment_reactions)
- Entity comparisons (entity_comparisons)
- Detailed analytics tables
- User activity tracking (user_events)
- Search history (user_search_history)
- Gamification progress (user_progress, daily_tasks, weekly_engagement)
- Category questions

### **3. Data Types**
- **Current**: INTEGER for IDs
- **Mobile**: UUID for IDs
- **Question**: Do you want to keep INTEGER or switch to UUID?

### **4. Messaging Complexity**
- **Current**: 10 tables (typing indicators, pins, mentions, threads, etc.)
- **Mobile**: 2 tables with JSONB
- **Question**: Do you need all the messaging features from current?

### **5. Groups**
- **Current**: Has group_categories and group_category_mappings
- **Mobile**: Removed these, stores in JSONB
- **Question**: Do you need separate category tables for groups?

---

## 📝 Recommendations

### **Option 1: Start Fresh with Mobile Schema**
**Pros:**
- Clean, optimized for mobile performance
- Simpler to maintain
- Fast homepage queries

**Cons:**
- Lose some features from current database
- Need migration plan for existing data

### **Option 2: Hybrid Approach**
- Keep mobile denormalized structure for core tables (users, entities, reviews)
- Add back specific features you need from current database
- Examples: review_versions, entity_comparisons, detailed analytics

### **Option 3: Keep Current, Add Denormalized View**
- Keep current 55-table structure
- Create a materialized view for mobile homepage
- Hybrid: best of both worlds but more complex

---

## 📊 Side-by-Side Table Mapping

| Current Database | Mobile Schema | Notes |
|------------------|---------------|-------|
| core_users + user_profiles | users | Merged into one |
| core_entities + entity_metadata | entities | Merged, metadata in JSONB |
| review_main | reviews | Added denormalized user/entity data |
| review_comments | review_comments | Same concept |
| review_reactions | review_likes + review_helpful_votes | Split into 2 tables |
| social_circle_* + user_connections + followers | user_connections | Consolidated |
| review_groups + group_memberships | groups + group_members | Simplified |
| msg_* (10 tables) | conversations + messages | Consolidated with JSONB |
| core_notifications | notifications | Cleaner structure |
| badges + badge_definitions + badge_awards + user_badges | badges + user_badges | Simplified |
| unified_categories | categories | Same concept |

---

## 🎯 Next Steps

1. **Review this comparison**
2. **Decide on approach**: Fresh mobile schema, hybrid, or current + view
3. **List must-have features** from current database
4. **Approve or modify** mobile schema
5. **Plan migration** (if needed)

Take your time to compare and let me know what you want to keep, change, or add!
