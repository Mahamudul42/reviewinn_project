"""
Shared utility functions for the review platform.
Provides common functionality used across multiple domains.
"""

import secrets
import re
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from email_validator import validate_email, EmailNotValidError
from sqlalchemy.orm import Query


def generate_id() -> str:
    """Generate a unique identifier."""
    return str(uuid.uuid4())


def generate_short_id(length: int = 8) -> str:
    """Generate a short random identifier."""
    return secrets.token_urlsafe(length)[:length]


# LEGACY PASSWORD FUNCTIONS ELIMINATED
# All password operations now use the production authentication system:
# - auth.production_auth_system.ProductionAuthSystem._hash_password()
# - auth.production_auth_system.ProductionAuthSystem._verify_password()
# 
# To use password hashing/verification:
# from auth.production_auth_system import get_auth_system
# auth_system = get_auth_system()
# hashed = auth_system._hash_password(password)
# verified = auth_system._verify_password(password, hashed)



def validate_email_address(email: str) -> bool:
    """Validate email address format."""
    try:
        validate_email(email)
        return True
    except EmailNotValidError:
        return False


def sanitize_text(text: str, max_length: Optional[int] = None) -> str:
    """Sanitize text input by removing harmful content."""
    if not text:
        return ""
    
    # Remove null bytes and control characters
    sanitized = ''.join(char for char in text if ord(char) > 31 or char in '\t\n\r')
    
    # Strip whitespace
    sanitized = sanitized.strip()
    
    # Truncate if needed
    if max_length and len(sanitized) > max_length:
        sanitized = sanitized[:max_length].rstrip()
    
    return sanitized


def validate_username(username: str) -> bool:
    """Validate username format."""
    if not username or len(username) < 3 or len(username) > 30:
        return False
    
    # Only allow alphanumeric characters, underscores, and hyphens
    pattern = r'^[a-zA-Z0-9_-]+$'
    return bool(re.match(pattern, username))


# LEGACY PASSWORD VALIDATION ELIMINATED
# All password validation now uses the production authentication system:
# - auth.production_auth_system.ProductionAuthSystem._validate_production_password()
# 
# The production system provides enterprise-grade password validation including:
# - 12+ character minimum (production security)
# - Character complexity requirements
# - Common pattern detection
# - Personal information detection
# - Breach database checking
# - Advanced security validations
#
# To use password validation:
# from auth.production_auth_system import get_auth_system
# auth_system = get_auth_system()
# errors = auth_system._validate_production_password(password, user_data)


def format_datetime(dt: datetime, format_type: str = "iso") -> str:
    """Format datetime for consistent output."""
    if not dt:
        return ""
    
    if format_type == "iso":
        return dt.isoformat()
    elif format_type == "human":
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    elif format_type == "date":
        return dt.strftime("%Y-%m-%d")
    elif format_type == "time":
        return dt.strftime("%H:%M:%S")
    else:
        return dt.isoformat()


def parse_datetime(dt_string: str) -> Optional[datetime]:
    """Parse datetime string into datetime object."""
    if not dt_string:
        return None
    
    try:
        # Try ISO format first
        return datetime.fromisoformat(dt_string.replace('Z', '+00:00'))
    except ValueError:
        try:
            # Try common formats
            formats = [
                "%Y-%m-%d %H:%M:%S",
                "%Y-%m-%d",
                "%Y/%m/%d %H:%M:%S",
                "%Y/%m/%d"
            ]
            
            for fmt in formats:
                try:
                    return datetime.strptime(dt_string, fmt)
                except ValueError:
                    continue
        except Exception:
            pass
    
    return None


def paginate_query(query: Query, page: int = 1, size: int = 20, max_size: int = 100) -> Dict[str, Any]:
    """Paginate a SQLAlchemy query."""
    # Validate parameters
    page = max(1, page)
    size = min(max(1, size), max_size)
    
    # Calculate offset
    offset = (page - 1) * size
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    items = query.offset(offset).limit(size).all()
    
    # Calculate pagination info
    total_pages = (total + size - 1) // size
    has_next = page < total_pages
    has_prev = page > 1
    
    return {
        "items": items,
        "pagination": {
            "page": page,
            "size": size,
            "total": total,
            "total_pages": total_pages,
            "has_next": has_next,
            "has_prev": has_prev
        }
    }


def calculate_average_rating(ratings: List[Union[int, float]]) -> float:
    """Calculate average rating from a list of ratings."""
    if not ratings:
        return 0.0
    
    return sum(ratings) / len(ratings)


def calculate_rating_distribution(ratings: List[int]) -> Dict[int, int]:
    """Calculate rating distribution (1-5 stars)."""
    distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    
    for rating in ratings:
        if 1 <= rating <= 5:
            distribution[rating] += 1
    
    return distribution


def truncate_text(text: str, max_length: int, suffix: str = "...") -> str:
    """Truncate text to a maximum length with suffix."""
    if not text or len(text) <= max_length:
        return text
    
    truncated_length = max_length - len(suffix)
    if truncated_length <= 0:
        return suffix[:max_length]
    
    return text[:truncated_length].rstrip() + suffix


def extract_mentions(text: str) -> List[str]:
    """Extract @mentions from text."""
    if not text:
        return []
    
    pattern = r'@([a-zA-Z0-9_-]+)'
    matches = re.findall(pattern, text)
    return list(set(matches))  # Remove duplicates


def extract_hashtags(text: str) -> List[str]:
    """Extract #hashtags from text."""
    if not text:
        return []
    
    pattern = r'#([a-zA-Z0-9_-]+)'
    matches = re.findall(pattern, text)
    return list(set(matches))  # Remove duplicates


def generate_slug(text: str, max_length: int = 50) -> str:
    """Generate a URL-friendly slug from text."""
    if not text:
        return ""
    
    # Convert to lowercase and replace spaces/special chars with hyphens
    slug = re.sub(r'[^\w\s-]', '', text.lower())
    slug = re.sub(r'[-\s]+', '-', slug)
    
    # Remove leading/trailing hyphens
    slug = slug.strip('-')
    
    # Truncate if needed
    if len(slug) > max_length:
        slug = slug[:max_length].rstrip('-')
    
    return slug


def is_valid_url(url: str) -> bool:
    """Validate URL format."""
    if not url:
        return False
    
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    
    return bool(url_pattern.match(url))


def mask_sensitive_data(data: str, mask_char: str = "*", visible_chars: int = 4) -> str:
    """Mask sensitive data like emails or phone numbers."""
    if not data or len(data) <= visible_chars:
        return mask_char * len(data) if data else ""
    
    visible_start = visible_chars // 2
    visible_end = visible_chars - visible_start
    
    return (
        data[:visible_start] +
        mask_char * (len(data) - visible_chars) +
        data[-visible_end:] if visible_end > 0 else ""
    )


def deep_merge_dicts(dict1: Dict[str, Any], dict2: Dict[str, Any]) -> Dict[str, Any]:
    """Deep merge two dictionaries."""
    result = dict1.copy()
    
    for key, value in dict2.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge_dicts(result[key], value)
        else:
            result[key] = value
    
    return result


def calculate_similarity(text1: str, text2: str) -> float:
    """Calculate simple text similarity using Jaccard similarity."""
    if not text1 or not text2:
        return 0.0
    
    set1 = set(text1.lower().split())
    set2 = set(text2.lower().split())
    
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    
    return intersection / union if union > 0 else 0.0