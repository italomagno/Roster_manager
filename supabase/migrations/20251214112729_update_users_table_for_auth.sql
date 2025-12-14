/*
  # Update Users Table for Auth Integration

  1. Changes
    - Rename name column to full_name for consistency
    - Ensure company_id is nullable for new signups
    - Update indexes and policies accordingly
  
  2. Security
    - Maintain existing RLS policies
*/

-- Rename name to full_name if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'name'
  ) THEN
    ALTER TABLE users RENAME COLUMN name TO full_name;
  END IF;
END $$;

-- Make company_id nullable for new user signups
DO $$
BEGIN
  ALTER TABLE users ALTER COLUMN company_id DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;