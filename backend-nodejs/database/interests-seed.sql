-- Seed data for interest categories and interests

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Insert Interest Categories
INSERT INTO interest_categories (category_name, category_icon, display_order) VALUES
('Sports & Fitness', '⚽', 1),
('Music & Arts', '🎵', 2),
('Food & Dining', '🍕', 3),
('Travel & Adventure', '✈️', 4),
('Entertainment', '🎬', 5),
('Hobbies & Crafts', '🎨', 6),
('Technology & Gaming', '💻', 7),
('Nature & Outdoors', '🌲', 8),
('Learning & Culture', '📚', 9),
('Social & Community', '👥', 10);

-- Insert Interests for Sports & Fitness
INSERT INTO interests (category_id, interest_name, interest_icon, display_order) VALUES
(1, 'Football/Soccer', '⚽', 1),
(1, 'Basketball', '🏀', 2),
(1, 'Tennis', '🎾', 3),
(1, 'Swimming', '🏊', 4),
(1, 'Yoga', '🧘', 5),
(1, 'Gym/Fitness', '💪', 6),
(1, 'Running', '🏃', 7),
(1, 'Cycling', '🚴', 8),
(1, 'Martial Arts', '🥋', 9),
(1, 'Dancing', '💃', 10);

-- Insert Interests for Music & Arts
INSERT INTO interests (category_id, interest_name, interest_icon, display_order) VALUES
(2, 'Live Music', '🎤', 1),
(2, 'Playing Instruments', '🎸', 2),
(2, 'Singing', '🎵', 3),
(2, 'Painting', '🎨', 4),
(2, 'Photography', '📷', 5),
(2, 'Drawing', '✏️', 6),
(2, 'Theatre', '🎭', 7),
(2, 'Classical Music', '🎻', 8),
(2, 'Electronic Music', '🎧', 9),
(2, 'Rock/Pop Music', '🎸', 10);

-- Insert Interests for Food & Dining
INSERT INTO interests (category_id, interest_name, interest_icon, display_order) VALUES
(3, 'Cooking', '👨‍🍳', 1),
(3, 'Baking', '🧁', 2),
(3, 'Wine Tasting', '🍷', 3),
(3, 'Coffee', '☕', 4),
(3, 'Restaurants', '🍽️', 5),
(3, 'Street Food', '🌮', 6),
(3, 'Vegetarian/Vegan', '🥗', 7),
(3, 'Barbecue', '🍖', 8),
(3, 'International Cuisine', '🍜', 9),
(3, 'Desserts', '🍰', 10);

-- Insert Interests for Travel & Adventure
INSERT INTO interests (category_id, interest_name, interest_icon, display_order) VALUES
(4, 'Beach Vacations', '🏖️', 1),
(4, 'Mountain Hiking', '⛰️', 2),
(4, 'City Exploration', '🏙️', 3),
(4, 'Backpacking', '🎒', 4),
(4, 'Road Trips', '🚗', 5),
(4, 'Camping', '⛺', 6),
(4, 'Scuba Diving', '🤿', 7),
(4, 'Skiing/Snowboarding', '⛷️', 8),
(4, 'Cultural Tourism', '🏛️', 9),
(4, 'Adventure Sports', '🪂', 10);

-- Insert Interests for Entertainment
INSERT INTO interests (category_id, interest_name, interest_icon, display_order) VALUES
(5, 'Movies', '🎬', 1),
(5, 'TV Series', '📺', 2),
(5, 'Anime/Manga', '🎌', 3),
(5, 'Comedy Shows', '😂', 4),
(5, 'Documentaries', '🎥', 5),
(5, 'Podcasts', '🎙️', 6),
(5, 'Concerts', '🎤', 7),
(5, 'Festivals', '🎪', 8),
(5, 'Karaoke', '🎤', 9),
(5, 'Board Games', '🎲', 10);

-- Insert Interests for Hobbies & Crafts
INSERT INTO interests (category_id, interest_name, interest_icon, display_order) VALUES
(6, 'DIY Projects', '🔨', 1),
(6, 'Gardening', '🌱', 2),
(6, 'Knitting/Sewing', '🧶', 3),
(6, 'Model Building', '🏗️', 4),
(6, 'Collecting', '💎', 5),
(6, 'Pottery', '🏺', 6),
(6, 'Woodworking', '🪵', 7),
(6, 'Origami', '📄', 8),
(6, 'Writing', '✍️', 9),
(6, 'Blogging', '📝', 10);

-- Insert Interests for Technology & Gaming
INSERT INTO interests (category_id, interest_name, interest_icon, display_order) VALUES
(7, 'Video Games', '🎮', 1),
(7, 'PC Gaming', '💻', 2),
(7, 'Mobile Gaming', '📱', 3),
(7, 'Programming', '👨‍💻', 4),
(7, 'Gadgets & Tech', '📱', 5),
(7, 'Virtual Reality', '🥽', 6),
(7, 'Streaming', '📡', 7),
(7, 'E-Sports', '🏆', 8),
(7, 'AI & Machine Learning', '🤖', 9),
(7, 'Cryptocurrency', '💰', 10);

-- Insert Interests for Nature & Outdoors
INSERT INTO interests (category_id, interest_name, interest_icon, display_order) VALUES
(8, 'Hiking', '🥾', 1),
(8, 'Wildlife', '🦁', 2),
(8, 'Bird Watching', '🦜', 3),
(8, 'Fishing', '🎣', 4),
(8, 'Stargazing', '🌟', 5),
(8, 'Environmental Conservation', '♻️', 6),
(8, 'Rock Climbing', '🧗', 7),
(8, 'Kayaking', '🛶', 8),
(8, 'Nature Photography', '📸', 9),
(8, 'Outdoor Sports', '⛺', 10);

-- Insert Interests for Learning & Culture
INSERT INTO interests (category_id, interest_name, interest_icon, display_order) VALUES
(9, 'Reading', '📖', 1),
(9, 'Learning Languages', '🗣️', 2),
(9, 'History', '🏛️', 3),
(9, 'Science', '🔬', 4),
(9, 'Philosophy', '🤔', 5),
(9, 'Museums', '🖼️', 6),
(9, 'Art Galleries', '🎨', 7),
(9, 'Astronomy', '🔭', 8),
(9, 'Poetry', '📜', 9),
(9, 'Online Courses', '💡', 10);

-- Insert Interests for Social & Community
INSERT INTO interests (category_id, interest_name, interest_icon, display_order) VALUES
(10, 'Volunteering', '🤝', 1),
(10, 'Networking Events', '👔', 2),
(10, 'Social Activism', '✊', 3),
(10, 'Meetups', '☕', 4),
(10, 'Public Speaking', '🎤', 5),
(10, 'Team Sports', '⚽', 6),
(10, 'Community Events', '🎉', 7),
(10, 'Book Clubs', '📚', 8),
(10, 'Dance Classes', '💃', 9),
(10, 'Fitness Groups', '🏋️', 10);
