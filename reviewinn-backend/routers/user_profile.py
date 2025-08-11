from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from services.user_profile_service import UserProfileService
from schemas.user_profile import UserProfileCreate, UserProfileRead
from models.user import User
from database import get_db

router = APIRouter(prefix="/user_profile", tags=["user_profile"])

@router.post("/create", response_model=UserProfileRead)
def create_profile(
    user_id: int,
    data: UserProfileCreate,
    db: Session = Depends(get_db)
):
    service = UserProfileService(db)
    return service.create_profile(user_id, data)

@router.get("/{user_id}", response_model=UserProfileRead)
def get_profile(user_id: int, db: Session = Depends(get_db)):
    service = UserProfileService(db)
    profile = service.get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.put("/update/{user_id}")
def update_profile(user_id: int, data: UserProfileCreate, db: Session = Depends(get_db)):
    service = UserProfileService(db)
    
    # Get the user
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update user fields (name, avatar, bio are in the user table)
    user_fields = {}
    if data.name is not None:
        user_fields['name'] = data.name
    if data.avatar is not None:
        user_fields['avatar'] = data.avatar
    if data.bio is not None:
        user_fields['bio'] = data.bio
    
    # Update user record
    if user_fields:
        for key, value in user_fields.items():
            setattr(user, key, value)
        db.commit()
        db.refresh(user)
    
    # Update or create user profile for location and website
    profile_data = {}
    if data.location is not None:
        profile_data['location'] = data.location
    if data.website is not None:
        profile_data['website'] = data.website
    
    if profile_data:
        profile = service.update_profile(user_id, **profile_data)
        if not profile:
            # Create profile if it doesn't exist
            profile_create = UserProfileCreate(
                location=data.location,
                website=data.website
            )
            profile = service.create_profile(user_id, profile_create)
    
    # Get the current profile for response
    final_profile = service.get_profile(user_id)
    
    # Return the updated user data in the expected format
    return {
        "user_id": user.user_id,
        "name": user.name,
        "username": user.username,
        "email": user.email,
        "avatar": user.avatar,
        "bio": user.bio,
        "level": user.level,
        "points": user.points,
        "location": final_profile.location if final_profile else None,
        "website": final_profile.website if final_profile else None,
        "created_at": user.created_at,
        "updated_at": user.updated_at
    }

 