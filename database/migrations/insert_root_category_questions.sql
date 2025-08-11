-- Insert root-level category questions (fallback questions)

-- Professionals root category questions
INSERT INTO category_questions (category_path, category_name, category_level, is_root_category, questions) VALUES 
('professionals', 'Professionals', 1, true, '[
    {
        "key": "expertise",
        "question": "How would you rate their expertise and knowledge?",
        "description": "Professional competence and subject matter expertise"
    },
    {
        "key": "professionalism",
        "question": "How professional was their conduct and communication?",
        "description": "Professional behavior, punctuality, and communication skills"
    },
    {
        "key": "reliability",
        "question": "How reliable and dependable were they?",
        "description": "Consistency in delivery and meeting commitments"
    },
    {
        "key": "value_for_money",
        "question": "How would you rate the value for money?",
        "description": "Quality of service relative to cost"
    },
    {
        "key": "recommendation",
        "question": "How likely are you to recommend them to others?",
        "description": "Overall satisfaction and likelihood to recommend"
    }
]');

-- Companies/Institutes root category questions  
INSERT INTO category_questions (category_path, category_name, category_level, is_root_category, questions) VALUES 
('companiesinstitutes', 'Companies/Institutes', 1, true, '[
    {
        "key": "service_quality",
        "question": "How would you rate the overall service quality?",
        "description": "Quality of products or services provided"
    },
    {
        "key": "customer_service",
        "question": "How was the customer service experience?",
        "description": "Staff helpfulness, responsiveness, and support"
    },
    {
        "key": "facilities",
        "question": "How would you rate their facilities and resources?",
        "description": "Physical infrastructure, equipment, and resources"
    },
    {
        "key": "value_for_money",
        "question": "How would you rate the value for money?",
        "description": "Quality relative to price or cost"
    },
    {
        "key": "reputation",
        "question": "How would you rate their reputation and credibility?",
        "description": "Trustworthiness and standing in the industry"
    }
]');

-- Places root category questions
INSERT INTO category_questions (category_path, category_name, category_level, is_root_category, questions) VALUES 
('places', 'Places', 1, true, '[
    {
        "key": "atmosphere",
        "question": "How would you rate the atmosphere and ambiance?",
        "description": "Overall feel, mood, and environment of the place"
    },
    {
        "key": "cleanliness",
        "question": "How clean and well-maintained was the place?",
        "description": "Hygiene standards and maintenance quality"
    },
    {
        "key": "accessibility",
        "question": "How accessible and convenient was the location?",
        "description": "Ease of access, parking, and transportation"
    },
    {
        "key": "staff_service",
        "question": "How was the service from staff members?",
        "description": "Staff friendliness, helpfulness, and efficiency"
    },
    {
        "key": "value_for_money",
        "question": "How would you rate the value for money?",
        "description": "Experience quality relative to cost"
    }
]');

-- Products root category questions
INSERT INTO category_questions (category_path, category_name, category_level, is_root_category, questions) VALUES 
('products', 'Products', 1, true, '[
    {
        "key": "quality",
        "question": "How would you rate the overall product quality?",
        "description": "Build quality, materials, and craftsmanship"
    },
    {
        "key": "functionality",
        "question": "How well does the product function as expected?",
        "description": "Performance and reliability in intended use"
    },
    {
        "key": "design",
        "question": "How would you rate the design and aesthetics?",
        "description": "Visual appeal, ergonomics, and user experience"
    },
    {
        "key": "durability",
        "question": "How durable and long-lasting is the product?",
        "description": "Expected lifespan and resistance to wear"
    },
    {
        "key": "value_for_money",
        "question": "How would you rate the value for money?",
        "description": "Product quality relative to price paid"
    }
]');

-- Other/Custom root category questions
INSERT INTO category_questions (category_path, category_name, category_level, is_root_category, questions) VALUES 
('other', 'Other', 1, true, '[
    {
        "key": "overall_satisfaction",
        "question": "How satisfied are you with this entity overall?",
        "description": "General satisfaction with the experience"
    },
    {
        "key": "quality",
        "question": "How would you rate the overall quality?",
        "description": "General quality assessment"
    },
    {
        "key": "reliability",
        "question": "How reliable was this entity?",
        "description": "Consistency and dependability"
    },
    {
        "key": "uniqueness",
        "question": "How unique or distinctive is this entity?",
        "description": "What makes it stand out from alternatives"
    },
    {
        "key": "recommendation",
        "question": "How likely are you to recommend this to others?",
        "description": "Likelihood to recommend based on experience"
    }
]');