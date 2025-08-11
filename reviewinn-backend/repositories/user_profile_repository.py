from sqlalchemy.orm import Session
from models.user_profile import UserProfile
from typing import Optional

class UserProfileRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, user_profile: UserProfile) -> UserProfile:
        self.db.add(user_profile)
        self.db.commit()
        self.db.refresh(user_profile)
        return user_profile

    def get_by_user_id(self, user_id: int) -> Optional[UserProfile]:
        return self.db.query(UserProfile).filter(UserProfile.user_id == user_id).first()

    def update(self, user_id: int, **kwargs) -> Optional[UserProfile]:
        profile = self.get_by_user_id(user_id)
        if profile:
            for key, value in kwargs.items():
                setattr(profile, key, value)
            self.db.commit()
            self.db.refresh(profile)
        return profile 