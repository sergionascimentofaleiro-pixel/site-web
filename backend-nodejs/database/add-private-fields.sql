-- Add private fields to profiles table
-- These fields are only visible to the profile owner

ALTER TABLE profiles
ADD COLUMN last_name VARCHAR(100) AFTER first_name,
ADD COLUMN phone VARCHAR(20) AFTER last_name;

-- Note: email is already stored in users table
