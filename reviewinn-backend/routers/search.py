from fastapi import APIRouter
from auth.production_dependencies import CurrentUser

router = APIRouter()

@router.get("/")
async def search(current_user: CurrentUser = None):
    """Search endpoint - placeholder for now (public endpoint with optional auth)"""
    return {"message": "Search endpoint - not implemented yet"} 