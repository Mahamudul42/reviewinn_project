"""
Application constants for the review platform.
Defines common constants used across multiple domains.
"""

from enum import Enum


# Pagination
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100
MIN_PAGE_SIZE = 1

# Common limits and thresholds
DEFAULT_ENTITY_AVERAGE_RATING = 0.0
DEFAULT_ENTITY_REVIEW_COUNT = 0

# Text limits
MAX_ENTITY_NAME_LENGTH = 200
MAX_USERNAME_LENGTH = 30
MIN_USERNAME_LENGTH = 3
MAX_BIO_LENGTH = 500
MAX_CATEGORY_NAME_LENGTH = 100

# File upload
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_AVATAR_SIZE = 2 * 1024 * 1024  # 2MB
SUPPORTED_IMAGE_FORMATS = {
    'image/jpeg', 'image/png', 'image/webp', 'image/gif'
}
SUPPORTED_AVATAR_FORMATS = {
    'image/jpeg', 'image/png', 'image/webp'
}

# Rating system
MIN_RATING = 1
MAX_RATING = 5
RATING_SCALE = list(range(MIN_RATING, MAX_RATING + 1))

# Cache TTL (in seconds)
CACHE_TTL_SHORT = 300      # 5 minutes
CACHE_TTL_MEDIUM = 1800    # 30 minutes
CACHE_TTL_LONG = 3600      # 1 hour
CACHE_TTL_EXTENDED = 86400 # 24 hours

# Rate limiting
DEFAULT_RATE_LIMIT = 60    # requests per minute
AUTH_RATE_LIMIT = 10       # login attempts per minute
REVIEW_RATE_LIMIT = 5      # reviews per minute

# JWT token expiration (in seconds)
ACCESS_TOKEN_EXPIRE = 3600        # 1 hour
REFRESH_TOKEN_EXPIRE = 2592000    # 30 days
RESET_TOKEN_EXPIRE = 900          # 15 minutes

# Search
MAX_SEARCH_RESULTS = 100
MIN_SEARCH_QUERY_LENGTH = 2
MAX_SEARCH_QUERY_LENGTH = 100


class UserRole(str, Enum):
    """User role enumeration."""
    ADMIN = "admin"
    MODERATOR = "moderator"
    USER = "user"
    VERIFIED = "verified"
    SUSPENDED = "suspended"


class UserStatus(str, Enum):
    """User account status enumeration."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    BANNED = "banned"
    PENDING_VERIFICATION = "pending_verification"


class EntityType(str, Enum):
    """Entity type enumeration."""
    RESTAURANT = "restaurant"
    HOTEL = "hotel"
    BUSINESS = "business"
    SERVICE = "service"
    PRODUCT = "product"
    PLACE = "place"
    EVENT = "event"
    OTHER = "other"


class EntityStatus(str, Enum):
    """Entity status enumeration."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING_APPROVAL = "pending_approval"
    REJECTED = "rejected"
    CLAIMED = "claimed"
    VERIFIED = "verified"


class ReviewStatus(str, Enum):
    """Review status enumeration."""
    PUBLISHED = "published"
    DRAFT = "draft"
    FLAGGED = "flagged"
    HIDDEN = "hidden"
    DELETED = "deleted"


class NotificationType(str, Enum):
    """Notification type enumeration."""
    REVIEW_REPLY = "review_reply"
    REVIEW_LIKE = "review_like"
    FOLLOW = "follow"
    MENTION = "mention"
    ENTITY_CLAIM = "entity_claim"
    SYSTEM_ANNOUNCEMENT = "system_announcement"
    CIRCLE_INVITE = "circle_invite"
    CIRCLE_REQUEST = "circle_request"
    ENTITY_UPDATE = "entity_update"


class NotificationStatus(str, Enum):
    """Notification status enumeration."""
    UNREAD = "unread"
    READ = "read"
    ARCHIVED = "archived"


class ReportReason(str, Enum):
    """Report/flag reason enumeration."""
    SPAM = "spam"
    INAPPROPRIATE_CONTENT = "inappropriate_content"
    FAKE_REVIEW = "fake_review"
    HARASSMENT = "harassment"
    COPYRIGHT = "copyright"
    DUPLICATE = "duplicate"
    OTHER = "other"


class ReportStatus(str, Enum):
    """Report status enumeration."""
    PENDING = "pending"
    REVIEWED = "reviewed"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class ActivityType(str, Enum):
    """User activity type enumeration."""
    REVIEW_CREATED = "review_created"
    REVIEW_UPDATED = "review_updated"
    REVIEW_DELETED = "review_deleted"
    ENTITY_CREATED = "entity_created"
    ENTITY_CLAIMED = "entity_claimed"
    USER_FOLLOWED = "user_followed"
    CIRCLE_JOINED = "circle_joined"
    CIRCLE_LEFT = "circle_left"


class CircleType(str, Enum):
    """Review circle type enumeration."""
    PUBLIC = "public"
    PRIVATE = "private"
    INVITE_ONLY = "invite_only"


class CircleRole(str, Enum):
    """Circle member role enumeration."""
    OWNER = "owner"
    ADMIN = "admin"
    MODERATOR = "moderator"
    MEMBER = "member"


class InviteStatus(str, Enum):
    """Invitation status enumeration."""
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"


class SortOrder(str, Enum):
    """Sort order enumeration."""
    ASC = "asc"
    DESC = "desc"


class SortField(str, Enum):
    """Common sort fields enumeration."""
    CREATED_AT = "created_at"
    UPDATED_AT = "updated_at"
    NAME = "name"
    RATING = "rating"
    POPULARITY = "popularity"
    RELEVANCE = "relevance"


# Permission constants
PERMISSIONS = {
    'users': {
        'create': 'users:create',
        'read': 'users:read',
        'update': 'users:update',
        'delete': 'users:delete',
        'admin': 'users:admin'
    },
    'entities': {
        'create': 'entities:create',
        'read': 'entities:read',
        'update': 'entities:update',
        'delete': 'entities:delete',
        'claim': 'entities:claim',
        'verify': 'entities:verify'
    },
    'reviews': {
        'create': 'reviews:create',
        'read': 'reviews:read',
        'update': 'reviews:update',
        'delete': 'reviews:delete',
        'moderate': 'reviews:moderate'
    },
    'categories': {
        'create': 'categories:create',
        'read': 'categories:read',
        'update': 'categories:update',
        'delete': 'categories:delete'
    },
    'circles': {
        'create': 'circles:create',
        'read': 'circles:read',
        'update': 'circles:update',
        'delete': 'circles:delete',
        'admin': 'circles:admin'
    }
}

# Default permissions by role
ROLE_PERMISSIONS = {
    UserRole.ADMIN: [
        perm for category in PERMISSIONS.values() 
        for perm in category.values()
    ],
    UserRole.MODERATOR: [
        PERMISSIONS['users']['read'],
        PERMISSIONS['entities']['read'],
        PERMISSIONS['entities']['verify'],
        PERMISSIONS['reviews']['read'],
        PERMISSIONS['reviews']['moderate'],
        PERMISSIONS['categories']['read'],
        PERMISSIONS['circles']['read']
    ],
    UserRole.VERIFIED: [
        PERMISSIONS['entities']['create'],
        PERMISSIONS['entities']['read'],
        PERMISSIONS['entities']['claim'],
        PERMISSIONS['reviews']['create'],
        PERMISSIONS['reviews']['read'],
        PERMISSIONS['reviews']['update'],
        PERMISSIONS['reviews']['delete'],
        PERMISSIONS['categories']['read'],
        PERMISSIONS['circles']['create'],
        PERMISSIONS['circles']['read']
    ],
    UserRole.USER: [
        PERMISSIONS['entities']['read'],
        PERMISSIONS['reviews']['create'],
        PERMISSIONS['reviews']['read'],
        PERMISSIONS['reviews']['update'],
        PERMISSIONS['reviews']['delete'],
        PERMISSIONS['categories']['read'],
        PERMISSIONS['circles']['read']
    ]
}

# Error codes
ERROR_CODES = {
    'VALIDATION_ERROR': 'VALIDATION_ERROR',
    'NOT_FOUND': 'NOT_FOUND',
    'UNAUTHORIZED': 'UNAUTHORIZED',
    'FORBIDDEN': 'FORBIDDEN',
    'CONFLICT': 'CONFLICT',
    'RATE_LIMIT_EXCEEDED': 'RATE_LIMIT_EXCEEDED',
    'INTERNAL_ERROR': 'INTERNAL_ERROR'
}

# Email templates
EMAIL_TEMPLATES = {
    'welcome': 'welcome_email.html',
    'password_reset': 'password_reset_email.html',
    'email_verification': 'email_verification.html',
    'review_notification': 'review_notification.html',
    'circle_invite': 'circle_invite.html'
}

# Regex patterns
PATTERNS = {
    'email': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    'username': r'^[a-zA-Z0-9_-]{3,30}$',
    'phone': r'^\+?1?\d{9,15}$',
    'url': r'^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$'
}

# API response messages
MESSAGES = {
    'success': {
        'created': 'Resource created successfully',
        'updated': 'Resource updated successfully',
        'deleted': 'Resource deleted successfully',
        'retrieved': 'Resource retrieved successfully'
    },
    'error': {
        'not_found': 'Resource not found',
        'unauthorized': 'Authentication required',
        'forbidden': 'Access denied',
        'validation_failed': 'Validation failed',
        'internal_error': 'Internal server error',
        'rate_limit': 'Rate limit exceeded'
    }
}