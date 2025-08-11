"""
Core configuration module for the review platform.
Centralizes all configuration management with environment-specific settings.
"""

from .settings import Settings, get_settings, DatabaseConfig, CacheConfig

__all__ = [
    "Settings",
    "get_settings", 
    "DatabaseConfig",
    "CacheConfig"
]