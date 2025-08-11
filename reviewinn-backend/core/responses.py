"""
Utility functions for API response formatting.
"""
from typing import Any, Dict, List, Optional, Union
from datetime import datetime
from fastapi.responses import JSONResponse
from pydantic import BaseModel

def api_response(
    data: Optional[Union[Dict, List, BaseModel]] = None,
    message: str = "Operation successful",
    success: bool = True,
    status_code: int = 200,
    error_code: Optional[str] = None,
    details: Optional[Dict] = None,
) -> JSONResponse:
    """
    Create a standardized API response.
    
    Args:
        data: The response data
        message: A message describing the result
        success: Whether the operation was successful
        status_code: HTTP status code
        error_code: An error code for failed operations
        details: Additional error details
    
    Returns:
        A JSON response with standardized structure
    """
    # Convert Pydantic models to dict if needed
    if isinstance(data, BaseModel):
        data = data.model_dump()
    
    response_body = {
        "success": success,
        "message": message,
        "timestamp": datetime.now().isoformat()
    }
    
    if data is not None:
        response_body["data"] = data
        
    if error_code:
        response_body["error_code"] = error_code
        
    if details:
        response_body["details"] = details
    
    return JSONResponse(
        content=response_body,
        status_code=status_code
    )

def error_response(
    message: str,
    status_code: int = 400,
    error_code: str = "BAD_REQUEST",
    details: Optional[Dict] = None
) -> JSONResponse:
    """
    Create a standardized error response.
    
    Args:
        message: Error message
        status_code: HTTP status code
        error_code: Error code
        details: Additional error details
    
    Returns:
        A JSON response with standardized error structure
    """
    return api_response(
        message=message,
        success=False,
        status_code=status_code,
        error_code=error_code,
        details=details
    )

def pagination_response(
    data: List[Any],
    total: int,
    page: int = 1,
    limit: int = 20
) -> Dict:
    """
    Create a standardized paginated response.
    
    Args:
        data: List of items for the current page
        total: Total number of items across all pages
        page: Current page number (1-indexed)
        limit: Number of items per page
    
    Returns:
        A dictionary with pagination metadata
    """
    pages = (total // limit) + (1 if total % limit else 0)
    
    return {
        "items": data,
        "pagination": {
            "total": total,
            "page": page,
            "per_page": limit,
            "pages": pages,
            "has_next": page < pages,
            "has_prev": page > 1
        }
    }
