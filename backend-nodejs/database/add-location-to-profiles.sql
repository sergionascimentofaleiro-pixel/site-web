-- Add location fields to profiles table

ALTER TABLE profiles
  ADD COLUMN country_id INT,
  ADD COLUMN state_id INT,
  ADD COLUMN city_id INT NOT NULL,
  ADD CONSTRAINT fk_profile_country FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_profile_state FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_profile_city FOREIGN KEY (city_id) REFERENCES cities(id);

CREATE INDEX idx_profile_country ON profiles(country_id);
CREATE INDEX idx_profile_city ON profiles(city_id);
