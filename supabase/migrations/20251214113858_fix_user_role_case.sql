/*
  # Fix User Role Case Sensitivity Issue

  1. Problem
    - The handle_new_user() trigger function was using lowercase 'staff' 
    - But the user_role enum expects uppercase 'STAFF', 'MANAGER', 'OWNER'
    - This caused database constraint violations when new users sign up

  2. Changes
    - Update handle_new_user() function to use uppercase 'STAFF' as default
    - Ensure role value matches the enum definition

  3. Security
    - No changes to security policies
    - Function maintains SECURITY DEFINER to bypass RLS
*/

-- Update the function to use correct case for role enum
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'STAFF'::user_role),
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;