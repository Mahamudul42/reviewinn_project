# Mobile-Optimized SQLAlchemy Models

These SQLAlchemy models match the `mobile_optimized_schema.sql` database schema and are designed for maximum performance with your Flutter mobile app.

## Features

### ⚡ Performance Optimizations
- **Denormalized `Review` model** - Contains user and entity data to avoid JOINs on homepage
- **Cached counters** - All counts (likes, comments, followers) auto-updated by DB triggers
- **JSONB fields** - Flexible schema without migrations
- **Strategic indexes** - Optimized for common query patterns

### 📦 Models Included

1. **User** - User accounts with JSONB preferences, stats, metadata
2. **Entity** - Businesses, professionals, places with JSONB categories, tags, metadata
3. **Review** - Reviews with denormalized user/entity data (⭐ single-table homepage query)
4. **ReviewComment** - Comments with threading support
5. **ReviewLike** - Like tracking
6. **ReviewHelpfulVote** - Helpful/not helpful votes
7. **Bookmark** - Saved reviews/entities/groups
8. **UserConnection** - Follow/circle/block relationships
9. **Group** - Community groups
10. **GroupMember** - Group membership with roles
11. **Conversation** - Message conversations
12. **Message** - Direct messages
13. **Notification** - User notifications
14. **Badge** - Badge definitions
15. **UserBadge** - User badge awards
16. **Category** - Hierarchical categories

## Usage

### Setup Database Connection

```python
# database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models_mobile.base import Base

# Database URL
DATABASE_URL = "postgresql://user:password@localhost/reviewinn_mobile"

# Create engine
engine = create_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=0,
    pool_pre_ping=True
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create all tables
Base.metadata.create_all(bind=engine)
```

### Import Models

```python
from models_mobile import (
    User, Entity, Review, ReviewComment,
    ReviewLike, ReviewHelpfulVote, Bookmark,
    UserConnection, Group, GroupMember,
    Conversation, Message, Notification,
    Badge, UserBadge, Category
)
```

### Example: Homepage Feed Query

```python
from sqlalchemy.orm import Session
from models_mobile import Review

def get_homepage_feed(db: Session, limit: int = 15, offset: int = 0):
    """
    Fast homepage query - NO JOINS needed!
    All data already denormalized in the reviews table.
    """
    reviews = db.query(Review)\
        .filter(Review.is_active == True)\
        .filter(Review.review_scope == 'public')\
        .order_by(Review.created_at.desc())\
        .limit(limit)\
        .offset(offset)\
        .all()

    # Convert to dict for API response
    return [review.to_dict() for review in reviews]
```

### Example: Create Review with Denormalized Data

```python
from models_mobile import Review, User, Entity

def create_review(db: Session, user_id: str, entity_id: str, data: dict):
    """
    Create a review with denormalized user and entity data.
    """
    # Fetch user and entity
    user = db.query(User).filter(User.user_id == user_id).first()
    entity = db.query(Entity).filter(Entity.entity_id == entity_id).first()

    # Create review with denormalized data
    review = Review(
        user_id=user.user_id,
        entity_id=entity.entity_id,
        title=data['title'],
        content=data['content'],
        rating=data['rating'],
        pros=data.get('pros', []),
        cons=data.get('cons', []),
        images=data.get('images', []),
        # Denormalized user data
        user_username=user.username,
        user_full_name=user.full_name,
        user_avatar=user.avatar,
        user_stats=user.stats,
        # Denormalized entity data
        entity_name=entity.name,
        entity_avatar=entity.avatar,
        entity_average_rating=entity.average_rating,
        entity_categories=entity.categories,
    )

    db.add(review)
    db.commit()
    db.refresh(review)

    # Note: users.review_count and entities.review_count
    # auto-update via database triggers

    return review
```

### Example: Like a Review

```python
from models_mobile import ReviewLike

def like_review(db: Session, review_id: str, user_id: str):
    """
    Like a review. The reviews.likes_count will auto-update via trigger.
    """
    like = ReviewLike(
        review_id=review_id,
        user_id=user_id
    )
    db.add(like)
    db.commit()
    # reviews.likes_count automatically increments via DB trigger!
```

### Example: Using JSONB Fields

```python
# Update user preferences (JSONB)
user = db.query(User).filter(User.user_id == user_id).first()
user.preferences = {
    "theme": "dark",
    "language": "en",
    "notifications": {
        "email": True,
        "push": True
    }
}
db.commit()

# Update user stats (JSONB)
user.stats = {
    "level": 5,
    "points": 1250,
    "badges": ["first_review", "top_reviewer"],
    "is_verified": True
}
db.commit()

# Update entity metadata (JSONB)
entity.metadata = {
    "address": "123 Main St",
    "phone": "+1234567890",
    "hours": {
        "monday": "9:00-17:00",
        "tuesday": "9:00-17:00"
    }
}
db.commit()
```

### Example: Filter by JSONB

```python
# Find entities with specific tag
entities = db.query(Entity)\
    .filter(Entity.tags.contains(['vegan']))\
    .all()

# Find entities in specific category
entities = db.query(Entity)\
    .filter(Entity.root_category['slug'].astext == 'restaurants')\
    .all()

# Find users with dark theme preference
users = db.query(User)\
    .filter(User.preferences['theme'].astext == 'dark')\
    .all()
```

### Example: Bookmarks

```python
from models_mobile import Bookmark

def bookmark_review(db: Session, user_id: str, review_id: str):
    """
    Bookmark a review with cached preview data.
    """
    review = db.query(Review).filter(Review.review_id == review_id).first()

    bookmark = Bookmark(
        user_id=user_id,
        item_type='review',
        item_id=review_id,
        # Cache preview data to avoid joins when fetching bookmarks
        item_data={
            "title": review.title,
            "image": review.images[0] if review.images else None,
            "preview": review.content[:200],
            "rating": float(review.rating),
            "entity_name": review.entity_name
        }
    )
    db.add(bookmark)
    db.commit()
```

### Example: User Connections (Circle/Follow)

```python
from models_mobile import UserConnection

def follow_user(db: Session, from_user_id: str, to_user_id: str):
    """
    Follow a user. The users.following_count and follower_count
    will auto-update via triggers.
    """
    connection = UserConnection(
        from_user_id=from_user_id,
        to_user_id=to_user_id,
        connection_type='follow'
    )
    db.add(connection)
    db.commit()
    # Both users' counts auto-update via DB triggers!

def add_to_circle(db: Session, from_user_id: str, to_user_id: str, trust_level: str):
    """
    Add user to circle with metadata.
    """
    connection = UserConnection(
        from_user_id=from_user_id,
        to_user_id=to_user_id,
        connection_type='circle',
        metadata={
            "trust_level": trust_level,
            "taste_match": 85,
            "notes": "Great food recommendations"
        }
    )
    db.add(connection)
    db.commit()
```

## Model Features

### User Model
- **JSONB Fields**: `preferences`, `stats`, `metadata`
- **Auto-counters**: `review_count`, `follower_count`, `following_count`
- **to_dict()**: Convert to API response format

### Entity Model
- **JSONB Fields**: `images`, `root_category`, `final_category`, `categories`, `tags`, `metadata`
- **Auto-counters**: `review_count`, `average_rating`, `view_count`
- **to_dict()**: Convert to API response format

### Review Model ⭐
- **Denormalized**: Contains user and entity data
- **JSONB Fields**: `images`, `pros`, `cons`, `ratings`, `user_stats`, `entity_categories`
- **Auto-counters**: `likes_count`, `comments_count`, `helpful_count`, `not_helpful_count`, `view_count`
- **to_dict()**: Matches Flutter `ReviewModel` format

## Database Triggers

All counters auto-update via PostgreSQL triggers (defined in `mobile_optimized_schema.sql`):

- ✅ `reviews.likes_count` - updates when likes added/removed
- ✅ `reviews.comments_count` - updates when comments added/removed
- ✅ `reviews.helpful_count` - updates when helpful votes added/removed
- ✅ `users.review_count` - updates when reviews added/removed
- ✅ `users.follower_count` - updates when follows added/removed
- ✅ `users.following_count` - updates when follows added/removed
- ✅ `entities.review_count` - updates when reviews added/removed
- ✅ `entities.average_rating` - recalculates when reviews change
- ✅ `groups.member_count` - updates when members join/leave
- ✅ `conversations.last_message_*` - updates when new messages arrive

## FastAPI Integration

### Create Dependency

```python
# dependencies.py
from sqlalchemy.orm import Session
from database import SessionLocal

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Use in Endpoints

```python
# routers/reviews.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from dependencies import get_db
from models_mobile import Review

router = APIRouter(prefix="/api/v1/reviews")

@router.get("/feed")
def get_feed(
    limit: int = 15,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Fast homepage feed - single table query!"""
    reviews = db.query(Review)\
        .filter(Review.is_active == True)\
        .filter(Review.review_scope == 'public')\
        .order_by(Review.created_at.desc())\
        .limit(limit)\
        .offset(offset)\
        .all()

    return {
        "reviews": [r.to_dict() for r in reviews],
        "total": db.query(Review).filter(Review.is_active == True).count(),
        "limit": limit,
        "offset": offset
    }
```

## Migration from Old Schema

If you have existing data in the old schema, create a migration script:

```python
# migrate_to_mobile_schema.py
from models import Review as OldReview, User as OldUser, Entity as OldEntity
from models_mobile import Review as NewReview

def migrate_reviews(old_db, new_db):
    """Migrate reviews with denormalized data"""
    old_reviews = old_db.query(OldReview).all()

    for old_review in old_reviews:
        new_review = NewReview(
            review_id=old_review.review_id,
            user_id=old_review.user_id,
            entity_id=old_review.entity_id,
            title=old_review.title,
            content=old_review.content,
            rating=old_review.rating,
            # Denormalize user data
            user_username=old_review.user.username,
            user_full_name=old_review.user.name,
            user_avatar=old_review.user.avatar,
            user_stats={
                "level": old_review.user.level,
                "is_verified": old_review.user.is_verified
            },
            # Denormalize entity data
            entity_name=old_review.entity.name,
            entity_avatar=old_review.entity.avatar,
            entity_categories=old_review.entity.categories,
            # Copy engagement counts
            likes_count=old_review.reaction_count,
            comments_count=old_review.comment_count,
        )
        new_db.add(new_review)

    new_db.commit()
```

## Testing

```python
# test_models.py
from models_mobile import User, Entity, Review
from database import SessionLocal

def test_create_review():
    db = SessionLocal()

    # Create user
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password="...",
        full_name="Test User"
    )
    db.add(user)
    db.commit()

    # Create entity
    entity = Entity(
        name="Test Restaurant",
        categories=[{"name": "Restaurant", "slug": "restaurant"}]
    )
    db.add(entity)
    db.commit()

    # Create review with denormalized data
    review = Review(
        user_id=user.user_id,
        entity_id=entity.entity_id,
        title="Great place!",
        content="Amazing food and service",
        rating=4.5,
        user_username=user.username,
        user_full_name=user.full_name,
        entity_name=entity.name,
        entity_categories=entity.categories
    )
    db.add(review)
    db.commit()

    # Verify
    assert review.review_id is not None
    assert review.user_username == "testuser"
    assert review.entity_name == "Test Restaurant"

    db.close()
```

## Best Practices

1. **Always denormalize when creating reviews** - Copy user and entity data
2. **Let triggers handle counters** - Don't manually update counts
3. **Use JSONB for flexible data** - Avoid schema changes
4. **Use to_dict() for API responses** - Consistent format matching Flutter models
5. **Index JSONB fields** - For fields you filter/search on (already done in schema)
6. **Keep denormalized data in sync** - When user/entity updates, update reviews too

## Next Steps

1. Create Pydantic schemas that match these models
2. Set up Alembic for migrations
3. Create FastAPI endpoints using these models
4. Test with Flutter app
5. Add caching layer (Redis) for frequently accessed data
