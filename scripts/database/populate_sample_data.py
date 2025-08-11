#!/usr/bin/env python3
"""
Sample Data Population Script for ReviewInn
Creates realistic entities with images from public sources and reviews
"""

import sys
import os
sys.path.append('/home/hasan181/personal/my_project/reviewinn/reviewinn-backend')

import asyncio
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from passlib.context import CryptContext

# Import models
from models.user import User, UserRole
from models.entity import Entity
from models.review import Review
from models.unified_category import UnifiedCategory
from database import get_db

# Database connection
DATABASE_URL = "postgresql://reviewinn_user:jtQ8UGVg9YAT7!eTwbVAGKuZ29YHV%Ax@localhost:5432/reviewinn_db"
engine = create_engine(DATABASE_URL)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Unsplash/Pexels-style images (using public domain equivalents)
SAMPLE_IMAGES = {
    "professionals": [
        "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400",  # Doctor
        "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400",  # Lawyer
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",  # Teacher
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",  # Professional
        "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400",  # Engineer
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400",  # Business person
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",  # Professional
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400",  # Healthcare
    ],
    "companies": [
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400",  # Office building
        "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400",  # Modern office
        "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=400",  # Company building
        "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=400",  # Technology office
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400",  # Business building
        "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400",  # Startup office
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400",  # Corporate
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400",  # Office space
    ],
    "places": [
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",  # Restaurant
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400",  # Hotel
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400",  # Cafe
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400",  # Restaurant interior
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",  # Hotel lobby
        "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400",  # Coffee shop
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",  # Restaurant
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400",  # Hotel room
    ],
    "products": [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",  # Watch
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",  # Shoes
        "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400",  # Headphones
        "https://images.unsplash.com/photo-1560472354-76e207aa12df?w=400",  # Laptop
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",  # Smartphone
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400",  # Sunglasses
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400",  # Bag
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400",  # Book
    ]
}

# Sample entity data organized by category
SAMPLE_ENTITIES = {
    "professionals": [
        {
            "name": "Dr. Sarah Johnson",
            "description": "Board-certified cardiologist with over 15 years of experience. Specializes in preventive cardiology and heart disease management. Graduate of Harvard Medical School.",
            "category_path": ["Professionals", "Healthcare", "Specialist Doctors"],
            "context": {"specialties": ["Cardiology", "Preventive Medicine"], "education": "Harvard Medical School", "experience": "15+ years"}
        },
        {
            "name": "Michael Chen",
            "description": "Senior Software Engineer at top tech companies. Expert in full-stack development, cloud architecture, and machine learning. MIT graduate with passion for innovation.",
            "category_path": ["Professionals", "Information Technology", "Software Engineers"],
            "context": {"skills": ["Python", "JavaScript", "AWS", "Machine Learning"], "education": "MIT", "experience": "10+ years"}
        },
        {
            "name": "Emma Rodriguez",
            "description": "Immigration attorney specializing in family reunification and business visas. Fluent in English and Spanish. Harvard Law School graduate.",
            "category_path": ["Professionals", "Legal", "Lawyers"],
            "context": {"specialties": ["Immigration Law", "Family Law"], "languages": ["English", "Spanish"], "education": "Harvard Law School"}
        },
        {
            "name": "Professor David Kim",
            "description": "Computer Science professor at UC Berkeley. Research focus on artificial intelligence and machine learning. Published author of 50+ research papers.",
            "category_path": ["Professionals", "Education", "University Professors"],
            "context": {"department": "Computer Science", "university": "UC Berkeley", "research": "AI/ML", "publications": "50+"}
        },
        {
            "name": "Lisa Wang",
            "description": "Certified Public Accountant specializing in tax planning for small businesses and entrepreneurs. CPA with 12 years of experience helping businesses optimize their finances.",
            "category_path": ["Professionals", "Business", "Accountants"],
            "context": {"certifications": ["CPA"], "specialties": ["Tax Planning", "Small Business"], "experience": "12 years"}
        },
        {
            "name": "Chef Antonio Rossi",
            "description": "Executive Chef with expertise in Italian cuisine. Trained in Milan and worked at Michelin-starred restaurants. Specializes in authentic pasta and modern Italian dishes.",
            "category_path": ["Professionals", "Hospitality", "Chefs"],
            "context": {"cuisine": "Italian", "training": "Milan, Italy", "experience": "Michelin-starred restaurants", "specialties": ["Pasta", "Modern Italian"]}
        }
    ],
    "companies": [
        {
            "name": "TechFlow Solutions",
            "description": "Leading software development company specializing in enterprise solutions and cloud migration. Serving Fortune 500 companies with cutting-edge technology solutions.",
            "category_path": ["Companies/Institutes", "Technology", "Software Companies"],
            "context": {"services": ["Enterprise Software", "Cloud Migration", "Consulting"], "clients": "Fortune 500", "founded": "2010"}
        },
        {
            "name": "Green Valley University",
            "description": "Private university known for its innovative programs in engineering and business. Small class sizes with dedicated faculty. Beautiful campus with state-of-the-art facilities.",
            "category_path": ["Companies/Institutes", "Education", "Universities"],
            "context": {"programs": ["Engineering", "Business", "Liberal Arts"], "type": "Private", "campus": "150 acres", "faculty_ratio": "1:12"}
        },
        {
            "name": "MetroHealth Medical Center",
            "description": "Comprehensive healthcare facility offering specialized medical services. Equipped with the latest medical technology and staffed by board-certified physicians.",
            "category_path": ["Companies/Institutes", "Healthcare", "Hospitals"],
            "context": {"services": ["Emergency Care", "Surgery", "Cardiology", "Oncology"], "beds": "400", "certifications": ["Joint Commission"]}
        },
        {
            "name": "Summit Financial Group",
            "description": "Full-service investment firm providing wealth management and financial planning services. Helping individuals and businesses achieve their financial goals for over 20 years.",
            "category_path": ["Companies/Institutes", "Finance", "Investment Firms"],
            "context": {"services": ["Wealth Management", "Financial Planning", "Investment Advisory"], "founded": "2003", "aum": "$2.5B"}
        },
        {
            "name": "EcoGreen Manufacturing",
            "description": "Sustainable manufacturing company specializing in eco-friendly packaging solutions. Committed to reducing environmental impact while maintaining product quality.",
            "category_path": ["Companies/Institutes", "Manufacturing", "Consumer Goods"],
            "context": {"products": ["Eco Packaging", "Sustainable Materials"], "certifications": ["ISO 14001", "B Corp"], "founded": "2015"}
        }
    ],
    "places": [
        {
            "name": "The Garden Bistro",
            "description": "Charming farm-to-table restaurant featuring organic, locally sourced ingredients. Cozy atmosphere with outdoor seating and seasonal menu changes.",
            "category_path": ["Places", "Hospitality", "Restaurants"],
            "context": {"cuisine": "Farm-to-table", "features": ["Outdoor Seating", "Organic", "Local Sourcing"], "established": "2018"}
        },
        {
            "name": "Grand Plaza Hotel",
            "description": "Luxury hotel in the heart of downtown with elegant rooms and exceptional service. Features spa, fitness center, rooftop bar, and business facilities.",
            "category_path": ["Places", "Hospitality", "Hotels"],
            "context": {"star_rating": "4-star", "amenities": ["Spa", "Fitness Center", "Rooftop Bar", "Business Center"], "rooms": "200"}
        },
        {
            "name": "Central Public Library",
            "description": "Modern library with extensive book collection, digital resources, and community programs. Free Wi-Fi, study rooms, and children's reading area available.",
            "category_path": ["Places", "Public Services", "Public Libraries"],
            "context": {"collection": "500,000+ books", "services": ["Digital Resources", "Study Rooms", "Community Programs"], "wifi": "Free"}
        },
        {
            "name": "Riverside Park",
            "description": "Beautiful 50-acre park along the river with walking trails, playground, and picnic areas. Popular spot for families, joggers, and outdoor enthusiasts.",
            "category_path": ["Places", "Recreation", "Parks"],
            "context": {"size": "50 acres", "features": ["Walking Trails", "Playground", "Picnic Areas", "River Access"], "activities": ["Walking", "Picnicking", "Playgrounds"]}
        },
        {
            "name": "City Art Museum",
            "description": "Contemporary art museum featuring rotating exhibitions and permanent collection. Interactive exhibits, educational programs, and gift shop.",
            "category_path": ["Places", "Tourism", "Museums"],
            "context": {"type": "Contemporary Art", "features": ["Rotating Exhibitions", "Permanent Collection", "Educational Programs"], "established": "1985"}
        }
    ],
    "products": [
        {
            "name": "UltraBook Pro 15",
            "description": "High-performance laptop with 15-inch 4K display, latest processor, and all-day battery life. Perfect for professionals and content creators.",
            "category_path": ["Products", "Electronics", "Laptops"],
            "context": {"screen": "15-inch 4K", "battery": "12+ hours", "target": "Professionals", "weight": "3.2 lbs"}
        },
        {
            "name": "EcoFit Running Shoes",
            "description": "Sustainable running shoes made from recycled materials. Lightweight design with excellent cushioning and breathable fabric for optimal comfort.",
            "category_path": ["Products", "Fashion", "Footwear"],
            "context": {"material": "Recycled", "type": "Running", "features": ["Lightweight", "Cushioning", "Breathable"], "sustainability": "Eco-friendly"}
        },
        {
            "name": "Premium Coffee Blend",
            "description": "Single-origin coffee beans from Ethiopian highlands. Rich, full-bodied flavor with notes of chocolate and berries. Fair trade certified.",
            "category_path": ["Products", "Food & Beverages", "Beverages"],
            "context": {"origin": "Ethiopian Highlands", "notes": ["Chocolate", "Berries"], "certifications": ["Fair Trade"], "roast": "Medium"}
        },
        {
            "name": "Smart Fitness Watch",
            "description": "Advanced fitness tracker with heart rate monitoring, GPS, and 7-day battery life. Water-resistant design with customizable watch faces.",
            "category_path": ["Products", "Electronics", "Wearables"],
            "context": {"features": ["Heart Rate", "GPS", "7-day battery"], "water_resistance": "50m", "compatibility": "iOS/Android"}
        },
        {
            "name": "Organic Skincare Set",
            "description": "Complete skincare routine with organic ingredients. Includes cleanser, toner, serum, and moisturizer. Suitable for all skin types.",
            "category_path": ["Products", "Health & Beauty", "Skincare"],
            "context": {"ingredients": "Organic", "products": ["Cleanser", "Toner", "Serum", "Moisturizer"], "skin_type": "All types"}
        }
    ]
}

# Sample users for reviews
SAMPLE_USERS = [
    {"name": "John Smith", "email": "john.smith@example.com", "username": "johnsmith"},
    {"name": "Maria Garcia", "email": "maria.garcia@example.com", "username": "mariagarcia"},
    {"name": "Robert Johnson", "email": "robert.johnson@example.com", "username": "robertj"},
    {"name": "Jennifer Lee", "email": "jennifer.lee@example.com", "username": "jenniferlee"},
    {"name": "David Brown", "email": "david.brown@example.com", "username": "davidbrown"},
    {"name": "Sarah Davis", "email": "sarah.davis@example.com", "username": "sarahdavis"},
    {"name": "Michael Wilson", "email": "michael.wilson@example.com", "username": "michaelw"},
    {"name": "Lisa Anderson", "email": "lisa.anderson@example.com", "username": "lisaanderson"},
    {"name": "James Taylor", "email": "james.taylor@example.com", "username": "jamestaylor"},
    {"name": "Amanda Clark", "email": "amanda.clark@example.com", "username": "amandaclark"}
]

# Sample review templates
REVIEW_TEMPLATES = {
    "professionals": {
        "positive": [
            "Excellent service! {name} exceeded my expectations. Very professional and knowledgeable.",
            "Outstanding experience with {name}. Highly recommend to anyone looking for quality service.",
            "Amazing work by {name}. Very satisfied with the results and will definitely come back.",
            "Professional, efficient, and friendly. {name} provided exactly what I needed.",
            "Top-notch service from {name}. Great communication and attention to detail."
        ],
        "negative": [
            "Disappointing experience with {name}. Service was below expectations.",
            "Had some issues with communication. {name} could improve response time.",
            "Average service from {name}. Nothing special but got the job done.",
            "Expected better from {name}. Some areas need improvement.",
            "Mixed experience with {name}. Good points but also some concerns."
        ]
    },
    "companies": {
        "positive": [
            "Great company! {name} has excellent customer service and quality products/services.",
            "Very impressed with {name}. Professional team and reliable service.",
            "Outstanding experience with {name}. Would definitely recommend to others.",
            "Excellent company culture at {name}. Great place to work/do business with.",
            "Top-tier service from {name}. Exceeded expectations in every way."
        ],
        "negative": [
            "Had some issues with {name}. Customer service could be more responsive.",
            "Average experience with {name}. Room for improvement in several areas.",
            "Disappointing service from {name}. Expected better quality.",
            "Mixed feelings about {name}. Some good aspects but also problems.",
            "Service from {name} was okay but not outstanding. Could be better."
        ]
    },
    "places": {
        "positive": [
            "Love this place! {name} has great atmosphere and excellent service.",
            "Amazing experience at {name}. Will definitely be coming back soon.",
            "Fantastic location! {name} exceeded all my expectations.",
            "Perfect place for what I needed. {name} is highly recommended.",
            "Outstanding experience at {name}. Great ambiance and service."
        ],
        "negative": [
            "Disappointing visit to {name}. Service and quality were below average.",
            "Had some issues at {name}. Several things could be improved.",
            "Average experience at {name}. Nothing special but decent.",
            "Expected more from {name}. Some aspects were disappointing.",
            "Mixed experience at {name}. Good points but also areas of concern."
        ]
    },
    "products": {
        "positive": [
            "Excellent product! {name} works perfectly and exceeded my expectations.",
            "Great quality from {name}. Very satisfied with this purchase.",
            "Outstanding product! {name} is exactly what I was looking for.",
            "Perfect! {name} has great features and excellent build quality.",
            "Amazing product! {name} is definitely worth the investment."
        ],
        "negative": [
            "Disappointing product. {name} didn't meet my expectations.",
            "Had some issues with {name}. Quality could be better.",
            "Average product. {name} is okay but nothing special.",
            "Expected better from {name}. Some features are lacking.",
            "Mixed feelings about {name}. Good aspects but also problems."
        ]
    }
}

def create_sample_users(db: Session):
    """Create sample users for reviews"""
    print("Creating sample users...")
    
    created_users = []
    for user_data in SAMPLE_USERS:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data["email"]).first()
        if existing_user:
            created_users.append(existing_user)
            continue
            
        user = User(
            name=user_data["name"],
            email=user_data["email"],
            username=user_data["username"],
            hashed_password=pwd_context.hash("password123"),  # Simple password for demo
            is_verified=True,
            is_active=True,
            role=UserRole.USER,
            level=random.randint(1, 5),
            points=random.randint(100, 2000),
            bio=f"Active ReviewInn user sharing honest reviews and experiences.",
            created_at=datetime.utcnow() - timedelta(days=random.randint(30, 365))
        )
        
        db.add(user)
        created_users.append(user)
    
    db.commit()
    print(f"Created {len(created_users)} users")
    return created_users

def get_category_by_path(db: Session, category_path):
    """Get category ID by path like ['Professionals', 'Healthcare', 'Doctors']"""
    if not category_path:
        return None
    
    # Start with root category
    current_category = db.query(UnifiedCategory).filter(
        UnifiedCategory.name == category_path[0],
        UnifiedCategory.level == 1
    ).first()
    
    if not current_category or len(category_path) == 1:
        return current_category
    
    # Navigate through the hierarchy
    for i in range(1, len(category_path)):
        child_category = db.query(UnifiedCategory).filter(
            UnifiedCategory.name == category_path[i],
            UnifiedCategory.parent_id == current_category.id
        ).first()
        
        if not child_category:
            print(f"Warning: Category path {category_path} not found at level {i}")
            return current_category
        
        current_category = child_category
    
    return current_category

def create_sample_entities(db: Session):
    """Create sample entities with realistic data"""
    print("Creating sample entities...")
    
    created_entities = []
    
    for category, entities in SAMPLE_ENTITIES.items():
        # Get images for this category
        category_images = SAMPLE_IMAGES.get(category, SAMPLE_IMAGES["professionals"])
        
        for i, entity_data in enumerate(entities):
            # Check if entity already exists
            existing_entity = db.query(Entity).filter(Entity.name == entity_data["name"]).first()
            if existing_entity:
                created_entities.append(existing_entity)
                continue
            
            # Get category
            final_category = get_category_by_path(db, entity_data["category_path"])
            root_category = get_category_by_path(db, entity_data["category_path"][:1])
            
            if not final_category:
                print(f"Warning: Could not find category for {entity_data['name']}")
                continue
            
            # Select image
            image_url = category_images[i % len(category_images)]
            
            entity = Entity(
                name=entity_data["name"],
                description=entity_data["description"],
                category=category,  # Legacy field
                root_category_id=root_category.id if root_category else None,
                final_category_id=final_category.id,
                unified_category_id=final_category.id,  # For backward compatibility
                avatar=image_url,
                is_verified=random.choice([True, False]),
                is_claimed=random.choice([True, False]),
                context=entity_data.get("context", {}),
                view_count=random.randint(50, 1000),
                created_at=datetime.utcnow() - timedelta(days=random.randint(7, 365))
            )
            
            db.add(entity)
            created_entities.append(entity)
    
    db.commit()
    print(f"Created {len(created_entities)} entities")
    return created_entities

def create_sample_reviews(db: Session, users, entities):
    """Create realistic reviews for entities"""
    print("Creating sample reviews...")
    
    created_reviews = []
    
    for entity in entities:
        # Create 3-8 reviews per entity
        num_reviews = random.randint(3, 8)
        
        for _ in range(num_reviews):
            user = random.choice(users)
            
            # Check if user already reviewed this entity
            existing_review = db.query(Review).filter(
                Review.user_id == user.user_id,
                Review.entity_id == entity.entity_id
            ).first()
            
            if existing_review:
                continue
            
            # Determine sentiment (70% positive, 30% negative/neutral)
            is_positive = random.random() < 0.7
            sentiment = "positive" if is_positive else "negative"
            
            # Get category for templates
            category_key = entity.category
            if category_key not in REVIEW_TEMPLATES:
                category_key = "professionals"
            
            # Generate review content
            template = random.choice(REVIEW_TEMPLATES[category_key][sentiment])
            content = template.format(name=entity.name)
            
            # Generate rating based on sentiment
            if is_positive:
                overall_rating = random.uniform(4.0, 5.0)
            else:
                overall_rating = random.uniform(2.0, 3.9)
            
            # Generate title
            titles_positive = [
                "Excellent experience!",
                "Highly recommended",
                "Outstanding service",
                "Very satisfied",
                "Great quality",
                "Perfect choice"
            ]
            
            titles_negative = [
                "Could be better",
                "Had some issues",
                "Average experience",
                "Room for improvement",
                "Mixed feelings",
                "Disappointing"
            ]
            
            title = random.choice(titles_positive if is_positive else titles_negative)
            
            # Generate pros and cons
            pros = []
            cons = []
            
            if is_positive:
                pros = random.sample([
                    "Professional service",
                    "Great communication",
                    "High quality",
                    "Timely delivery",
                    "Fair pricing",
                    "Excellent support",
                    "User-friendly",
                    "Great value"
                ], random.randint(2, 4))
                
                if random.random() < 0.3:  # 30% chance of having cons even in positive reviews
                    cons = random.sample([
                        "Could be more affordable",
                        "Minor delays",
                        "Limited options"
                    ], 1)
            else:
                cons = random.sample([
                    "Poor communication",
                    "Delayed response",
                    "Quality issues",
                    "Overpriced",
                    "Limited support",
                    "Difficult to use",
                    "Not as described"
                ], random.randint(2, 4))
                
                if random.random() < 0.4:  # 40% chance of having some pros in negative reviews
                    pros = random.sample([
                        "Good intentions",
                        "Some positive aspects",
                        "Decent communication"
                    ], 1)
            
            review = Review(
                user_id=user.user_id,
                entity_id=entity.entity_id,
                title=title,
                content=content,
                category=entity.category,
                overall_rating=round(overall_rating, 1),
                pros=pros,
                cons=cons,
                is_anonymous=random.choice([True, False]),
                is_verified=random.choice([True, False]),
                view_count=random.randint(5, 200),
                created_at=datetime.utcnow() - timedelta(days=random.randint(1, 180))
            )
            
            db.add(review)
            created_reviews.append(review)
    
    db.commit()
    
    # Update entity ratings
    print("Updating entity ratings...")
    for entity in entities:
        reviews = db.query(Review).filter(Review.entity_id == entity.entity_id).all()
        if reviews:
            avg_rating = sum(r.overall_rating for r in reviews) / len(reviews)
            entity.average_rating = round(avg_rating, 2)
            entity.review_count = len(reviews)
    
    db.commit()
    print(f"Created {len(created_reviews)} reviews")
    return created_reviews

def main():
    """Main function to populate sample data"""
    print("🚀 Starting sample data population...")
    
    # Create database session
    from sqlalchemy.orm import sessionmaker
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Create sample users
        users = create_sample_users(db)
        
        # Create sample entities
        entities = create_sample_entities(db)
        
        # Create sample reviews
        reviews = create_sample_reviews(db, users, entities)
        
        print("✅ Sample data population completed successfully!")
        print(f"📊 Summary:")
        print(f"   - Users: {len(users)}")
        print(f"   - Entities: {len(entities)}")
        print(f"   - Reviews: {len(reviews)}")
        
    except Exception as e:
        print(f"❌ Error during population: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()