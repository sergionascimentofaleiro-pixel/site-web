-- Seed data for countries, states, and cities
-- Sample data for USA, France, Brazil, Spain, and Portugal

-- Countries
INSERT INTO countries (code, name_en, name_fr, name_es, name_pt, has_states) VALUES
('US', 'United States', 'États-Unis', 'Estados Unidos', 'Estados Unidos', TRUE),
('BR', 'Brazil', 'Brésil', 'Brasil', 'Brasil', TRUE),
('FR', 'France', 'France', 'Francia', 'França', FALSE),
('ES', 'Spain', 'Espagne', 'España', 'Espanha', FALSE),
('PT', 'Portugal', 'Portugal', 'Portugal', 'Portugal', FALSE),
('CA', 'Canada', 'Canada', 'Canadá', 'Canadá', TRUE),
('MX', 'Mexico', 'Mexique', 'México', 'México', TRUE),
('GB', 'United Kingdom', 'Royaume-Uni', 'Reino Unido', 'Reino Unido', FALSE),
('DE', 'Germany', 'Allemagne', 'Alemania', 'Alemanha', FALSE),
('IT', 'Italy', 'Italie', 'Italia', 'Itália', FALSE);

-- States for USA
INSERT INTO states (country_id, code, name) VALUES
((SELECT id FROM countries WHERE code = 'US'), 'CA', 'California'),
((SELECT id FROM countries WHERE code = 'US'), 'NY', 'New York'),
((SELECT id FROM countries WHERE code = 'US'), 'TX', 'Texas'),
((SELECT id FROM countries WHERE code = 'US'), 'FL', 'Florida'),
((SELECT id FROM countries WHERE code = 'US'), 'IL', 'Illinois'),
((SELECT id FROM countries WHERE code = 'US'), 'WA', 'Washington'),
((SELECT id FROM countries WHERE code = 'US'), 'MA', 'Massachusetts');

-- States for Brazil
INSERT INTO states (country_id, code, name) VALUES
((SELECT id FROM countries WHERE code = 'BR'), 'SP', 'São Paulo'),
((SELECT id FROM countries WHERE code = 'BR'), 'RJ', 'Rio de Janeiro'),
((SELECT id FROM countries WHERE code = 'BR'), 'MG', 'Minas Gerais'),
((SELECT id FROM countries WHERE code = 'BR'), 'BA', 'Bahia'),
((SELECT id FROM countries WHERE code = 'BR'), 'PR', 'Paraná'),
((SELECT id FROM countries WHERE code = 'BR'), 'RS', 'Rio Grande do Sul'),
((SELECT id FROM countries WHERE code = 'BR'), 'SC', 'Santa Catarina');

-- States for Canada
INSERT INTO states (country_id, code, name) VALUES
((SELECT id FROM countries WHERE code = 'CA'), 'ON', 'Ontario'),
((SELECT id FROM countries WHERE code = 'CA'), 'QC', 'Quebec'),
((SELECT id FROM countries WHERE code = 'CA'), 'BC', 'British Columbia'),
((SELECT id FROM countries WHERE code = 'CA'), 'AB', 'Alberta');

-- States for Mexico
INSERT INTO states (country_id, code, name) VALUES
((SELECT id FROM countries WHERE code = 'MX'), 'CDMX', 'Ciudad de México'),
((SELECT id FROM countries WHERE code = 'MX'), 'JAL', 'Jalisco'),
((SELECT id FROM countries WHERE code = 'MX'), 'NL', 'Nuevo León');

-- Cities for USA (California)
INSERT INTO cities (country_id, state_id, name) VALUES
((SELECT id FROM countries WHERE code = 'US'), (SELECT id FROM states WHERE code = 'CA' AND country_id = (SELECT id FROM countries WHERE code = 'US')), 'Los Angeles'),
((SELECT id FROM countries WHERE code = 'US'), (SELECT id FROM states WHERE code = 'CA' AND country_id = (SELECT id FROM countries WHERE code = 'US')), 'San Francisco'),
((SELECT id FROM countries WHERE code = 'US'), (SELECT id FROM states WHERE code = 'CA' AND country_id = (SELECT id FROM countries WHERE code = 'US')), 'San Diego'),
((SELECT id FROM countries WHERE code = 'US'), (SELECT id FROM states WHERE code = 'CA' AND country_id = (SELECT id FROM countries WHERE code = 'US')), 'San Jose');

-- Cities for USA (New York)
INSERT INTO cities (country_id, state_id, name) VALUES
((SELECT id FROM countries WHERE code = 'US'), (SELECT id FROM states WHERE code = 'NY' AND country_id = (SELECT id FROM countries WHERE code = 'US')), 'New York City'),
((SELECT id FROM countries WHERE code = 'US'), (SELECT id FROM states WHERE code = 'NY' AND country_id = (SELECT id FROM countries WHERE code = 'US')), 'Buffalo'),
((SELECT id FROM countries WHERE code = 'US'), (SELECT id FROM states WHERE code = 'NY' AND country_id = (SELECT id FROM countries WHERE code = 'US')), 'Rochester');

-- Cities for Brazil (São Paulo)
INSERT INTO cities (country_id, state_id, name) VALUES
((SELECT id FROM countries WHERE code = 'BR'), (SELECT id FROM states WHERE code = 'SP' AND country_id = (SELECT id FROM countries WHERE code = 'BR')), 'São Paulo'),
((SELECT id FROM countries WHERE code = 'BR'), (SELECT id FROM states WHERE code = 'SP' AND country_id = (SELECT id FROM countries WHERE code = 'BR')), 'Campinas'),
((SELECT id FROM countries WHERE code = 'BR'), (SELECT id FROM states WHERE code = 'SP' AND country_id = (SELECT id FROM countries WHERE code = 'BR')), 'Santos');

-- Cities for Brazil (Rio de Janeiro)
INSERT INTO cities (country_id, state_id, name) VALUES
((SELECT id FROM countries WHERE code = 'BR'), (SELECT id FROM states WHERE code = 'RJ' AND country_id = (SELECT id FROM countries WHERE code = 'BR')), 'Rio de Janeiro'),
((SELECT id FROM countries WHERE code = 'BR'), (SELECT id FROM states WHERE code = 'RJ' AND country_id = (SELECT id FROM countries WHERE code = 'BR')), 'Niterói');

-- Cities for France (no states)
INSERT INTO cities (country_id, state_id, name) VALUES
((SELECT id FROM countries WHERE code = 'FR'), NULL, 'Paris'),
((SELECT id FROM countries WHERE code = 'FR'), NULL, 'Marseille'),
((SELECT id FROM countries WHERE code = 'FR'), NULL, 'Lyon'),
((SELECT id FROM countries WHERE code = 'FR'), NULL, 'Toulouse'),
((SELECT id FROM countries WHERE code = 'FR'), NULL, 'Nice'),
((SELECT id FROM countries WHERE code = 'FR'), NULL, 'Nantes'),
((SELECT id FROM countries WHERE code = 'FR'), NULL, 'Bordeaux');

-- Cities for Spain (no states)
INSERT INTO cities (country_id, state_id, name) VALUES
((SELECT id FROM countries WHERE code = 'ES'), NULL, 'Madrid'),
((SELECT id FROM countries WHERE code = 'ES'), NULL, 'Barcelona'),
((SELECT id FROM countries WHERE code = 'ES'), NULL, 'Valencia'),
((SELECT id FROM countries WHERE code = 'ES'), NULL, 'Sevilla'),
((SELECT id FROM countries WHERE code = 'ES'), NULL, 'Bilbao');

-- Cities for Portugal (no states)
INSERT INTO cities (country_id, state_id, name) VALUES
((SELECT id FROM countries WHERE code = 'PT'), NULL, 'Lisboa'),
((SELECT id FROM countries WHERE code = 'PT'), NULL, 'Porto'),
((SELECT id FROM countries WHERE code = 'PT'), NULL, 'Braga'),
((SELECT id FROM countries WHERE code = 'PT'), NULL, 'Coimbra'),
((SELECT id FROM countries WHERE code = 'PT'), NULL, 'Faro');
