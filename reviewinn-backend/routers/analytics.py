from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_analytics():
    """Analytics endpoint - placeholder for now"""
    return {"message": "Analytics endpoint - not implemented yet"} 