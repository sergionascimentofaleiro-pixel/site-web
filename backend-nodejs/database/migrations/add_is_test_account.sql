-- Migration: Add is_test_account field to users table
-- This allows differentiating test/seed accounts from real user signups
-- This field is for internal use only and should never be exposed to the frontend

USE dating_app;

-- Add the is_test_account column if it doesn't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_test_account BOOLEAN DEFAULT FALSE
COMMENT 'Internal flag to differentiate test/seed accounts from real users';

-- Add index for better query performance
ALTER TABLE users
ADD INDEX IF NOT EXISTS idx_test_account (is_test_account);

-- Mark existing accounts created before this migration as regular users (not test accounts)
-- Only newly seeded accounts will be marked as test accounts
UPDATE users SET is_test_account = FALSE WHERE is_test_account IS NULL;

SELECT 'Migration completed: is_test_account field added to users table' AS status;
