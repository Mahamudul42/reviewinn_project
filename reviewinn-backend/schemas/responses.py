"""
Standardized API response models for consistent API responses.
"""
from typing import Generic, TypeVar, Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field
from datetime import datetime

# Generic type for response data
T = TypeVar('T')


class PaginationInfo(BaseModel):
    """Pagination information for list responses."""
    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page number")
    per_page: int = Field(..., description="Items per page")
    pages: int = Field(..., description="Total number of pages")
    has_next: bool = Field(..., description="Whether there is a next page")
    has_prev: bool = Field(..., description="Whether there is a previous page")


class APIResponse(BaseModel, Generic[T]):
    """Base API response model."""
    success: bool = Field(True, description="Whether the request was successful")
    message: Optional[str] = Field(None, description="Response message")
    data: Optional[T] = Field(None, description="Response data")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response model."""
    success: bool = Field(True, description="Whether the request was successful")
    message: Optional[str] = Field(None, description="Response message")
    data: List[T] = Field(..., description="List of items")
    pagination: PaginationInfo = Field(..., description="Pagination information")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")
    
    model_config = {
        "arbitrary_types_allowed": True,
        "json_encoders": {
            datetime: lambda v: v.isoformat()
        }
    }


class ErrorDetail(BaseModel):
    """Error detail model."""
    field: Optional[str] = Field(None, description="Field that caused the error")
    message: str = Field(..., description="Error message")
    code: Optional[str] = Field(None, description="Error code")


class ErrorResponse(BaseModel):
    """Error response model."""
    success: bool = Field(False, description="Whether the request was successful")
    error_code: str = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    details: Dict[str, Any] = Field(default_factory=dict, description="Additional error details")
    errors: Optional[List[ErrorDetail]] = Field(None, description="List of validation errors")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class HealthCheckResponse(BaseModel):
    """Health check response model."""
    status: str = Field(..., description="Service status")
    message: str = Field(..., description="Status message")
    version: str = Field(..., description="Application version")
    environment: str = Field(..., description="Environment name")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")
    services: Optional[Dict[str, str]] = Field(None, description="Service statuses")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


# Response factory functions
def success_response(
    data: Optional[T] = None,
    message: Optional[str] = None
) -> APIResponse[T]:
    """Create a successful API response."""
    return APIResponse(
        success=True,
        message=message,
        data=data
    )


def paginated_response(
    items: List[T],
    total: int,
    page: int,
    per_page: int,
    message: Optional[str] = None
) -> PaginatedResponse[T]:
    """Create a paginated API response."""
    pages = (total + per_page - 1) // per_page if per_page > 0 else 0
    has_next = page < pages
    has_prev = page > 1
    
    return PaginatedResponse(
        success=True,
        message=message,
        data=items,
        pagination=PaginationInfo(
            total=total,
            page=page,
            per_page=per_page,
            pages=pages,
            has_next=has_next,
            has_prev=has_prev
        )
    )


def error_response(
    error_code: str,
    message: str,
    details: Optional[Dict[str, Any]] = None,
    errors: Optional[List[ErrorDetail]] = None
) -> ErrorResponse:
    """Create an error API response."""
    return ErrorResponse(
        error_code=error_code,
        message=message,
        details=details or {},
        errors=errors
    )


def validation_error_response(
    message: str = "Validation failed",
    errors: Optional[List[ErrorDetail]] = None
) -> ErrorResponse:
    """Create a validation error response."""
    return ErrorResponse(
        error_code="VALIDATION_ERROR",
        message=message,
        errors=errors or []
    )


def not_found_response(
    resource_type: str,
    resource_id: Union[str, int]
) -> ErrorResponse:
    """Create a not found error response."""
    return ErrorResponse(
        error_code="RESOURCE_NOT_FOUND",
        message=f"{resource_type} with ID '{resource_id}' not found",
        details={
            "resource_type": resource_type,
            "resource_id": str(resource_id)
        }
    )


def internal_error_response(
    message: str = "An internal error occurred"
) -> ErrorResponse:
    """Create an internal server error response."""
    return ErrorResponse(
        error_code="INTERNAL_SERVER_ERROR",
        message=message
    )


def unauthorized_response(
    message: str = "Authentication required"
) -> ErrorResponse:
    """Create an unauthorized error response."""
    return ErrorResponse(
        error_code="UNAUTHORIZED",
        message=message
    )


def forbidden_response(
    message: str = "Insufficient permissions"
) -> ErrorResponse:
    """Create a forbidden error response."""
    return ErrorResponse(
        error_code="FORBIDDEN",
        message=message
    )


def conflict_response(
    message: str,
    details: Optional[Dict[str, Any]] = None
) -> ErrorResponse:
    """Create a conflict error response."""
    return ErrorResponse(
        error_code="CONFLICT",
        message=message,
        details=details or {}
    )


def rate_limit_response(
    message: str = "Rate limit exceeded",
    retry_after: Optional[int] = None
) -> ErrorResponse:
    """Create a rate limit error response."""
    details = {}
    if retry_after:
        details["retry_after"] = retry_after
    
    return ErrorResponse(
        error_code="RATE_LIMIT_EXCEEDED",
        message=message,
        details=details
    )
