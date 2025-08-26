"""
Enterprise-Grade Input Validation and Sanitization
=================================================
Comprehensive input validation to prevent XSS, injection attacks, and data integrity issues.
"""

import re
import html
from typing import Any, Dict, List, Optional, Union
from urllib.parse import urlparse
from datetime import datetime
import logging

# Try to import bleach, fall back to basic HTML escaping if not available
try:
    import bleach
    HAS_BLEACH = True
except ImportError:
    HAS_BLEACH = False
    bleach = None

logger = logging.getLogger(__name__)

class InputValidator:
    """Enterprise-grade input validation and sanitization"""
    
    # XSS Protection - Allowed HTML tags and attributes
    ALLOWED_HTML_TAGS = [
        'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'blockquote',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a'
    ]
    
    ALLOWED_HTML_ATTRIBUTES = {
        'a': ['href', 'title'],
        '*': ['class']
    }
    
    # Security patterns for validation
    PATTERNS = {
        'email': re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'),
        'url': re.compile(r'^https?://[^\s/$.?#].[^\s]*$'),
        'phone': re.compile(r'^\+?1?[2-9]\d{2}[2-9]\d{2}\d{4}$'),
        'alphanumeric': re.compile(r'^[a-zA-Z0-9]+$'),
        'username': re.compile(r'^[a-zA-Z0-9_]{3,30}$'),
        'safe_text': re.compile(r'^[a-zA-Z0-9\s\-_.,!?()]+$'),
        'sql_injection': re.compile(r'(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)|([\'";])', re.IGNORECASE),
        'xss_script': re.compile(r'<script[^>]*>.*?</script>', re.IGNORECASE | re.DOTALL),
        'html_entity': re.compile(r'&[a-zA-Z0-9#]+;')
    }
    
    @staticmethod
    def sanitize_html(content: str, strip_all: bool = False) -> str:
        """
        Sanitize HTML content to prevent XSS attacks
        
        Args:
            content: HTML content to sanitize
            strip_all: If True, remove all HTML tags
            
        Returns:
            Sanitized HTML content
        """
        if not content:
            return ""
        
        if strip_all or not HAS_BLEACH:
            # Fall back to simple HTML escaping if bleach not available
            return html.escape(content.strip())
        
        # Sanitize with allowed tags and attributes using bleach
        cleaned = bleach.clean(
            content,
            tags=InputValidator.ALLOWED_HTML_TAGS,
            attributes=InputValidator.ALLOWED_HTML_ATTRIBUTES,
            strip=True
        )
        
        return cleaned
    
    @staticmethod
    def sanitize_text(text: str, max_length: Optional[int] = None) -> str:
        """
        Sanitize plain text input
        
        Args:
            text: Text to sanitize
            max_length: Maximum allowed length
            
        Returns:
            Sanitized text
        """
        if not text:
            return ""
        
        # HTML escape to prevent XSS
        sanitized = html.escape(text.strip())
        
        # Truncate if needed
        if max_length and len(sanitized) > max_length:
            sanitized = sanitized[:max_length].rstrip()
        
        return sanitized
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        if not email or len(email) > 254:
            return False
        return bool(InputValidator.PATTERNS['email'].match(email.lower()))
    
    @staticmethod
    def validate_url(url: str) -> bool:
        """Validate URL format and scheme"""
        if not url:
            return False
        
        try:
            parsed = urlparse(url)
            return parsed.scheme in ['http', 'https'] and parsed.netloc
        except Exception:
            return False
    
    @staticmethod
    def validate_username(username: str) -> bool:
        """Validate username format"""
        if not username:
            return False
        return bool(InputValidator.PATTERNS['username'].match(username))
    
    @staticmethod
    def check_sql_injection(text: str) -> bool:
        """
        Check for potential SQL injection patterns
        
        Returns:
            True if potentially malicious, False if safe
        """
        if not text:
            return False
        
        return bool(InputValidator.PATTERNS['sql_injection'].search(text))
    
    @staticmethod
    def check_xss_patterns(text: str) -> bool:
        """
        Check for potential XSS patterns
        
        Returns:
            True if potentially malicious, False if safe
        """
        if not text:
            return False
        
        # Check for script tags
        if InputValidator.PATTERNS['xss_script'].search(text):
            return True
        
        # Check for javascript: URLs
        if 'javascript:' in text.lower():
            return True
        
        # Check for event handlers
        event_handlers = ['onclick', 'onload', 'onmouseover', 'onerror', 'onsubmit']
        text_lower = text.lower()
        if any(handler in text_lower for handler in event_handlers):
            return True
        
        return False
    
    @staticmethod
    def validate_password_strength(password: str) -> Dict[str, Any]:
        """
        Validate password strength
        
        Returns:
            Dict with validation results and recommendations
        """
        if not password:
            return {'valid': False, 'errors': ['Password is required']}
        
        errors = []
        score = 0
        
        # Length check
        if len(password) < 12:
            errors.append('Password must be at least 12 characters long')
        else:
            score += 2
        
        # Character variety checks
        if not re.search(r'[a-z]', password):
            errors.append('Password must contain at least one lowercase letter')
        else:
            score += 1
        
        if not re.search(r'[A-Z]', password):
            errors.append('Password must contain at least one uppercase letter')
        else:
            score += 1
        
        if not re.search(r'\d', password):
            errors.append('Password must contain at least one number')
        else:
            score += 1
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append('Password must contain at least one special character')
        else:
            score += 1
        
        # Common password checks
        common_passwords = ['password', '123456', 'qwerty', 'admin', 'login']
        if password.lower() in common_passwords:
            errors.append('Password is too common')
            score = 0
        
        # Repeated characters check
        if re.search(r'(.)\1{3,}', password):
            errors.append('Password contains too many repeated characters')
            score -= 1
        
        strength = 'weak'
        if score >= 6:
            strength = 'very_strong'
        elif score >= 4:
            strength = 'strong'
        elif score >= 2:
            strength = 'medium'
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'strength': strength,
            'score': max(0, score)
        }
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Sanitize filename for safe storage"""
        if not filename:
            return "unnamed_file"
        
        # Remove path separators and dangerous characters
        sanitized = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '_', filename)
        
        # Remove leading/trailing dots and spaces
        sanitized = sanitized.strip('. ')
        
        # Ensure it's not empty
        if not sanitized:
            sanitized = "unnamed_file"
        
        # Limit length
        if len(sanitized) > 255:
            name, ext = sanitized.rsplit('.', 1) if '.' in sanitized else (sanitized, '')
            max_name_length = 250 - len(ext)
            sanitized = name[:max_name_length] + ('.' + ext if ext else '')
        
        return sanitized
    
    @staticmethod
    def validate_file_upload(filename: str, content_type: str, file_size: int, 
                           allowed_types: List[str], max_size: int) -> Dict[str, Any]:
        """
        Validate file upload parameters
        
        Returns:
            Dict with validation results
        """
        errors = []
        
        # Filename validation
        if not filename:
            errors.append('Filename is required')
        elif len(filename) > 255:
            errors.append('Filename is too long')
        
        # File size validation
        if file_size <= 0:
            errors.append('File is empty')
        elif file_size > max_size:
            errors.append(f'File size exceeds maximum allowed size of {max_size} bytes')
        
        # Content type validation
        if content_type not in allowed_types:
            errors.append(f'File type {content_type} is not allowed')
        
        # Extension validation
        if filename:
            ext = filename.lower().split('.')[-1] if '.' in filename else ''
            allowed_extensions = [t.split('/')[-1] for t in allowed_types if '/' in t]
            
            if ext and allowed_extensions and ext not in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
                errors.append(f'File extension .{ext} is not allowed')
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'sanitized_filename': InputValidator.sanitize_filename(filename) if filename else None
        }
    
    @staticmethod
    def validate_json_input(data: Any, required_fields: Optional[List[str]] = None,
                          max_depth: int = 10, max_size: int = 1024 * 1024) -> Dict[str, Any]:
        """
        Validate JSON input data
        
        Args:
            data: JSON data to validate
            required_fields: List of required field names
            max_depth: Maximum nesting depth allowed
            max_size: Maximum JSON size in bytes
            
        Returns:
            Dict with validation results
        """
        errors = []
        
        # Size check
        try:
            import json
            json_str = json.dumps(data)
            if len(json_str.encode('utf-8')) > max_size:
                errors.append(f'JSON data exceeds maximum size of {max_size} bytes')
        except Exception as e:
            errors.append('Invalid JSON data')
            return {'valid': False, 'errors': errors}
        
        # Depth check
        def check_depth(obj, depth=0):
            if depth > max_depth:
                return False
            if isinstance(obj, dict):
                return all(check_depth(v, depth + 1) for v in obj.values())
            elif isinstance(obj, list):
                return all(check_depth(v, depth + 1) for v in obj)
            return True
        
        if not check_depth(data):
            errors.append(f'JSON nesting depth exceeds maximum of {max_depth}')
        
        # Required fields check
        if required_fields and isinstance(data, dict):
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                errors.append(f'Missing required fields: {", ".join(missing_fields)}')
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }


class ReviewContentValidator:
    """Specialized validator for review content"""
    
    @staticmethod
    def validate_review_text(content: str, min_length: int = 10, max_length: int = 10000) -> Dict[str, Any]:
        """Validate review text content"""
        errors = []
        
        if not content or not content.strip():
            errors.append('Review content is required')
            return {'valid': False, 'errors': errors}
        
        content = content.strip()
        
        # Length validation
        if len(content) < min_length:
            errors.append(f'Review must be at least {min_length} characters long')
        elif len(content) > max_length:
            errors.append(f'Review cannot exceed {max_length} characters')
        
        # Security checks
        if InputValidator.check_sql_injection(content):
            errors.append('Review contains potentially malicious content')
        
        if InputValidator.check_xss_patterns(content):
            errors.append('Review contains potentially malicious scripts')
        
        # Content quality checks
        if content.count('.') == 0 and content.count('!') == 0 and content.count('?') == 0:
            errors.append('Review should contain proper punctuation')
        
        # Spam detection
        repeated_chars = re.search(r'(.)\1{10,}', content)
        if repeated_chars:
            errors.append('Review contains excessive repeated characters')
        
        # Sanitize content
        sanitized_content = InputValidator.sanitize_html(content)
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'sanitized_content': sanitized_content,
            'word_count': len(content.split()),
            'char_count': len(content)
        }
    
    @staticmethod
    def validate_rating(rating: Union[int, float], min_rating: int = 1, max_rating: int = 5) -> Dict[str, Any]:
        """Validate review rating"""
        errors = []
        
        try:
            rating = float(rating)
        except (ValueError, TypeError):
            errors.append('Rating must be a valid number')
            return {'valid': False, 'errors': errors}
        
        if rating < min_rating or rating > max_rating:
            errors.append(f'Rating must be between {min_rating} and {max_rating}')
        
        # Check for valid increments (0.5 steps)
        if (rating * 2) % 1 != 0:
            errors.append('Rating must be in 0.5 increments')
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'normalized_rating': rating
        }


# Global validator instances
input_validator = InputValidator()
review_validator = ReviewContentValidator()