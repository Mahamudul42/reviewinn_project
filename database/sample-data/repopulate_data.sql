-- Repopulate sample entities and reviews after category migration

-- Insert sample entities with unified categories
INSERT INTO entities (name, description, category, subcategory, unified_category_id, root_category_id, final_category_id, average_rating, review_count, is_verified, is_claimed, created_at, updated_at) VALUES
-- Universities (Education under Professionals)
('Harvard University', 'Prestigious private research university in Cambridge, Massachusetts', 'PROFESSIONALS', 'Education', 6, 1, 45, 4.5, 15, true, true, NOW(), NOW()),
('Stanford University', 'Private research university in Stanford, California', 'PROFESSIONALS', 'Education', 6, 1, 45, 4.6, 12, true, true, NOW(), NOW()),
('MIT', 'Massachusetts Institute of Technology - Leading science and technology university', 'PROFESSIONALS', 'Education', 6, 1, 45, 4.7, 18, true, true, NOW(), NOW()),

-- Tech Companies (Technology under Companies/Institutes)  
('Google LLC', 'Multinational technology company specializing in Internet-related services', 'COMPANIES', 'Technology', 20, 2, 48, 4.2, 25, true, true, NOW(), NOW()),
('Apple Inc.', 'Multinational technology company that designs and manufactures consumer electronics', 'COMPANIES', 'Technology', 20, 2, 48, 4.4, 22, true, true, NOW(), NOW()),
('Microsoft Corporation', 'Multinational technology corporation that produces computer software', 'COMPANIES', 'Technology', 20, 2, 48, 4.3, 19, true, false, NOW(), NOW()),

-- Hospitals (Healthcare under Companies/Institutes)
('Mayo Clinic', 'Nonprofit American academic medical center focused on integrated health care', 'COMPANIES', 'Healthcare', 24, 2, 19, 4.6, 8, true, true, NOW(), NOW()),
('Johns Hopkins Hospital', 'Teaching hospital and biomedical research facility', 'COMPANIES', 'Healthcare', 24, 2, 19, 4.5, 11, true, true, NOW(), NOW()),

-- Hotels (Hospitality under Places)
('The Ritz-Carlton', 'Luxury hotel chain with locations worldwide', 'PLACES', 'Hospitality', 30, 3, 56, 4.4, 14, true, true, NOW(), NOW()),
('Marriott International', 'American multinational hospitality company', 'PLACES', 'Hospitality', 30, 3, 56, 4.2, 16, true, true, NOW(), NOW()),

-- Restaurants (Hospitality under Places)
('The French Laundry', 'Three-Michelin-starred French restaurant in California', 'PLACES', 'Hospitality', 30, 3, 57, 4.8, 6, true, true, NOW(), NOW()),
('Eleven Madison Park', 'Fine dining restaurant in New York City', 'PLACES', 'Hospitality', 30, 3, 57, 4.7, 9, true, true, NOW(), NOW()),

-- Electronics Products
('iPhone 15 Pro', 'Latest flagship smartphone from Apple', 'PRODUCTS', 'Electronics', 38, 4, 52, 4.5, 28, true, false, NOW(), NOW()),
('MacBook Pro M3', 'Professional laptop computer from Apple', 'PRODUCTS', 'Electronics', 38, 4, 53, 4.6, 21, true, false, NOW(), NOW()),
('Samsung Galaxy S24', 'Flagship Android smartphone from Samsung', 'PRODUCTS', 'Electronics', 38, 4, 52, 4.3, 24, true, false, NOW(), NOW());

-- Insert sample reviews
INSERT INTO reviews (entity_id, reviewer_id, reviewer_name, reviewer_avatar, title, content, overall_rating, pros, cons, would_recommend, created_at, updated_at) VALUES
-- Harvard University reviews
(1, 1, 'Alice Johnson', 'https://ui-avatars.com/api/?name=Alice+Johnson&background=random&color=ffffff', 'Excellent Academic Experience', 'Harvard provided me with an outstanding education and opened many doors for my career. The faculty is world-class and the resources are unmatched.', 5, '["World-class faculty", "Excellent resources", "Great networking opportunities"]', '["Very expensive", "Highly competitive environment"]', true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(1, 2, 'Bob Smith', 'https://ui-avatars.com/api/?name=Bob+Smith&background=random&color=ffffff', 'Challenging but Rewarding', 'The academic rigor at Harvard is intense, but it really prepares you for the real world. The alumni network is incredible.', 4, '["Strong alumni network", "Rigorous academics", "Beautiful campus"]', '["High stress environment", "Limited financial aid"]', true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

-- Google LLC reviews  
(4, 3, 'Carol Davis', 'https://ui-avatars.com/api/?name=Carol+Davis&background=random&color=ffffff', 'Great Place to Work', 'Google offers excellent benefits and a collaborative work environment. The projects are challenging and meaningful.', 4, '["Excellent benefits", "Collaborative culture", "Challenging projects"]', '["Long hours sometimes", "High performance expectations"]', true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
(4, 4, 'David Wilson', 'https://ui-avatars.com/api/?name=David+Wilson&background=random&color=ffffff', 'Innovation at Its Best', 'Working at Google has been an amazing experience. The company truly values innovation and employee growth.', 5, '["Innovation focus", "Employee growth", "Amazing perks"]', '["Can be overwhelming for new grads"]', true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

-- Apple Inc reviews
(5, 1, 'Alice Johnson', 'https://ui-avatars.com/api/?name=Alice+Johnson&background=random&color=ffffff', 'Design Excellence', 'Apple''s attention to detail and design excellence is unmatched. Working here has elevated my design skills significantly.', 4, '["Design focus", "Quality products", "Strong brand"]', '["Very secretive culture", "Limited work-life balance"]', true, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),

-- Mayo Clinic reviews
(7, 2, 'Bob Smith', 'https://ui-avatars.com/api/?name=Bob+Smith&background=random&color=ffffff', 'Exceptional Healthcare', 'The care I received at Mayo Clinic was exceptional. The doctors are knowledgeable and the facilities are top-notch.', 5, '["Expert doctors", "State-of-art facilities", "Comprehensive care"]', '["Can be expensive", "Long wait times for appointments"]', true, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),

-- iPhone 15 Pro reviews
(13, 3, 'Carol Davis', 'https://ui-avatars.com/api/?name=Carol+Davis&background=random&color=ffffff', 'Outstanding Smartphone', 'The iPhone 15 Pro is an incredible device with amazing camera quality and performance. Battery life is excellent.', 5, '["Amazing camera", "Excellent performance", "Great battery life"]', '["Expensive", "No major design changes"]', true, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
(13, 4, 'David Wilson', 'https://ui-avatars.com/api/?name=David+Wilson&background=random&color=ffffff', 'Premium But Worth It', 'While expensive, the iPhone 15 Pro delivers on all fronts. The build quality and software experience are unmatched.', 4, '["Premium build quality", "Smooth software", "Great ecosystem"]', '["High price", "No USB-C to Lightning adapter included"]', true, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),

-- More reviews for variety
(2, 1, 'Alice Johnson', 'https://ui-avatars.com/api/?name=Alice+Johnson&background=random&color=ffffff', 'Stanford Excellence', 'Stanford University provides an excellent balance of academic rigor and innovation. The Silicon Valley location is a huge advantage.', 5, '["Great location", "Innovation focus", "Strong tech connections"]', '["High cost of living", "Competitive admission"]', true, NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'),
(6, 2, 'Bob Smith', 'https://ui-avatars.com/api/?name=Bob+Smith&background=random&color=ffffff', 'Microsoft Culture', 'Microsoft has really transformed its culture in recent years. Great benefits and work-life balance.', 4, '["Good work-life balance", "Strong benefits", "Collaborative culture"]', '["Large bureaucracy", "Slow decision making"]', true, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
(9, 3, 'Carol Davis', 'https://ui-avatars.com/api/?name=Carol+Davis&background=random&color=ffffff', 'Luxury Stay', 'The Ritz-Carlton provided an exceptional luxury experience. Service was impeccable and amenities were outstanding.', 5, '["Impeccable service", "Luxury amenities", "Beautiful locations"]', '["Very expensive", "Can feel stuffy"]', true, NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'),
(11, 4, 'David Wilson', 'https://ui-avatars.com/api/?name=David+Wilson&background=random&color=ffffff', 'Culinary Masterpiece', 'The French Laundry is truly a culinary masterpiece. Every dish was perfectly executed and the service was flawless.', 5, '["Perfect execution", "Flawless service", "Unique experience"]', '["Extremely expensive", "Hard to get reservations"]', true, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days');

-- Update view counts for some entities
UPDATE entities SET view_count = 150 WHERE id = 1;
UPDATE entities SET view_count = 120 WHERE id = 4;
UPDATE entities SET view_count = 200 WHERE id = 5;
UPDATE entities SET view_count = 95 WHERE id = 13;
UPDATE entities SET view_count = 85 WHERE id = 7;
UPDATE entities SET view_count = 110 WHERE id = 9;
UPDATE entities SET view_count = 75 WHERE id = 11;
UPDATE entities SET view_count = 180 WHERE id = 2;
UPDATE entities SET view_count = 90 WHERE id = 6;
UPDATE entities SET view_count = 140 WHERE id = 3;