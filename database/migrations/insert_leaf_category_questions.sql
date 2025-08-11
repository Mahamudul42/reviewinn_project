-- Insert specific questions for popular leaf subcategories

-- Universities
INSERT INTO category_questions (category_path, category_name, category_level, is_root_category, questions) VALUES 
('companiesinstitutes.education.universities', 'Universities', 3, false, '[
    {
        "key": "academic_quality",
        "question": "How would you rate the academic quality and curriculum?",
        "description": "Quality of education, courses, and academic programs"
    },
    {
        "key": "faculty",
        "question": "How knowledgeable and helpful are the faculty members?",
        "description": "Teaching quality, expertise, and accessibility of professors"
    },
    {
        "key": "campus_facilities",
        "question": "How would you rate the campus facilities and resources?",
        "description": "Libraries, labs, dormitories, and campus infrastructure"
    },
    {
        "key": "student_support",
        "question": "How good is the student support and services?",
        "description": "Career services, counseling, and administrative support"
    },
    {
        "key": "value_for_money",
        "question": "How would you rate the value for tuition paid?",
        "description": "Education quality relative to tuition and fees"
    }
]');

-- Hospitals (Healthcare)
INSERT INTO category_questions (category_path, category_name, category_level, is_root_category, questions) VALUES 
('companiesinstitutes.healthcare.hospitals', 'Hospitals', 3, false, '[
    {
        "key": "medical_care",
        "question": "How would you rate the quality of medical care?",
        "description": "Treatment effectiveness and medical expertise"
    },
    {
        "key": "staff_professionalism",
        "question": "How professional and caring were the medical staff?",
        "description": "Bedside manner, communication, and compassion"
    },
    {
        "key": "facilities_cleanliness",
        "question": "How clean and well-equipped were the facilities?",
        "description": "Hygiene standards and medical equipment quality"
    },
    {
        "key": "wait_times",
        "question": "How reasonable were the wait times?",
        "description": "Efficiency in scheduling and service delivery"
    },
    {
        "key": "billing_transparency",
        "question": "How transparent and fair was the billing process?",
        "description": "Clarity of charges and billing procedures"
    }
]');

-- Restaurants
INSERT INTO category_questions (category_path, category_name, category_level, is_root_category, questions) VALUES 
('places.hospitality.restaurants', 'Restaurants', 3, false, '[
    {
        "key": "food_quality",
        "question": "How would you rate the food quality and taste?",
        "description": "Flavor, freshness, and preparation quality"
    },
    {
        "key": "service",
        "question": "How was the service from waitstaff?",
        "description": "Attentiveness, friendliness, and efficiency of service"
    },
    {
        "key": "ambiance",
        "question": "How would you rate the restaurant atmosphere?",
        "description": "Ambiance, decor, noise level, and overall dining environment"
    },
    {
        "key": "portion_size",
        "question": "How appropriate were the portion sizes?",
        "description": "Value and adequacy of food portions"
    },
    {
        "key": "value_for_money",
        "question": "How would you rate the value for money?",
        "description": "Food quality and experience relative to price"
    }
]');

-- Smartphones
INSERT INTO category_questions (category_path, category_name, category_level, is_root_category, questions) VALUES 
('products.electronics.smartphones', 'Smartphones', 3, false, '[
    {
        "key": "performance",
        "question": "How would you rate the overall performance?",
        "description": "Speed, responsiveness, and multitasking capability"
    },
    {
        "key": "battery_life",
        "question": "How satisfied are you with the battery life?",
        "description": "Battery duration and charging efficiency"
    },
    {
        "key": "camera_quality",
        "question": "How would you rate the camera quality?",
        "description": "Photo and video quality in various conditions"
    },
    {
        "key": "build_quality",
        "question": "How would you rate the build quality and design?",
        "description": "Materials, durability, and aesthetic appeal"
    },
    {
        "key": "value_for_money",
        "question": "How would you rate the value for money?",
        "description": "Feature set and quality relative to price"
    }
]');

-- Software Engineers (Professional)
INSERT INTO category_questions (category_path, category_name, category_level, is_root_category, questions) VALUES 
('professionals.information-technology.software-engineers', 'Software Engineers', 3, false, '[
    {
        "key": "technical_skills",
        "question": "How would you rate their technical programming skills?",
        "description": "Coding ability, problem-solving, and technical expertise"
    },
    {
        "key": "communication",
        "question": "How well do they communicate technical concepts?",
        "description": "Ability to explain complex ideas clearly"
    },
    {
        "key": "project_delivery",
        "question": "How reliable are they with project deadlines?",
        "description": "Timeliness and quality of deliverables"
    },
    {
        "key": "code_quality",
        "question": "How would you rate the quality of their code?",
        "description": "Code maintainability, documentation, and best practices"
    },
    {
        "key": "collaboration",
        "question": "How well do they work in a team environment?",
        "description": "Teamwork, mentoring, and collaborative skills"
    }
]');

-- Hotels
INSERT INTO category_questions (category_path, category_name, category_level, is_root_category, questions) VALUES 
('places.hospitality.hotels', 'Hotels', 3, false, '[
    {
        "key": "room_quality",
        "question": "How would you rate the room quality and comfort?",
        "description": "Bed comfort, room amenities, and overall room condition"
    },
    {
        "key": "cleanliness",
        "question": "How clean were the rooms and common areas?",
        "description": "Housekeeping standards and hygiene maintenance"
    },
    {
        "key": "staff_service",
        "question": "How helpful and professional was the hotel staff?",
        "description": "Front desk, housekeeping, and concierge service quality"
    },
    {
        "key": "amenities",
        "question": "How would you rate the hotel amenities?",
        "description": "Pool, gym, restaurant, WiFi, and other facilities"
    },
    {
        "key": "location",
        "question": "How convenient was the hotel location?",
        "description": "Proximity to attractions, transportation, and accessibility"
    }
]');