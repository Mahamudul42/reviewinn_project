"""
Image upload service using ImgBB
Note: This service is deprecated. Image uploads are now handled directly on the frontend
using the ImgBB service with separate API keys for different upload types.
"""
from typing import List, Optional
import os
import logging

logger = logging.getLogger(__name__)

class ImageUploadService:
    """
    Deprecated: Image uploads are now handled on the frontend using ImgBB service
    This class is kept for backward compatibility but should not be used
    """
    
    def __init__(self):
        logger.warning("ImageUploadService is deprecated. Use frontend ImgBB service instead.")
    
    async def upload_review_image(self, image_data: bytes, filename: str) -> str:
        """
        DEPRECATED: Use frontend ImgBB service instead
        """
        logger.error("upload_review_image is deprecated. Use frontend ImgBB service.")
        raise NotImplementedError("Use frontend ImgBB service for image uploads")
    
    async def upload_multiple_images(self, images: List[tuple]) -> List[str]:
        """
        DEPRECATED: Use frontend ImgBB service instead
        """
        logger.error("upload_multiple_images is deprecated. Use frontend ImgBB service.")
        raise NotImplementedError("Use frontend ImgBB service for image uploads")
    
    def delete_image(self, image_url: str) -> bool:
        """
        DEPRECATED: ImgBB doesn't support programmatic deletion
        Images expire automatically or can be deleted manually
        """
        logger.warning("delete_image is deprecated. ImgBB images expire automatically.")
        return False

# Global instance (kept for backward compatibility)
image_service = ImageUploadService()