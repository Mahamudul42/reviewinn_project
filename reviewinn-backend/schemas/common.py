"""
Common schemas and base classes for API responses.
"""
from typing import Optional, Any, Dict, List, Union, TypeVar, Generic
from pydantic import BaseModel, Field
from datetime import datetime


class BaseResponseSchema(BaseModel):
    """Base schema for all API responses."""
    
    class Config:
        from_attributes = True
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class PaginationSchema(BaseModel):
    """Schema for pagination information."""
    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page number", ge=1)
    per_page: int = Field(..., description="Items per page", ge=1, le=100)
    pages: int = Field(..., description="Total number of pages")
    has_next: bool = Field(..., description="Whether there is a next page")
    has_prev: bool = Field(..., description="Whether there is a previous page")


class APIResponse(BaseModel):
    """Standard API response wrapper."""
    success: bool = Field(True, description="Whether the request was successful")
    message: Optional[str] = Field(None, description="Response message")
    data: Optional[Any] = Field(None, description="Response data")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


T = TypeVar("T")

class PaginatedAPIResponse(BaseModel, Generic[T]):
    """Paginated API response wrapper."""
    success: bool = Field(True, description="Whether the request was successful")
    message: Optional[str] = Field(None, description="Response message")
    data: List[T] = Field(..., description="List of items")
    pagination: PaginationSchema = Field(..., description="Pagination information")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ErrorResponse(BaseModel):
    """Error response schema."""
    success: bool = Field(False, description="Always false for error responses")
    error_code: str = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ValidationErrorDetail(BaseModel):
    """Validation error detail."""
    field: str = Field(..., description="Field that failed validation")
    message: str = Field(..., description="Validation error message")
    value: Optional[Any] = Field(None, description="Value that failed validation")


class ValidationErrorResponse(ErrorResponse):
    """Validation error response with field details."""
    validation_errors: List[ValidationErrorDetail] = Field(
        ..., description="List of validation errors"
    )


class SearchFilters(BaseModel):
    """Common search filters."""
    q: Optional[str] = Field(None, description="Search query")
    category: Optional[str] = Field(None, description="Filter by category")
    sort_by: Optional[str] = Field("created_at", description="Sort field")
    sort_order: Optional[str] = Field("desc", pattern="^(asc|desc)$", description="Sort order")
    page: int = Field(1, ge=1, description="Page number")
    per_page: int = Field(20, ge=1, le=100, description="Items per page")


class TimestampMixin(BaseModel):
    """Mixin for models with timestamps."""
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")


class IDMixin(BaseModel):
    """Mixin for models with ID fields."""
    id: Union[int, str] = Field(..., description="Resource ID")


class StatusResponse(BaseModel):
    """Simple status response."""
    success: bool = Field(True, description="Operation success status")
    message: str = Field(..., description="Status message")


class HealthCheckResponse(BaseModel):
    """Health check response."""
    status: str = Field("healthy", description="Service status")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Check timestamp")
    version: str = Field("1.0.0", description="API version")
    database: bool = Field(True, description="Database connection status")
    redis: bool = Field(True, description="Redis connection status")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
