"""
Preflight request handler for CORS OPTIONS requests.
Ensures proper handling of preflight requests with correct headers.
"""

from fastapi import Request, Response
from fastapi.responses import Response as FastAPIResponse
from typing import Dict, List, Optional
from ..config.settings import get_settings


class PreflightHandler:
    """
    Handles CORS preflight OPTIONS requests with proper headers.
    """
    
    def __init__(self):
        self.settings = get_settings()
    
    def is_preflight_request(self, request: Request) -> bool:
        """Check if request is a CORS preflight request."""
        return (
            request.method == "OPTIONS" and
            "origin" in request.headers and
            "access-control-request-method" in request.headers
        )
    
    def is_origin_allowed(self, origin: str) -> bool:
        """Check if origin is allowed based on environment."""
        allowed_origins = self.settings.cors.get_origins_for_environment(
            self.settings.environment
        )
        
        # Handle wildcard in development
        if self.settings.is_development and "*" in allowed_origins:
            return True
            
        return origin in allowed_origins
    
    def get_allowed_methods(self) -> List[str]:
        """Get allowed HTTP methods."""
        return self.settings.cors.methods
    
    def get_allowed_headers(self) -> List[str]:
        """Get allowed headers."""
        return self.settings.cors.headers
    
    def create_preflight_response(self, request: Request) -> FastAPIResponse:
        """Create proper preflight response with CORS headers."""
        origin = request.headers.get("origin", "")
        
        # Check if origin is allowed
        if not self.is_origin_allowed(origin):
            return FastAPIResponse(
                status_code=403,
                content="Origin not allowed",
                headers={"Content-Type": "text/plain"}
            )
        
        # Get requested method and headers
        requested_method = request.headers.get("access-control-request-method", "")
        requested_headers = request.headers.get("access-control-request-headers", "")
        
        # Validate requested method
        allowed_methods = self.get_allowed_methods()
        if requested_method and requested_method not in allowed_methods:
            return FastAPIResponse(
                status_code=405,
                content="Method not allowed",
                headers={"Content-Type": "text/plain"}
            )
        
        # Build response headers
        headers: Dict[str, str] = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": ", ".join(allowed_methods),
            "Access-Control-Allow-Headers": ", ".join(self.get_allowed_headers()),
            "Access-Control-Max-Age": "86400",  # 24 hours
            "Vary": "Origin, Access-Control-Request-Method, Access-Control-Request-Headers"
        }
        
        # Add credentials header if enabled
        if self.settings.cors.credentials:
            headers["Access-Control-Allow-Credentials"] = "true"
        
        # Add specific requested headers if they're allowed
        if requested_headers:
            requested_header_list = [h.strip() for h in requested_headers.split(",")]
            allowed_headers_lower = [h.lower() for h in self.get_allowed_headers()]
            
            # Check if all requested headers are allowed
            for header in requested_header_list:
                if header.lower() not in allowed_headers_lower and "*" not in self.get_allowed_headers():
                    return FastAPIResponse(
                        status_code=403,
                        content=f"Header '{header}' not allowed",
                        headers={"Content-Type": "text/plain"}
                    )
        
        # Add expose headers for actual requests
        expose_headers = [
            "X-Total-Count",
            "X-Page-Count", 
            "X-Current-Page",
            "X-Rate-Limit-Remaining",
            "X-Rate-Limit-Reset",
            "Content-Range",
            "Content-Length"
        ]
        headers["Access-Control-Expose-Headers"] = ", ".join(expose_headers)
        
        return FastAPIResponse(
            status_code=204,  # No Content
            headers=headers
        )
    
    def add_cors_headers_to_response(self, response: Response, request: Request) -> None:
        """Add CORS headers to actual (non-preflight) responses."""
        origin = request.headers.get("origin", "")
        
        if self.is_origin_allowed(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Vary"] = "Origin"
            
            if self.settings.cors.credentials:
                response.headers["Access-Control-Allow-Credentials"] = "true"
            
            # Add expose headers
            expose_headers = [
                "X-Total-Count",
                "X-Page-Count", 
                "X-Current-Page",
                "X-Rate-Limit-Remaining",
                "X-Rate-Limit-Reset",
                "Content-Range",
                "Content-Length"
            ]
            response.headers["Access-Control-Expose-Headers"] = ", ".join(expose_headers)


# Global instance
preflight_handler = PreflightHandler()


async def handle_preflight_request(request: Request) -> Optional[FastAPIResponse]:
    """
    Middleware function to handle preflight requests.
    Returns a response if it's a preflight request, None otherwise.
    """
    if preflight_handler.is_preflight_request(request):
        return preflight_handler.create_preflight_response(request)
    return None


def add_cors_headers(response: Response, request: Request) -> None:
    """
    Add CORS headers to regular responses.
    """
    preflight_handler.add_cors_headers_to_response(response, request)