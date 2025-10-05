-- Interest Translations Tables
-- This adds i18n support for interest categories and interests

CREATE TABLE IF NOT EXISTS interest_category_translations (
  category_id INT NOT NULL,
  language_code VARCHAR(5) NOT NULL,
  translated_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (category_id, language_code),
  FOREIGN KEY (category_id) REFERENCES interest_categories(category_id) ON DELETE CASCADE,
  INDEX idx_language (language_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS interest_translations (
  interest_id INT NOT NULL,
  language_code VARCHAR(5) NOT NULL,
  translated_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (interest_id, language_code),
  FOREIGN KEY (interest_id) REFERENCES interests(interest_id) ON DELETE CASCADE,
  INDEX idx_language (language_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
