from sqlalchemy.orm import Session
from models.user_profile import UserProfile
from repositories.user_profile_repository import UserProfileRepository
from schemas.user_profile import UserProfileCreate
from typing import Optional

class UserProfileService:
    def __init__(self, db: Session):
        self.repo = UserProfileRepository(db)
        self.db = db

    def create_profile(self, user_id: int, data: UserProfileCreate) -> UserProfile:
        profile = UserProfile(
            user_id=user_id,
            bio=data.bio,
            avatar=data.avatar,
            location=data.location,
            website=data.website
        )
        return self.repo.create(profile)

    def get_profile(self, user_id: int) -> Optional[UserProfile]:
        return self.repo.get_by_user_id(user_id)

    def update_profile(self, user_id: int, **kwargs) -> Optional[UserProfile]:
        return self.repo.update(user_id, **kwargs)
    
    def get_profile_with_reviews(self, user_id: int) -> Optional[UserProfile]:
        """
        Get user profile - reviews handled by separate endpoints
        """
        return self.get_profile(user_id) 