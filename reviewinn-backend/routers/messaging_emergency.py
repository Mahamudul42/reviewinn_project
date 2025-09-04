"""
Emergency Messaging Router - Zero dependencies approach
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
import json
from database import get_db
from auth.production_dependencies import RequiredUser

router = APIRouter(prefix="/api/v1/messenger", tags=["Messaging"])

@router.get("/conversations")
async def get_conversations(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None),
    conversation_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = RequiredUser
):
    """Emergency implementation - direct SQL only"""
    try:
        print(f"[EMERGENCY] User {current_user.user_id} requesting conversations")
        
        # Simplest possible SQL query
        sql = "SELECT 'emergency_response' as status, :user_id as user_id"
        result = db.execute(text(sql), {"user_id": current_user.user_id})
        row = result.fetchone()
        
        print(f"[EMERGENCY] Query executed successfully for user {row.user_id}")
        
        return {
            "success": True,
            "conversations": [],
            "total_count": 0,
            "has_more": False,
            "pagination": {"current_page": 1, "total_pages": 0, "limit": limit, "offset": offset},
            "emergency_mode": True,
            "user_id": current_user.user_id
        }
        
    except Exception as e:
        print(f"[EMERGENCY ERROR] {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "success": False,
            "error": str(e),
            "emergency_mode": True,
            "conversations": [],
            "total_count": 0,
            "has_more": False,
            "pagination": {"current_page": 1, "total_pages": 0, "limit": limit, "offset": offset}
        }

@router.get("/health")
async def emergency_health():
    """Emergency health check"""
    return {"status": "emergency_mode", "message": "Simple endpoint active"}