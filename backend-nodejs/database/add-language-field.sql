-- Add preferred_language field to users table for existing databases

ALTER TABLE users
ADD COLUMN preferred_language VARCHAR(5) DEFAULT 'en' AFTER password_hash;
