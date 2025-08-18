from fastapi import APIRouter
from auth.production_dependencies import AdminUser

router = APIRouter()

@router.get("/")
async def get_analytics(admin_user: AdminUser = None):
    """Analytics endpoint - placeholder for now (admin only)"""
    return {"message": "Analytics endpoint - not implemented yet"} 