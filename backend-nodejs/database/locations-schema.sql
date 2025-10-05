-- Locations schema: Countries, States, and Cities
-- Support for location selection with cascading dropdowns

CREATE TABLE IF NOT EXISTS countries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(2) UNIQUE NOT NULL,  -- ISO 3166-1 alpha-2 code (US, FR, BR, etc.)
  name_en VARCHAR(100) NOT NULL,
  name_fr VARCHAR(100),
  name_es VARCHAR(100),
  name_pt VARCHAR(100),
  has_states BOOLEAN DEFAULT FALSE,  -- TRUE for countries like USA, Brazil
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS states (
  id INT PRIMARY KEY AUTO_INCREMENT,
  country_id INT NOT NULL,
  code VARCHAR(10) NOT NULL,  -- State code (CA, TX, SP, etc.)
  name VARCHAR(100) NOT NULL,
  FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE,
  UNIQUE KEY unique_state (country_id, code),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  country_id INT NOT NULL,
  state_id INT,  -- NULL for countries without states
  name VARCHAR(200) NOT NULL,
  latitude DECIMAL(10, 8),  -- Geographic coordinates
  longitude DECIMAL(11, 8),
  FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE,
  FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_country (country_id),
  INDEX idx_state (state_id),
  INDEX idx_coordinates (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
