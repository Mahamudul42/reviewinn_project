from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def search():
    """Search endpoint - placeholder for now"""
    return {"message": "Search endpoint - not implemented yet"} 