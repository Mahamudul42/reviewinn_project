-- Insert hierarchical categories from category_structure.json

-- Root Categories (Level 1)
INSERT INTO unified_categories (name, slug, description, parent_id, path, level, icon, color, is_active, sort_order) VALUES
('Professionals', 'professionals', 'Individual professionals across various fields', NULL, 'professionals', 1, '👨‍💼', 'blue', true, 1),
('Companies/Institutes', 'companies-institutes', 'Organizations, companies, and institutions', NULL, 'companies-institutes', 1, '🏢', 'green', true, 2),
('Places', 'places', 'Physical locations and venues', NULL, 'places', 1, '📍', 'orange', true, 3),
('Products', 'products', 'Physical and digital products', NULL, 'products', 1, '📦', 'purple', true, 4),
('Other', 'other', 'Other categories', NULL, 'other', 1, '🔧', 'gray', true, 5);

-- Professionals Subcategories (Level 2)
INSERT INTO unified_categories (name, slug, description, parent_id, path, level, icon, color, is_active, sort_order) VALUES
('Education', 'education', 'Education professionals', 1, 'professionals/education', 2, '🎓', 'blue', true, 1),
('Healthcare', 'healthcare', 'Healthcare professionals', 1, 'professionals/healthcare', 2, '⚕️', 'blue', true, 2),
('Legal', 'legal', 'Legal professionals', 1, 'professionals/legal', 2, '⚖️', 'blue', true, 3),
('Engineering', 'engineering', 'Engineering professionals', 1, 'professionals/engineering', 2, '🛠️', 'blue', true, 4),
('Information Technology', 'information-technology', 'IT professionals', 1, 'professionals/information-technology', 2, '💻', 'blue', true, 5),
('Business', 'business', 'Business professionals', 1, 'professionals/business', 2, '💼', 'blue', true, 6),
('Finance', 'finance', 'Finance professionals', 1, 'professionals/finance', 2, '💰', 'blue', true, 7),
('Creative Arts', 'creative-arts', 'Creative arts professionals', 1, 'professionals/creative-arts', 2, '🎨', 'blue', true, 8),
('Media', 'media', 'Media professionals', 1, 'professionals/media', 2, '📺', 'blue', true, 9),
('Public Services', 'public-services', 'Public service professionals', 1, 'professionals/public-services', 2, '🏛️', 'blue', true, 10),
('Hospitality', 'hospitality', 'Hospitality professionals', 1, 'professionals/hospitality', 2, '🍽️', 'blue', true, 11),
('Skilled Trades', 'skilled-trades', 'Skilled trades professionals', 1, 'professionals/skilled-trades', 2, '🔧', 'blue', true, 12),
('Other', 'other-professionals', 'Other professionals', 1, 'professionals/other', 2, '📂', 'blue', true, 13);

-- Companies/Institutes Subcategories (Level 2)
INSERT INTO unified_categories (name, slug, description, parent_id, path, level, icon, color, is_active, sort_order) VALUES
('Education', 'education-companies', 'Educational institutions', 2, 'companies-institutes/education', 2, '🎓', 'green', true, 1),
('Technology', 'technology', 'Technology companies', 2, 'companies-institutes/technology', 2, '💻', 'green', true, 2),
('Manufacturing', 'manufacturing', 'Manufacturing companies', 2, 'companies-institutes/manufacturing', 2, '🏭', 'green', true, 3),
('Retail', 'retail', 'Retail companies', 2, 'companies-institutes/retail', 2, '🛍️', 'green', true, 4),
('Healthcare', 'healthcare-companies', 'Healthcare institutions', 2, 'companies-institutes/healthcare', 2, '⚕️', 'green', true, 5),
('Finance', 'finance-companies', 'Financial institutions', 2, 'companies-institutes/finance', 2, '💰', 'green', true, 6),
('Government Agencies', 'government-agencies', 'Government agencies', 2, 'companies-institutes/government-agencies', 2, '🏛️', 'green', true, 7),
('Non-Profits', 'non-profits', 'Non-profit organizations', 2, 'companies-institutes/non-profits', 2, '🤝', 'green', true, 8),
('Other', 'other-companies', 'Other companies', 2, 'companies-institutes/other', 2, '📂', 'green', true, 9);

-- Places Subcategories (Level 2)
INSERT INTO unified_categories (name, slug, description, parent_id, path, level, icon, color, is_active, sort_order) VALUES
('Hospitality', 'hospitality-places', 'Hospitality venues', 3, 'places/hospitality', 2, '🍽️', 'orange', true, 1),
('Tourism', 'tourism', 'Tourism locations', 3, 'places/tourism', 2, '🗺️', 'orange', true, 2),
('Public Services', 'public-services-places', 'Public service locations', 3, 'places/public-services', 2, '🏛️', 'orange', true, 3),
('Retail', 'retail-places', 'Retail locations', 3, 'places/retail', 2, '🛍️', 'orange', true, 4),
('Recreation', 'recreation', 'Recreation venues', 3, 'places/recreation', 2, '🎮', 'orange', true, 5),
('Other', 'other-places', 'Other places', 3, 'places/other', 2, '📂', 'orange', true, 6);

-- Products Subcategories (Level 2)
INSERT INTO unified_categories (name, slug, description, parent_id, path, level, icon, color, is_active, sort_order) VALUES
('Electronics', 'electronics', 'Electronic products', 4, 'products/electronics', 2, '📱', 'purple', true, 1),
('Fashion', 'fashion', 'Fashion products', 4, 'products/fashion', 2, '👗', 'purple', true, 2),
('Food & Beverages', 'food-beverages', 'Food and beverage products', 4, 'products/food-beverages', 2, '🍔', 'purple', true, 3),
('Home & Kitchen', 'home-kitchen', 'Home and kitchen products', 4, 'products/home-kitchen', 2, '🏠', 'purple', true, 4),
('Health & Beauty', 'health-beauty', 'Health and beauty products', 4, 'products/health-beauty', 2, '💄', 'purple', true, 5),
('Automotive', 'automotive', 'Automotive products', 4, 'products/automotive', 2, '🚗', 'purple', true, 6),
('Sports & Outdoors', 'sports-outdoors', 'Sports and outdoor products', 4, 'products/sports-outdoors', 2, '⚽', 'purple', true, 7),
('Other', 'other-products', 'Other products', 4, 'products/other', 2, '📂', 'purple', true, 8);

-- Other Subcategories (Level 2)
INSERT INTO unified_categories (name, slug, description, parent_id, path, level, icon, color, is_active, sort_order) VALUES
('Custom', 'custom', 'Custom categories', 5, 'other/custom', 2, '📂', 'gray', true, 1);

-- Sample Level 3 categories (Final categories for selection)
-- Education professionals
INSERT INTO unified_categories (name, slug, description, parent_id, path, level, icon, color, is_active, sort_order) VALUES
('University Professors', 'university-professors', 'University and college professors', 6, 'professionals/education/university-professors', 3, '👨‍🏫', 'blue', true, 1),
('School Teachers', 'school-teachers', 'Primary and secondary school teachers', 6, 'professionals/education/school-teachers', 3, '👩‍🏫', 'blue', true, 2),
('Tutors', 'tutors', 'Private tutors and instructors', 6, 'professionals/education/tutors', 3, '📚', 'blue', true, 3),
('Librarians', 'librarians', 'Library professionals', 6, 'professionals/education/librarians', 3, '📖', 'blue', true, 4);

-- Healthcare professionals  
INSERT INTO unified_categories (name, slug, description, parent_id, path, level, icon, color, is_active, sort_order) VALUES
('General Physicians', 'general-physicians', 'General practice doctors', 7, 'professionals/healthcare/general-physicians', 3, '👨‍⚕️', 'blue', true, 1),
('Specialist Doctors', 'specialist-doctors', 'Medical specialists', 7, 'professionals/healthcare/specialist-doctors', 3, '🩺', 'blue', true, 2),
('Nurses', 'nurses', 'Registered nurses', 7, 'professionals/healthcare/nurses', 3, '👩‍⚕️', 'blue', true, 3),
('Pharmacists', 'pharmacists', 'Licensed pharmacists', 7, 'professionals/healthcare/pharmacists', 3, '💊', 'blue', true, 4);

-- Technology companies
INSERT INTO unified_categories (name, slug, description, parent_id, path, level, icon, color, is_active, sort_order) VALUES
('Software Companies', 'software-companies', 'Software development companies', 15, 'companies-institutes/technology/software-companies', 3, '💻', 'green', true, 1),
('IT Services', 'it-services', 'IT service providers', 15, 'companies-institutes/technology/it-services', 3, '🖥️', 'green', true, 2),
('Hardware Manufacturers', 'hardware-manufacturers', 'Computer hardware manufacturers', 15, 'companies-institutes/technology/hardware-manufacturers', 3, '🔧', 'green', true, 3);

-- Electronics products
INSERT INTO unified_categories (name, slug, description, parent_id, path, level, icon, color, is_active, sort_order) VALUES
('Smartphones', 'smartphones', 'Mobile phones and smartphones', 30, 'products/electronics/smartphones', 3, '📱', 'purple', true, 1),
('Laptops', 'laptops', 'Laptop computers', 30, 'products/electronics/laptops', 3, '💻', 'purple', true, 2),
('Tablets', 'tablets', 'Tablet devices', 30, 'products/electronics/tablets', 3, '📱', 'purple', true, 3),
('Gaming Consoles', 'gaming-consoles', 'Gaming consoles and systems', 30, 'products/electronics/gaming-consoles', 3, '🎮', 'purple', true, 4);

-- Hotels and restaurants
INSERT INTO unified_categories (name, slug, description, parent_id, path, level, icon, color, is_active, sort_order) VALUES
('Hotels', 'hotels', 'Hotels and accommodations', 22, 'places/hospitality/hotels', 3, '🏨', 'orange', true, 1),
('Restaurants', 'restaurants', 'Restaurants and dining establishments', 22, 'places/hospitality/restaurants', 3, '🍽️', 'orange', true, 2),
('Cafes', 'cafes', 'Coffee shops and cafes', 22, 'places/hospitality/cafes', 3, '☕', 'orange', true, 3),
('Bars', 'bars', 'Bars and pubs', 22, 'places/hospitality/bars', 3, '🍺', 'orange', true, 4);