-- Add foreign key constraints for location fields in profiles table
-- This must be run AFTER creating the location tables

ALTER TABLE profiles
  ADD CONSTRAINT fk_profile_country FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_profile_state FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_profile_city FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL;
