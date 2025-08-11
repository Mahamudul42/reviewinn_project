"""
Simple logging configuration for the application.
"""
import logging
import sys
from .config import get_settings


def setup_logging() -> None:
    """Setup application logging with basic configuration."""
    settings = get_settings()
    
    # Configure basic logging
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S',
        stream=sys.stdout
    )
    
    # Set specific logger levels
    if not settings.debug:
        logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
        logging.getLogger('sqlalchemy.pool').setLevel(logging.WARNING)
    
    # Disable noisy loggers for development
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    logging.getLogger('requests').setLevel(logging.WARNING)


class LoggerMixin:
    """Mixin to provide logging capabilities to classes."""
    
    @property
    def logger(self):
        """Get logger for this class."""
        return logging.getLogger(self.__class__.__name__)
    
    def log_info(self, message: str, **kwargs):
        """Log info message with optional structured data."""
        if kwargs:
            message = f"{message} - {kwargs}"
        self.logger.info(message)
    
    def log_error(self, message: str, **kwargs):
        """Log error message with optional structured data."""
        if kwargs:
            message = f"{message} - {kwargs}"
        self.logger.error(message)
    
    def log_warning(self, message: str, **kwargs):
        """Log warning message with optional structured data."""
        if kwargs:
            message = f"{message} - {kwargs}"
        self.logger.warning(message)
    
    def log_debug(self, message: str, **kwargs):
        """Log debug message with optional structured data."""
        if kwargs:
            message = f"{message} - {kwargs}"
        self.logger.debug(message)
