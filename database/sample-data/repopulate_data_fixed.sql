-- Repopulate sample entities and reviews after category migration

-- Insert sample entities with unified categories (using correct column names)
INSERT INTO entities (name, description, category, subcategory, unified_category_id, root_category_id, final_category_id, average_rating, review_count, view_count, is_verified, is_claimed, created_at, updated_at) VALUES
-- Universities (Education under Professionals)
('Harvard University', 'Prestigious private research university in Cambridge, Massachusetts', 'PROFESSIONALS', 'Education', 6, 1, 6, 4.5, 15, 150, true, true, NOW(), NOW()),
('Stanford University', 'Private research university in Stanford, California', 'PROFESSIONALS', 'Education', 6, 1, 6, 4.6, 12, 180, true, true, NOW(), NOW()),
('MIT', 'Massachusetts Institute of Technology - Leading science and technology university', 'PROFESSIONALS', 'Education', 6, 1, 6, 4.7, 18, 140, true, true, NOW(), NOW()),

-- Tech Companies (Technology under Companies/Institutes)  
('Google LLC', 'Multinational technology company specializing in Internet-related services', 'COMPANIES', 'Technology', 20, 2, 20, 4.2, 25, 120, true, true, NOW(), NOW()),
('Apple Inc.', 'Multinational technology company that designs and manufactures consumer electronics', 'COMPANIES', 'Technology', 20, 2, 20, 4.4, 22, 200, true, true, NOW(), NOW()),
('Microsoft Corporation', 'Multinational technology corporation that produces computer software', 'COMPANIES', 'Technology', 20, 2, 20, 4.3, 19, 90, true, false, NOW(), NOW()),

-- Hospitals (Healthcare under Companies/Institutes)
('Mayo Clinic', 'Nonprofit American academic medical center focused on integrated health care', 'COMPANIES', 'Healthcare', 24, 2, 24, 4.6, 8, 85, true, true, NOW(), NOW()),
('Johns Hopkins Hospital', 'Teaching hospital and biomedical research facility', 'COMPANIES', 'Healthcare', 24, 2, 24, 4.5, 11, 95, true, true, NOW(), NOW()),

-- Hotels (Hospitality under Places)
('The Ritz-Carlton', 'Luxury hotel chain with locations worldwide', 'PLACES', 'Hospitality', 30, 3, 30, 4.4, 14, 110, true, true, NOW(), NOW()),
('Marriott International', 'American multinational hospitality company', 'PLACES', 'Hospitality', 30, 3, 30, 4.2, 16, 105, true, true, NOW(), NOW()),

-- Restaurants (Hospitality under Places)
('The French Laundry', 'Three-Michelin-starred French restaurant in California', 'PLACES', 'Hospitality', 30, 3, 30, 4.8, 6, 75, true, true, NOW(), NOW()),
('Eleven Madison Park', 'Fine dining restaurant in New York City', 'PLACES', 'Hospitality', 30, 3, 30, 4.7, 9, 88, true, true, NOW(), NOW()),

-- Electronics Products
('iPhone 15 Pro', 'Latest flagship smartphone from Apple', 'PRODUCTS', 'Electronics', 38, 4, 38, 4.5, 28, 95, true, false, NOW(), NOW()),
('MacBook Pro M3', 'Professional laptop computer from Apple', 'PRODUCTS', 'Electronics', 38, 4, 38, 4.6, 21, 125, true, false, NOW(), NOW()),
('Samsung Galaxy S24', 'Flagship Android smartphone from Samsung', 'PRODUCTS', 'Electronics', 38, 4, 38, 4.3, 24, 110, true, false, NOW(), NOW());

-- Insert sample reviews (using correct column names: user_id instead of reviewer_id)
INSERT INTO reviews (entity_id, user_id, title, content, overall_rating, pros, cons, view_count, created_at, updated_at) VALUES
-- Harvard University reviews
(1, 1, 'Excellent Academic Experience', 'Harvard provided me with an outstanding education and opened many doors for my career. The faculty is world-class and the resources are unmatched.', 5, '["World-class faculty", "Excellent resources", "Great networking opportunities"]', '["Very expensive", "Highly competitive environment"]', 25, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(1, 2, 'Challenging but Rewarding', 'The academic rigor at Harvard is intense, but it really prepares you for the real world. The alumni network is incredible.', 4, '["Strong alumni network", "Rigorous academics", "Beautiful campus"]', '["High stress environment", "Limited financial aid"]', 18, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

-- Google LLC reviews  
(4, 3, 'Great Place to Work', 'Google offers excellent benefits and a collaborative work environment. The projects are challenging and meaningful.', 4, '["Excellent benefits", "Collaborative culture", "Challenging projects"]', '["Long hours sometimes", "High performance expectations"]', 30, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
(4, 4, 'Innovation at Its Best', 'Working at Google has been an amazing experience. The company truly values innovation and employee growth.', 5, '["Innovation focus", "Employee growth", "Amazing perks"]', '["Can be overwhelming for new grads"]', 22, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

-- Apple Inc reviews
(5, 1, 'Design Excellence', 'Apple''s attention to detail and design excellence is unmatched. Working here has elevated my design skills significantly.', 4, '["Design focus", "Quality products", "Strong brand"]', '["Very secretive culture", "Limited work-life balance"]', 35, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),

-- Mayo Clinic reviews
(7, 2, 'Exceptional Healthcare', 'The care I received at Mayo Clinic was exceptional. The doctors are knowledgeable and the facilities are top-notch.', 5, '["Expert doctors", "State-of-art facilities", "Comprehensive care"]', '["Can be expensive", "Long wait times for appointments"]', 28, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),

-- iPhone 15 Pro reviews
(13, 3, 'Outstanding Smartphone', 'The iPhone 15 Pro is an incredible device with amazing camera quality and performance. Battery life is excellent.', 5, '["Amazing camera", "Excellent performance", "Great battery life"]', '["Expensive", "No major design changes"]', 42, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
(13, 4, 'Premium But Worth It', 'While expensive, the iPhone 15 Pro delivers on all fronts. The build quality and software experience are unmatched.', 4, '["Premium build quality", "Smooth software", "Great ecosystem"]', '["High price", "No USB-C to Lightning adapter included"]', 38, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),

-- More reviews for variety
(2, 1, 'Stanford Excellence', 'Stanford University provides an excellent balance of academic rigor and innovation. The Silicon Valley location is a huge advantage.', 5, '["Great location", "Innovation focus", "Strong tech connections"]', '["High cost of living", "Competitive admission"]', 33, NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'),
(6, 2, 'Microsoft Culture', 'Microsoft has really transformed its culture in recent years. Great benefits and work-life balance.', 4, '["Good work-life balance", "Strong benefits", "Collaborative culture"]', '["Large bureaucracy", "Slow decision making"]', 27, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
(9, 3, 'Luxury Stay', 'The Ritz-Carlton provided an exceptional luxury experience. Service was impeccable and amenities were outstanding.', 5, '["Impeccable service", "Luxury amenities", "Beautiful locations"]', '["Very expensive", "Can feel stuffy"]', 31, NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'),
(11, 4, 'Culinary Masterpiece', 'The French Laundry is truly a culinary masterpiece. Every dish was perfectly executed and the service was flawless.', 5, '["Perfect execution", "Flawless service", "Unique experience"]', '["Extremely expensive", "Hard to get reservations"]', 29, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),

-- Additional reviews to make the homepage more lively
(3, 2, 'MIT Innovation', 'MIT continues to be at the forefront of technological innovation. The research opportunities are unparalleled.', 5, '["Cutting-edge research", "World-class faculty", "Innovation culture"]', '["Intense workload", "High competition"]', 26, NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'),
(8, 3, 'Johns Hopkins Excellence', 'Johns Hopkins Hospital provides exceptional medical care. The staff is professional and knowledgeable.', 4, '["Expert medical staff", "Advanced facilities", "Comprehensive care"]', '["Long wait times", "Complex billing"]', 24, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
(14, 1, 'MacBook Pro Performance', 'The MacBook Pro M3 is a powerhouse for professional work. The battery life and performance are impressive.', 5, '["Excellent performance", "Great battery life", "Beautiful display"]', '["Expensive", "Limited ports"]', 36, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
(15, 4, 'Galaxy S24 Review', 'Samsung Galaxy S24 offers great value with excellent camera and performance. Android 14 is smooth.', 4, '["Great camera", "Smooth performance", "Good value"]', '["Bloatware", "Average battery life"]', 32, NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days');