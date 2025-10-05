-- Seed data for interest translations
-- Supports: English (en), French (fr), Spanish (es), Portuguese (pt)

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ========================================
-- INTEREST CATEGORY TRANSLATIONS
-- ========================================

-- Category 1: Sports & Fitness
INSERT INTO interest_category_translations (category_id, language_code, translated_name) VALUES
(1, 'en', 'Sports & Fitness'),
(1, 'fr', 'Sports & Fitness'),
(1, 'es', 'Deportes & Fitness'),
(1, 'pt', 'Esportes & Fitness');

-- Category 2: Music & Arts
INSERT INTO interest_category_translations (category_id, language_code, translated_name) VALUES
(2, 'en', 'Music & Arts'),
(2, 'fr', 'Musique & Arts'),
(2, 'es', 'Música & Artes'),
(2, 'pt', 'Música & Artes');

-- Category 3: Food & Dining
INSERT INTO interest_category_translations (category_id, language_code, translated_name) VALUES
(3, 'en', 'Food & Dining'),
(3, 'fr', 'Cuisine & Gastronomie'),
(3, 'es', 'Comida & Restaurantes'),
(3, 'pt', 'Comida & Gastronomia');

-- Category 4: Travel & Adventure
INSERT INTO interest_category_translations (category_id, language_code, translated_name) VALUES
(4, 'en', 'Travel & Adventure'),
(4, 'fr', 'Voyage & Aventure'),
(4, 'es', 'Viajes & Aventura'),
(4, 'pt', 'Viagens & Aventura');

-- Category 5: Entertainment
INSERT INTO interest_category_translations (category_id, language_code, translated_name) VALUES
(5, 'en', 'Entertainment'),
(5, 'fr', 'Divertissement'),
(5, 'es', 'Entretenimiento'),
(5, 'pt', 'Entretenimento');

-- Category 6: Hobbies & Crafts
INSERT INTO interest_category_translations (category_id, language_code, translated_name) VALUES
(6, 'en', 'Hobbies & Crafts'),
(6, 'fr', 'Loisirs & Artisanat'),
(6, 'es', 'Pasatiempos & Manualidades'),
(6, 'pt', 'Hobbies & Artesanato');

-- Category 7: Technology & Gaming
INSERT INTO interest_category_translations (category_id, language_code, translated_name) VALUES
(7, 'en', 'Technology & Gaming'),
(7, 'fr', 'Technologie & Jeux vidéo'),
(7, 'es', 'Tecnología & Videojuegos'),
(7, 'pt', 'Tecnologia & Jogos');

-- Category 8: Nature & Outdoors
INSERT INTO interest_category_translations (category_id, language_code, translated_name) VALUES
(8, 'en', 'Nature & Outdoors'),
(8, 'fr', 'Nature & Plein air'),
(8, 'es', 'Naturaleza & Aire libre'),
(8, 'pt', 'Natureza & Ar livre');

-- Category 9: Learning & Culture
INSERT INTO interest_category_translations (category_id, language_code, translated_name) VALUES
(9, 'en', 'Learning & Culture'),
(9, 'fr', 'Apprentissage & Culture'),
(9, 'es', 'Aprendizaje & Cultura'),
(9, 'pt', 'Aprendizado & Cultura');

-- Category 10: Social & Community
INSERT INTO interest_category_translations (category_id, language_code, translated_name) VALUES
(10, 'en', 'Social & Community'),
(10, 'fr', 'Social & Communauté'),
(10, 'es', 'Social & Comunidad'),
(10, 'pt', 'Social & Comunidade');

-- ========================================
-- INTEREST TRANSLATIONS - Sports & Fitness
-- ========================================

INSERT INTO interest_translations (interest_id, language_code, translated_name) VALUES
-- Football/Soccer
(1, 'en', 'Football/Soccer'),
(1, 'fr', 'Football'),
(1, 'es', 'Fútbol'),
(1, 'pt', 'Futebol'),

-- Basketball
(2, 'en', 'Basketball'),
(2, 'fr', 'Basketball'),
(2, 'es', 'Baloncesto'),
(2, 'pt', 'Basquete'),

-- Tennis
(3, 'en', 'Tennis'),
(3, 'fr', 'Tennis'),
(3, 'es', 'Tenis'),
(3, 'pt', 'Tênis'),

-- Swimming
(4, 'en', 'Swimming'),
(4, 'fr', 'Natation'),
(4, 'es', 'Natación'),
(4, 'pt', 'Natação'),

-- Yoga
(5, 'en', 'Yoga'),
(5, 'fr', 'Yoga'),
(5, 'es', 'Yoga'),
(5, 'pt', 'Yoga'),

-- Gym/Fitness
(6, 'en', 'Gym/Fitness'),
(6, 'fr', 'Salle de sport/Fitness'),
(6, 'es', 'Gimnasio/Fitness'),
(6, 'pt', 'Academia/Fitness'),

-- Running
(7, 'en', 'Running'),
(7, 'fr', 'Course à pied'),
(7, 'es', 'Correr'),
(7, 'pt', 'Corrida'),

-- Cycling
(8, 'en', 'Cycling'),
(8, 'fr', 'Cyclisme'),
(8, 'es', 'Ciclismo'),
(8, 'pt', 'Ciclismo'),

-- Martial Arts
(9, 'en', 'Martial Arts'),
(9, 'fr', 'Arts martiaux'),
(9, 'es', 'Artes marciales'),
(9, 'pt', 'Artes marciais'),

-- Dancing
(10, 'en', 'Dancing'),
(10, 'fr', 'Danse'),
(10, 'es', 'Baile'),
(10, 'pt', 'Dança');

-- ========================================
-- INTEREST TRANSLATIONS - Music & Arts
-- ========================================

INSERT INTO interest_translations (interest_id, language_code, translated_name) VALUES
-- Live Music
(11, 'en', 'Live Music'),
(11, 'fr', 'Concerts'),
(11, 'es', 'Música en vivo'),
(11, 'pt', 'Música ao vivo'),

-- Playing Instruments
(12, 'en', 'Playing Instruments'),
(12, 'fr', 'Jouer d\'instruments'),
(12, 'es', 'Tocar instrumentos'),
(12, 'pt', 'Tocar instrumentos'),

-- Singing
(13, 'en', 'Singing'),
(13, 'fr', 'Chant'),
(13, 'es', 'Canto'),
(13, 'pt', 'Canto'),

-- Painting
(14, 'en', 'Painting'),
(14, 'fr', 'Peinture'),
(14, 'es', 'Pintura'),
(14, 'pt', 'Pintura'),

-- Photography
(15, 'en', 'Photography'),
(15, 'fr', 'Photographie'),
(15, 'es', 'Fotografía'),
(15, 'pt', 'Fotografia'),

-- Drawing
(16, 'en', 'Drawing'),
(16, 'fr', 'Dessin'),
(16, 'es', 'Dibujo'),
(16, 'pt', 'Desenho'),

-- Theatre
(17, 'en', 'Theatre'),
(17, 'fr', 'Théâtre'),
(17, 'es', 'Teatro'),
(17, 'pt', 'Teatro'),

-- Classical Music
(18, 'en', 'Classical Music'),
(18, 'fr', 'Musique classique'),
(18, 'es', 'Música clásica'),
(18, 'pt', 'Música clássica'),

-- Electronic Music
(19, 'en', 'Electronic Music'),
(19, 'fr', 'Musique électronique'),
(19, 'es', 'Música electrónica'),
(19, 'pt', 'Música eletrônica'),

-- Rock/Pop Music
(20, 'en', 'Rock/Pop Music'),
(20, 'fr', 'Musique Rock/Pop'),
(20, 'es', 'Música Rock/Pop'),
(20, 'pt', 'Música Rock/Pop');

-- ========================================
-- INTEREST TRANSLATIONS - Food & Dining
-- ========================================

INSERT INTO interest_translations (interest_id, language_code, translated_name) VALUES
-- Cooking
(21, 'en', 'Cooking'),
(21, 'fr', 'Cuisine'),
(21, 'es', 'Cocinar'),
(21, 'pt', 'Cozinhar'),

-- Baking
(22, 'en', 'Baking'),
(22, 'fr', 'Pâtisserie'),
(22, 'es', 'Repostería'),
(22, 'pt', 'Confeitaria'),

-- Wine Tasting
(23, 'en', 'Wine Tasting'),
(23, 'fr', 'Dégustation de vin'),
(23, 'es', 'Cata de vinos'),
(23, 'pt', 'Degustação de vinhos'),

-- Coffee
(24, 'en', 'Coffee'),
(24, 'fr', 'Café'),
(24, 'es', 'Café'),
(24, 'pt', 'Café'),

-- Restaurants
(25, 'en', 'Restaurants'),
(25, 'fr', 'Restaurants'),
(25, 'es', 'Restaurantes'),
(25, 'pt', 'Restaurantes'),

-- Street Food
(26, 'en', 'Street Food'),
(26, 'fr', 'Cuisine de rue'),
(26, 'es', 'Comida callejera'),
(26, 'pt', 'Comida de rua'),

-- Vegetarian/Vegan
(27, 'en', 'Vegetarian/Vegan'),
(27, 'fr', 'Végétarien/Végan'),
(27, 'es', 'Vegetariano/Vegano'),
(27, 'pt', 'Vegetariano/Vegano'),

-- Barbecue
(28, 'en', 'Barbecue'),
(28, 'fr', 'Barbecue'),
(28, 'es', 'Asado'),
(28, 'pt', 'Churrasco'),

-- International Cuisine
(29, 'en', 'International Cuisine'),
(29, 'fr', 'Cuisine internationale'),
(29, 'es', 'Cocina internacional'),
(29, 'pt', 'Culinária internacional'),

-- Desserts
(30, 'en', 'Desserts'),
(30, 'fr', 'Desserts'),
(30, 'es', 'Postres'),
(30, 'pt', 'Sobremesas');

-- ========================================
-- INTEREST TRANSLATIONS - Travel & Adventure
-- ========================================

INSERT INTO interest_translations (interest_id, language_code, translated_name) VALUES
-- Beach Vacations
(31, 'en', 'Beach Vacations'),
(31, 'fr', 'Vacances à la plage'),
(31, 'es', 'Vacaciones en la playa'),
(31, 'pt', 'Férias na praia'),

-- Mountain Hiking
(32, 'en', 'Mountain Hiking'),
(32, 'fr', 'Randonnée en montagne'),
(32, 'es', 'Senderismo de montaña'),
(32, 'pt', 'Caminhadas na montanha'),

-- City Exploration
(33, 'en', 'City Exploration'),
(33, 'fr', 'Exploration urbaine'),
(33, 'es', 'Exploración de ciudades'),
(33, 'pt', 'Exploração de cidades'),

-- Backpacking
(34, 'en', 'Backpacking'),
(34, 'fr', 'Randonnée avec sac à dos'),
(34, 'es', 'Mochilero'),
(34, 'pt', 'Mochilão'),

-- Road Trips
(35, 'en', 'Road Trips'),
(35, 'fr', 'Road trips'),
(35, 'es', 'Viajes por carretera'),
(35, 'pt', 'Viagens de carro'),

-- Camping
(36, 'en', 'Camping'),
(36, 'fr', 'Camping'),
(36, 'es', 'Acampar'),
(36, 'pt', 'Acampar'),

-- Scuba Diving
(37, 'en', 'Scuba Diving'),
(37, 'fr', 'Plongée sous-marine'),
(37, 'es', 'Buceo'),
(37, 'pt', 'Mergulho'),

-- Skiing/Snowboarding
(38, 'en', 'Skiing/Snowboarding'),
(38, 'fr', 'Ski/Snowboard'),
(38, 'es', 'Esquí/Snowboard'),
(38, 'pt', 'Esqui/Snowboard'),

-- Cultural Tourism
(39, 'en', 'Cultural Tourism'),
(39, 'fr', 'Tourisme culturel'),
(39, 'es', 'Turismo cultural'),
(39, 'pt', 'Turismo cultural'),

-- Adventure Sports
(40, 'en', 'Adventure Sports'),
(40, 'fr', 'Sports d\'aventure'),
(40, 'es', 'Deportes de aventura'),
(40, 'pt', 'Esportes de aventura');

-- ========================================
-- INTEREST TRANSLATIONS - Entertainment
-- ========================================

INSERT INTO interest_translations (interest_id, language_code, translated_name) VALUES
-- Movies
(41, 'en', 'Movies'),
(41, 'fr', 'Films'),
(41, 'es', 'Películas'),
(41, 'pt', 'Filmes'),

-- TV Series
(42, 'en', 'TV Series'),
(42, 'fr', 'Séries TV'),
(42, 'es', 'Series de TV'),
(42, 'pt', 'Séries de TV'),

-- Anime/Manga
(43, 'en', 'Anime/Manga'),
(43, 'fr', 'Anime/Manga'),
(43, 'es', 'Anime/Manga'),
(43, 'pt', 'Anime/Mangá'),

-- Comedy Shows
(44, 'en', 'Comedy Shows'),
(44, 'fr', 'Spectacles humoristiques'),
(44, 'es', 'Shows de comedia'),
(44, 'pt', 'Shows de comédia'),

-- Documentaries
(45, 'en', 'Documentaries'),
(45, 'fr', 'Documentaires'),
(45, 'es', 'Documentales'),
(45, 'pt', 'Documentários'),

-- Podcasts
(46, 'en', 'Podcasts'),
(46, 'fr', 'Podcasts'),
(46, 'es', 'Podcasts'),
(46, 'pt', 'Podcasts'),

-- Concerts
(47, 'en', 'Concerts'),
(47, 'fr', 'Concerts'),
(47, 'es', 'Conciertos'),
(47, 'pt', 'Concertos'),

-- Festivals
(48, 'en', 'Festivals'),
(48, 'fr', 'Festivals'),
(48, 'es', 'Festivales'),
(48, 'pt', 'Festivais'),

-- Karaoke
(49, 'en', 'Karaoke'),
(49, 'fr', 'Karaoké'),
(49, 'es', 'Karaoke'),
(49, 'pt', 'Karaokê'),

-- Board Games
(50, 'en', 'Board Games'),
(50, 'fr', 'Jeux de société'),
(50, 'es', 'Juegos de mesa'),
(50, 'pt', 'Jogos de tabuleiro');

-- ========================================
-- INTEREST TRANSLATIONS - Hobbies & Crafts
-- ========================================

INSERT INTO interest_translations (interest_id, language_code, translated_name) VALUES
-- DIY Projects
(51, 'en', 'DIY Projects'),
(51, 'fr', 'Projets DIY'),
(51, 'es', 'Proyectos DIY'),
(51, 'pt', 'Projetos DIY'),

-- Gardening
(52, 'en', 'Gardening'),
(52, 'fr', 'Jardinage'),
(52, 'es', 'Jardinería'),
(52, 'pt', 'Jardinagem'),

-- Knitting/Sewing
(53, 'en', 'Knitting/Sewing'),
(53, 'fr', 'Tricot/Couture'),
(53, 'es', 'Tejer/Coser'),
(53, 'pt', 'Tricô/Costura'),

-- Model Building
(54, 'en', 'Model Building'),
(54, 'fr', 'Modélisme'),
(54, 'es', 'Modelismo'),
(54, 'pt', 'Modelismo'),

-- Collecting
(55, 'en', 'Collecting'),
(55, 'fr', 'Collection'),
(55, 'es', 'Coleccionismo'),
(55, 'pt', 'Colecionismo'),

-- Pottery
(56, 'en', 'Pottery'),
(56, 'fr', 'Poterie'),
(56, 'es', 'Cerámica'),
(56, 'pt', 'Cerâmica'),

-- Woodworking
(57, 'en', 'Woodworking'),
(57, 'fr', 'Travail du bois'),
(57, 'es', 'Carpintería'),
(57, 'pt', 'Marcenaria'),

-- Origami
(58, 'en', 'Origami'),
(58, 'fr', 'Origami'),
(58, 'es', 'Origami'),
(58, 'pt', 'Origami'),

-- Writing
(59, 'en', 'Writing'),
(59, 'fr', 'Écriture'),
(59, 'es', 'Escritura'),
(59, 'pt', 'Escrita'),

-- Blogging
(60, 'en', 'Blogging'),
(60, 'fr', 'Blogging'),
(60, 'es', 'Blogging'),
(60, 'pt', 'Blogging');

-- ========================================
-- INTEREST TRANSLATIONS - Technology & Gaming
-- ========================================

INSERT INTO interest_translations (interest_id, language_code, translated_name) VALUES
-- Video Games
(61, 'en', 'Video Games'),
(61, 'fr', 'Jeux vidéo'),
(61, 'es', 'Videojuegos'),
(61, 'pt', 'Videogames'),

-- PC Gaming
(62, 'en', 'PC Gaming'),
(62, 'fr', 'Jeux PC'),
(62, 'es', 'Juegos de PC'),
(62, 'pt', 'Jogos de PC'),

-- Mobile Gaming
(63, 'en', 'Mobile Gaming'),
(63, 'fr', 'Jeux mobiles'),
(63, 'es', 'Juegos móviles'),
(63, 'pt', 'Jogos mobile'),

-- Programming
(64, 'en', 'Programming'),
(64, 'fr', 'Programmation'),
(64, 'es', 'Programación'),
(64, 'pt', 'Programação'),

-- Gadgets & Tech
(65, 'en', 'Gadgets & Tech'),
(65, 'fr', 'Gadgets & Technologie'),
(65, 'es', 'Gadgets & Tecnología'),
(65, 'pt', 'Gadgets & Tecnologia'),

-- Virtual Reality
(66, 'en', 'Virtual Reality'),
(66, 'fr', 'Réalité virtuelle'),
(66, 'es', 'Realidad virtual'),
(66, 'pt', 'Realidade virtual'),

-- Streaming
(67, 'en', 'Streaming'),
(67, 'fr', 'Streaming'),
(67, 'es', 'Streaming'),
(67, 'pt', 'Streaming'),

-- E-Sports
(68, 'en', 'E-Sports'),
(68, 'fr', 'E-Sports'),
(68, 'es', 'E-Sports'),
(68, 'pt', 'E-Sports'),

-- AI & Machine Learning
(69, 'en', 'AI & Machine Learning'),
(69, 'fr', 'IA & Apprentissage automatique'),
(69, 'es', 'IA & Aprendizaje automático'),
(69, 'pt', 'IA & Aprendizado de máquina'),

-- Cryptocurrency
(70, 'en', 'Cryptocurrency'),
(70, 'fr', 'Cryptomonnaies'),
(70, 'es', 'Criptomonedas'),
(70, 'pt', 'Criptomoedas');

-- ========================================
-- INTEREST TRANSLATIONS - Nature & Outdoors
-- ========================================

INSERT INTO interest_translations (interest_id, language_code, translated_name) VALUES
-- Hiking
(71, 'en', 'Hiking'),
(71, 'fr', 'Randonnée'),
(71, 'es', 'Senderismo'),
(71, 'pt', 'Caminhadas'),

-- Wildlife
(72, 'en', 'Wildlife'),
(72, 'fr', 'Faune sauvage'),
(72, 'es', 'Vida silvestre'),
(72, 'pt', 'Vida selvagem'),

-- Bird Watching
(73, 'en', 'Bird Watching'),
(73, 'fr', 'Observation d\'oiseaux'),
(73, 'es', 'Observación de aves'),
(73, 'pt', 'Observação de aves'),

-- Fishing
(74, 'en', 'Fishing'),
(74, 'fr', 'Pêche'),
(74, 'es', 'Pesca'),
(74, 'pt', 'Pesca'),

-- Stargazing
(75, 'en', 'Stargazing'),
(75, 'fr', 'Observation des étoiles'),
(75, 'es', 'Observación de estrellas'),
(75, 'pt', 'Observação de estrelas'),

-- Environmental Conservation
(76, 'en', 'Environmental Conservation'),
(76, 'fr', 'Conservation de l\'environnement'),
(76, 'es', 'Conservación ambiental'),
(76, 'pt', 'Conservação ambiental'),

-- Rock Climbing
(77, 'en', 'Rock Climbing'),
(77, 'fr', 'Escalade'),
(77, 'es', 'Escalada en roca'),
(77, 'pt', 'Escalada'),

-- Kayaking
(78, 'en', 'Kayaking'),
(78, 'fr', 'Kayak'),
(78, 'es', 'Kayak'),
(78, 'pt', 'Caiaque'),

-- Nature Photography
(79, 'en', 'Nature Photography'),
(79, 'fr', 'Photographie de nature'),
(79, 'es', 'Fotografía de naturaleza'),
(79, 'pt', 'Fotografia de natureza'),

-- Outdoor Sports
(80, 'en', 'Outdoor Sports'),
(80, 'fr', 'Sports de plein air'),
(80, 'es', 'Deportes al aire libre'),
(80, 'pt', 'Esportes ao ar livre');

-- ========================================
-- INTEREST TRANSLATIONS - Learning & Culture
-- ========================================

INSERT INTO interest_translations (interest_id, language_code, translated_name) VALUES
-- Reading
(81, 'en', 'Reading'),
(81, 'fr', 'Lecture'),
(81, 'es', 'Lectura'),
(81, 'pt', 'Leitura'),

-- Learning Languages
(82, 'en', 'Learning Languages'),
(82, 'fr', 'Apprentissage des langues'),
(82, 'es', 'Aprender idiomas'),
(82, 'pt', 'Aprender idiomas'),

-- History
(83, 'en', 'History'),
(83, 'fr', 'Histoire'),
(83, 'es', 'Historia'),
(83, 'pt', 'História'),

-- Science
(84, 'en', 'Science'),
(84, 'fr', 'Science'),
(84, 'es', 'Ciencia'),
(84, 'pt', 'Ciência'),

-- Philosophy
(85, 'en', 'Philosophy'),
(85, 'fr', 'Philosophie'),
(85, 'es', 'Filosofía'),
(85, 'pt', 'Filosofia'),

-- Museums
(86, 'en', 'Museums'),
(86, 'fr', 'Musées'),
(86, 'es', 'Museos'),
(86, 'pt', 'Museus'),

-- Art Galleries
(87, 'en', 'Art Galleries'),
(87, 'fr', 'Galeries d\'art'),
(87, 'es', 'Galerías de arte'),
(87, 'pt', 'Galerias de arte'),

-- Astronomy
(88, 'en', 'Astronomy'),
(88, 'fr', 'Astronomie'),
(88, 'es', 'Astronomía'),
(88, 'pt', 'Astronomia'),

-- Poetry
(89, 'en', 'Poetry'),
(89, 'fr', 'Poésie'),
(89, 'es', 'Poesía'),
(89, 'pt', 'Poesia'),

-- Online Courses
(90, 'en', 'Online Courses'),
(90, 'fr', 'Cours en ligne'),
(90, 'es', 'Cursos en línea'),
(90, 'pt', 'Cursos online');

-- ========================================
-- INTEREST TRANSLATIONS - Social & Community
-- ========================================

INSERT INTO interest_translations (interest_id, language_code, translated_name) VALUES
-- Volunteering
(91, 'en', 'Volunteering'),
(91, 'fr', 'Bénévolat'),
(91, 'es', 'Voluntariado'),
(91, 'pt', 'Voluntariado'),

-- Networking Events
(92, 'en', 'Networking Events'),
(92, 'fr', 'Événements de réseautage'),
(92, 'es', 'Eventos de networking'),
(92, 'pt', 'Eventos de networking'),

-- Social Activism
(93, 'en', 'Social Activism'),
(93, 'fr', 'Activisme social'),
(93, 'es', 'Activismo social'),
(93, 'pt', 'Ativismo social'),

-- Meetups
(94, 'en', 'Meetups'),
(94, 'fr', 'Rencontres'),
(94, 'es', 'Encuentros'),
(94, 'pt', 'Encontros'),

-- Public Speaking
(95, 'en', 'Public Speaking'),
(95, 'fr', 'Prise de parole en public'),
(95, 'es', 'Oratoria'),
(95, 'pt', 'Falar em público'),

-- Team Sports
(96, 'en', 'Team Sports'),
(96, 'fr', 'Sports d\'équipe'),
(96, 'es', 'Deportes de equipo'),
(96, 'pt', 'Esportes em equipe'),

-- Community Events
(97, 'en', 'Community Events'),
(97, 'fr', 'Événements communautaires'),
(97, 'es', 'Eventos comunitarios'),
(97, 'pt', 'Eventos comunitários'),

-- Book Clubs
(98, 'en', 'Book Clubs'),
(98, 'fr', 'Clubs de lecture'),
(98, 'es', 'Clubes de lectura'),
(98, 'pt', 'Clubes de leitura'),

-- Dance Classes
(99, 'en', 'Dance Classes'),
(99, 'fr', 'Cours de danse'),
(99, 'es', 'Clases de baile'),
(99, 'pt', 'Aulas de dança'),

-- Fitness Groups
(100, 'en', 'Fitness Groups'),
(100, 'fr', 'Groupes de fitness'),
(100, 'es', 'Grupos de fitness'),
(100, 'pt', 'Grupos de fitness');
