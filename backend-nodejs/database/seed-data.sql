-- Seed Data for Dating App
-- 20 men profiles + 20 women profiles

USE dating_app;

-- Create test users and profiles for MEN
-- Password for all: Test123! (hashed with bcrypt)
-- Hash: $2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2

INSERT INTO users (email, password_hash) VALUES
('john.smith@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('michael.jones@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('david.wilson@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('james.brown@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('robert.taylor@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('william.anderson@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('thomas.martin@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('charles.garcia@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('daniel.martinez@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('matthew.rodriguez@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('christopher.lee@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('andrew.clark@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('joshua.lewis@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('ryan.walker@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('brandon.hall@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('kevin.young@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('justin.king@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('benjamin.wright@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('samuel.scott@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('alexander.green@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2');

-- Create test users for WOMEN
INSERT INTO users (email, password_hash) VALUES
('emma.johnson@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('olivia.williams@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('sophia.davis@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('isabella.miller@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('mia.wilson@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('charlotte.moore@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('amelia.taylor@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('harper.anderson@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('evelyn.thomas@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('abigail.jackson@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('emily.white@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('madison.harris@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('elizabeth.martin@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('sofia.garcia@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('avery.martinez@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('ella.robinson@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('scarlett.clark@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('grace.rodriguez@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('chloe.lewis@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2'),
('victoria.lee@test.com', '$2b$10$fZ/7bUSPMEmfSziaojOHruNmNJTYLPhXHEiQuYNL8eTOg3qvX/SY2');

-- Create profiles for MEN
INSERT INTO profiles (user_id, first_name, birth_date, gender, looking_for, bio, location, interests, profile_photo) VALUES
(1, 'John', '1995-03-15', 'male', 'female', 'Software engineer who loves hiking and photography. Looking for someone adventurous!', 'Paris, France', 'Hiking, Photography, Technology, Coffee', 'https://i.pravatar.cc/300?img=12'),
(2, 'Michael', '1992-07-22', 'male', 'female', 'Fitness enthusiast and personal trainer. Let\'s stay active together!', 'Lyon, France', 'Fitness, Cooking, Travel, Sports', 'https://i.pravatar.cc/300?img=13'),
(3, 'David', '1990-11-08', 'male', 'female', 'Music producer who enjoys live concerts and festivals.', 'Marseille, France', 'Music, Concerts, DJing, Art', 'https://i.pravatar.cc/300?img=14'),
(4, 'James', '1994-05-30', 'male', 'female', 'Chef passionate about gastronomy and wine tasting.', 'Bordeaux, France', 'Cooking, Wine, Food, Travel', 'https://i.pravatar.cc/300?img=15'),
(5, 'Robert', '1988-09-12', 'male', 'female', 'Entrepreneur and travel lover. Been to 30+ countries!', 'Nice, France', 'Travel, Business, Photography, Scuba Diving', 'https://i.pravatar.cc/300?img=16'),
(6, 'William', '1996-01-25', 'male', 'female', 'Graphic designer with a passion for art and cinema.', 'Paris, France', 'Design, Cinema, Art, Gaming', 'https://i.pravatar.cc/300?img=17'),
(7, 'Thomas', '1993-04-18', 'male', 'female', 'Architect who loves modern design and urban exploration.', 'Lille, France', 'Architecture, Urban Exploration, Photography', 'https://i.pravatar.cc/300?img=18'),
(8, 'Charles', '1991-08-07', 'male', 'female', 'Doctor with a big heart. Love helping people and animals!', 'Toulouse, France', 'Medicine, Volunteering, Animals, Reading', 'https://i.pravatar.cc/300?img=19'),
(9, 'Daniel', '1989-12-20', 'male', 'female', 'Lawyer who enjoys debates and intellectual conversations.', 'Strasbourg, France', 'Law, Politics, Chess, Philosophy', 'https://i.pravatar.cc/300?img=20'),
(10, 'Matthew', '1995-06-14', 'male', 'female', 'Professional cyclist and nature lover. Let\'s ride together!', 'Grenoble, France', 'Cycling, Nature, Camping, Photography', 'https://i.pravatar.cc/300?img=21'),
(11, 'Christopher', '1992-02-28', 'male', 'female', 'Teacher who loves books and meaningful conversations.', 'Nantes, France', 'Reading, Teaching, Literature, Theater', 'https://i.pravatar.cc/300?img=22'),
(12, 'Andrew', '1994-10-05', 'male', 'female', 'Marine biologist passionate about ocean conservation.', 'Brest, France', 'Marine Life, Diving, Conservation, Travel', 'https://i.pravatar.cc/300?img=23'),
(13, 'Joshua', '1990-07-17', 'male', 'female', 'Video game developer who loves anime and tech.', 'Paris, France', 'Gaming, Anime, Programming, Comics', 'https://i.pravatar.cc/300?img=24'),
(14, 'Ryan', '1993-03-11', 'male', 'female', 'Pilot with a sense of adventure. Sky\'s not the limit!', 'Lyon, France', 'Aviation, Travel, Adventure, Sports', 'https://i.pravatar.cc/300?img=25'),
(15, 'Brandon', '1996-09-23', 'male', 'female', 'Fashion photographer looking for a muse and partner.', 'Paris, France', 'Fashion, Photography, Art, Design', 'https://i.pravatar.cc/300?img=26'),
(16, 'Kevin', '1991-05-19', 'male', 'female', 'Sommelier and wine expert. Let\'s explore vineyards!', 'Bordeaux, France', 'Wine, Food, Travel, Culture', 'https://i.pravatar.cc/300?img=27'),
(17, 'Justin', '1994-11-30', 'male', 'female', 'Firefighter with a brave heart and kind soul.', 'Marseille, France', 'Fitness, Helping Others, Outdoor Activities', 'https://i.pravatar.cc/300?img=28'),
(18, 'Benjamin', '1989-08-26', 'male', 'female', 'Veterinarian who adores all animals. Dog lover!', 'Nice, France', 'Animals, Veterinary, Hiking, Nature', 'https://i.pravatar.cc/300?img=29'),
(19, 'Samuel', '1995-01-09', 'male', 'female', 'Marketing manager with creative ideas and energy.', 'Paris, France', 'Marketing, Creativity, Startups, Travel', 'https://i.pravatar.cc/300?img=30'),
(20, 'Alexander', '1992-12-15', 'male', 'female', 'Historian fascinated by ancient civilizations.', 'Lyon, France', 'History, Museums, Travel, Reading', 'https://i.pravatar.cc/300?img=31');

-- Create profiles for WOMEN
INSERT INTO profiles (user_id, first_name, birth_date, gender, looking_for, bio, location, interests, profile_photo) VALUES
(21, 'Emma', '1994-04-12', 'female', 'male', 'Love yoga, meditation and healthy living. Looking for my zen partner!', 'Paris, France', 'Yoga, Meditation, Healthy Living, Nature', 'https://i.pravatar.cc/300?img=1'),
(22, 'Olivia', '1993-08-25', 'female', 'male', 'Travel blogger who has visited 40+ countries. Adventure awaits!', 'Lyon, France', 'Travel, Blogging, Photography, Culture', 'https://i.pravatar.cc/300?img=2'),
(23, 'Sophia', '1991-06-18', 'female', 'male', 'Pediatrician with a big heart. Love kids and animals!', 'Marseille, France', 'Medicine, Children, Animals, Volunteering', 'https://i.pravatar.cc/300?img=3'),
(24, 'Isabella', '1995-12-03', 'female', 'male', 'Fashion designer creating sustainable clothing.', 'Paris, France', 'Fashion, Sustainability, Art, Design', 'https://i.pravatar.cc/300?img=4'),
(25, 'Mia', '1992-02-14', 'female', 'male', 'Professional dancer and choreographer. Life is a dance!', 'Nice, France', 'Dance, Music, Fitness, Performance', 'https://i.pravatar.cc/300?img=5'),
(26, 'Charlotte', '1990-10-07', 'female', 'male', 'Environmental scientist fighting for our planet.', 'Grenoble, France', 'Environment, Science, Hiking, Activism', 'https://i.pravatar.cc/300?img=6'),
(27, 'Amelia', '1996-03-22', 'female', 'male', 'Baker who makes the best croissants in town!', 'Paris, France', 'Baking, Cooking, Food, Coffee', 'https://i.pravatar.cc/300?img=7'),
(28, 'Harper', '1994-07-09', 'female', 'male', 'Journalist covering international news. Love storytelling!', 'Bordeaux, France', 'Journalism, Writing, Travel, Politics', 'https://i.pravatar.cc/300?img=8'),
(29, 'Evelyn', '1993-11-16', 'female', 'male', 'Psychologist helping people find happiness.', 'Toulouse, France', 'Psychology, Helping Others, Reading, Yoga', 'https://i.pravatar.cc/300?img=9'),
(30, 'Abigail', '1989-05-28', 'female', 'male', 'Interior designer creating beautiful spaces.', 'Paris, France', 'Interior Design, Art, Architecture, Travel', 'https://i.pravatar.cc/300?img=10'),
(31, 'Emily', '1995-09-11', 'female', 'male', 'Musician playing piano and violin. Classical music lover!', 'Lyon, France', 'Music, Classical, Concerts, Art', 'https://i.pravatar.cc/300?img=11'),
(32, 'Madison', '1991-01-20', 'female', 'male', 'Marine photographer capturing ocean beauty.', 'Marseille, France', 'Photography, Ocean, Diving, Conservation', 'https://i.pravatar.cc/300?img=44'),
(33, 'Elizabeth', '1994-06-05', 'female', 'male', 'Software developer who codes and does yoga.', 'Paris, France', 'Programming, Yoga, Technology, Gaming', 'https://i.pravatar.cc/300?img=45'),
(34, 'Sofia', '1992-12-18', 'female', 'male', 'Flight attendant who loves discovering new cultures.', 'Nice, France', 'Travel, Culture, Languages, Adventure', 'https://i.pravatar.cc/300?img=46'),
(35, 'Avery', '1990-08-31', 'female', 'male', 'Yoga instructor helping people find balance.', 'Bordeaux, France', 'Yoga, Wellness, Meditation, Nature', 'https://i.pravatar.cc/300?img=47'),
(36, 'Ella', '1996-02-24', 'female', 'male', 'Florist with a passion for nature and beauty.', 'Paris, France', 'Flowers, Nature, Art, Gardening', 'https://i.pravatar.cc/300?img=48'),
(37, 'Scarlett', '1993-10-13', 'female', 'male', 'Event planner creating unforgettable moments.', 'Lyon, France', 'Event Planning, Creativity, People, Celebrations', 'https://i.pravatar.cc/300?img=49'),
(38, 'Grace', '1991-04-27', 'female', 'male', 'Researcher in renewable energy. Green future advocate!', 'Grenoble, France', 'Science, Environment, Hiking, Innovation', 'https://i.pravatar.cc/300?img=50'),
(39, 'Chloe', '1995-07-19', 'female', 'male', 'Sommelier exploring the world of wines.', 'Bordeaux, France', 'Wine, Food, Travel, Gastronomy', 'https://i.pravatar.cc/300?img=51'),
(40, 'Victoria', '1992-11-08', 'female', 'male', 'Art curator with refined taste. Museums are my second home!', 'Paris, France', 'Art, Museums, Culture, History', 'https://i.pravatar.cc/300?img=52');

-- Summary
SELECT 'Database seeded successfully!' as message;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_profiles FROM profiles;
SELECT gender, COUNT(*) as count FROM profiles GROUP BY gender;
