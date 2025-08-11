-- Insert all category questions with proper 1-5 rating scale

-- Companies/Institutes root
INSERT INTO category_questions (category_path, category_name, category_level, is_root_category, questions) VALUES 
('companiesinstitutes', 'Companies/Institutes', 1, true, '[
    {"key": "service_quality", "question": "How would you rate the overall service quality?", "description": "Quality of products or services provided (1-5 scale)"},
    {"key": "customer_service", "question": "How was the customer service experience?", "description": "Staff helpfulness, responsiveness, and support (1-5 scale)"},
    {"key": "facilities", "question": "How would you rate their facilities and resources?", "description": "Physical infrastructure, equipment, and resources (1-5 scale)"},
    {"key": "value_for_money", "question": "How would you rate the value for money?", "description": "Quality relative to price or cost (1-5 scale)"},
    {"key": "reputation", "question": "How would you rate their reputation and credibility?", "description": "Trustworthiness and standing in the industry (1-5 scale)"}
]');

-- Places root
INSERT INTO category_questions (category_path, category_name, category_level, is_root_category, questions) VALUES 
('places', 'Places', 1, true, '[
    {"key": "atmosphere", "question": "How would you rate the atmosphere and ambiance?", "description": "Overall feel, mood, and environment of the place (1-5 scale)"},
    {"key": "cleanliness", "question": "How clean and well-maintained was the place?", "description": "Hygiene standards and maintenance quality (1-5 scale)"},
    {"key": "accessibility", "question": "How accessible and convenient was the location?", "description": "Ease of access, parking, and transportation (1-5 scale)"},
    {"key": "staff_service", "question": "How was the service from staff members?", "description": "Staff friendliness, helpfulness, and efficiency (1-5 scale)"},
    {"key": "value_for_money", "question": "How would you rate the value for money?", "description": "Experience quality relative to cost (1-5 scale)"}
]');

-- Products root
INSERT INTO category_questions (category_path, category_name, category_level, is_root_category, questions) VALUES 
('products', 'Products', 1, true, '[
    {"key": "quality", "question": "How would you rate the overall product quality?", "description": "Build quality, materials, and craftsmanship (1-5 scale)"},
    {"key": "functionality", "question": "How well does the product function as expected?", "description": "Performance and reliability in intended use (1-5 scale)"},
    {"key": "design", "question": "How would you rate the design and aesthetics?", "description": "Visual appeal, ergonomics, and user experience (1-5 scale)"},
    {"key": "durability", "question": "How durable and long-lasting is the product?", "description": "Expected lifespan and resistance to wear (1-5 scale)"},
    {"key": "value_for_money", "question": "How would you rate the value for money?", "description": "Product quality relative to price paid (1-5 scale)"}
]');

-- Other/Custom root
INSERT INTO category_questions (category_path, category_name, category_level, is_root_category, questions) VALUES 
('other', 'Other', 1, true, '[
    {"key": "overall_satisfaction", "question": "How satisfied are you with this entity overall?", "description": "General satisfaction with the experience (1-5 scale)"},
    {"key": "quality", "question": "How would you rate the overall quality?", "description": "General quality assessment (1-5 scale)"},
    {"key": "reliability", "question": "How reliable was this entity?", "description": "Consistency and dependability (1-5 scale)"},
    {"key": "uniqueness", "question": "How unique or distinctive is this entity?", "description": "What makes it stand out from alternatives (1-5 scale)"},
    {"key": "recommendation", "question": "How likely are you to recommend this to others?", "description": "Likelihood to recommend based on experience (1-5 scale)"}
]');

-- Universities specific
INSERT INTO category_questions (category_path, category_name, category_level, is_root_category, questions) VALUES 
('companiesinstitutes.education.universities', 'Universities', 3, false, '[
    {"key": "academic_quality", "question": "How would you rate the academic quality and curriculum?", "description": "Quality of education, courses, and academic programs (1-5 scale)"},
    {"key": "faculty", "question": "How knowledgeable and helpful are the faculty members?", "description": "Teaching quality, expertise, and accessibility of professors (1-5 scale)"},
    {"key": "campus_facilities", "question": "How would you rate the campus facilities and resources?", "description": "Libraries, labs, dormitories, and campus infrastructure (1-5 scale)"},
    {"key": "student_support", "question": "How good is the student support and services?", "description": "Career services, counseling, and administrative support (1-5 scale)"},
    {"key": "value_for_money", "question": "How would you rate the value for tuition paid?", "description": "Education quality relative to tuition and fees (1-5 scale)"}
]');

-- Smartphones specific
INSERT INTO category_questions (category_path, category_name, category_level, is_root_category, questions) VALUES 
('products.electronics.smartphones', 'Smartphones', 3, false, '[
    {"key": "performance", "question": "How would you rate the overall performance?", "description": "Speed, responsiveness, and multitasking capability (1-5 scale)"},
    {"key": "battery_life", "question": "How satisfied are you with the battery life?", "description": "Battery duration and charging efficiency (1-5 scale)"},
    {"key": "camera_quality", "question": "How would you rate the camera quality?", "description": "Photo and video quality in various conditions (1-5 scale)"},
    {"key": "build_quality", "question": "How would you rate the build quality and design?", "description": "Materials, durability, and aesthetic appeal (1-5 scale)"},
    {"key": "value_for_money", "question": "How would you rate the value for money?", "description": "Feature set and quality relative to price (1-5 scale)"}
]');