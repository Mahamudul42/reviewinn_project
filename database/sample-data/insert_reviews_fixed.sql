-- Insert sample reviews with correct entity IDs
INSERT INTO reviews (entity_id, user_id, title, content, overall_rating, pros, cons, view_count, created_at, updated_at) VALUES
-- Harvard University reviews (entity_id = 2)
(2, 1, 'Excellent Academic Experience', 'Harvard provided me with an outstanding education and opened many doors for my career. The faculty is world-class and the resources are unmatched.', 5, '["World-class faculty", "Excellent resources", "Great networking opportunities"]', '["Very expensive", "Highly competitive environment"]', 25, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(2, 2, 'Challenging but Rewarding', 'The academic rigor at Harvard is intense, but it really prepares you for the real world. The alumni network is incredible.', 4, '["Strong alumni network", "Rigorous academics", "Beautiful campus"]', '["High stress environment", "Limited financial aid"]', 18, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

-- Google LLC reviews (entity_id = 5)
(5, 3, 'Great Place to Work', 'Google offers excellent benefits and a collaborative work environment. The projects are challenging and meaningful.', 4, '["Excellent benefits", "Collaborative culture", "Challenging projects"]', '["Long hours sometimes", "High performance expectations"]', 30, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
(5, 4, 'Innovation at Its Best', 'Working at Google has been an amazing experience. The company truly values innovation and employee growth.', 5, '["Innovation focus", "Employee growth", "Amazing perks"]', '["Can be overwhelming for new grads"]', 22, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

-- Apple Inc reviews (entity_id = 6)
(6, 1, 'Design Excellence', 'Apple''s attention to detail and design excellence is unmatched. Working here has elevated my design skills significantly.', 4, '["Design focus", "Quality products", "Strong brand"]', '["Very secretive culture", "Limited work-life balance"]', 35, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),

-- Mayo Clinic reviews (entity_id = 8)
(8, 2, 'Exceptional Healthcare', 'The care I received at Mayo Clinic was exceptional. The doctors are knowledgeable and the facilities are top-notch.', 5, '["Expert doctors", "State-of-art facilities", "Comprehensive care"]', '["Can be expensive", "Long wait times for appointments"]', 28, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),

-- iPhone 15 Pro reviews (entity_id = 14)
(14, 3, 'Outstanding Smartphone', 'The iPhone 15 Pro is an incredible device with amazing camera quality and performance. Battery life is excellent.', 5, '["Amazing camera", "Excellent performance", "Great battery life"]', '["Expensive", "No major design changes"]', 42, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
(14, 4, 'Premium But Worth It', 'While expensive, the iPhone 15 Pro delivers on all fronts. The build quality and software experience are unmatched.', 4, '["Premium build quality", "Smooth software", "Great ecosystem"]', '["High price", "No USB-C to Lightning adapter included"]', 38, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),

-- More reviews for variety
(3, 1, 'Stanford Excellence', 'Stanford University provides an excellent balance of academic rigor and innovation. The Silicon Valley location is a huge advantage.', 5, '["Great location", "Innovation focus", "Strong tech connections"]', '["High cost of living", "Competitive admission"]', 33, NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'),
(7, 2, 'Microsoft Culture', 'Microsoft has really transformed its culture in recent years. Great benefits and work-life balance.', 4, '["Good work-life balance", "Strong benefits", "Collaborative culture"]', '["Large bureaucracy", "Slow decision making"]', 27, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
(10, 3, 'Luxury Stay', 'The Ritz-Carlton provided an exceptional luxury experience. Service was impeccable and amenities were outstanding.', 5, '["Impeccable service", "Luxury amenities", "Beautiful locations"]', '["Very expensive", "Can feel stuffy"]', 31, NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'),
(12, 4, 'Culinary Masterpiece', 'The French Laundry is truly a culinary masterpiece. Every dish was perfectly executed and the service was flawless.', 5, '["Perfect execution", "Flawless service", "Unique experience"]', '["Extremely expensive", "Hard to get reservations"]', 29, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),

-- Additional reviews to make the homepage more lively
(4, 2, 'MIT Innovation', 'MIT continues to be at the forefront of technological innovation. The research opportunities are unparalleled.', 5, '["Cutting-edge research", "World-class faculty", "Innovation culture"]', '["Intense workload", "High competition"]', 26, NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'),
(9, 3, 'Johns Hopkins Excellence', 'Johns Hopkins Hospital provides exceptional medical care. The staff is professional and knowledgeable.', 4, '["Expert medical staff", "Advanced facilities", "Comprehensive care"]', '["Long wait times", "Complex billing"]', 24, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
(15, 1, 'MacBook Pro Performance', 'The MacBook Pro M3 is a powerhouse for professional work. The battery life and performance are impressive.', 5, '["Excellent performance", "Great battery life", "Beautiful display"]', '["Expensive", "Limited ports"]', 36, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
(16, 4, 'Galaxy S24 Review', 'Samsung Galaxy S24 offers great value with excellent camera and performance. Android 14 is smooth.', 4, '["Great camera", "Smooth performance", "Good value"]', '["Bloatware", "Average battery life"]', 32, NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days');