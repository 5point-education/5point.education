-- This script removes the password_hash column from the users table
-- since we've migrated to Supabase authentication and no longer store passwords locally

-- Option 1: Drop the password_hash column entirely (recommended)
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- Option 2: If you prefer to keep it for backward compatibility, make it nullable
-- ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
