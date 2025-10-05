-- Add geographic coordinates to cities table for distance calculations

ALTER TABLE cities
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add index for geographic queries
CREATE INDEX IF NOT EXISTS idx_coordinates ON cities(latitude, longitude);
