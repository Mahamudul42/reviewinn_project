from database import engine, Base

# Import all models to ensure they're registered with Base
from models.user import User
from models.entity import Entity 
from models.review import Review
from models.comment import Comment
from models.review_reaction import ReviewReaction
from models.user_entity_view import UserEntityView
from models.entity_analytics import EntityAnalytics

if __name__ == "__main__":
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Done.") 