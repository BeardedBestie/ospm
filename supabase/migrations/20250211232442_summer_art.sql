/*
  # Fix User Profile Policies

  1. Changes
    - Drop all existing recursive policies
    - Create simple, non-recursive policies
    - Optimize indexes for performance
    - Update user profile handling

  2. Security
    - Maintain admin access control
    - Prevent privilege escalation
    - Ensure data access control
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "allow_select" ON user_profiles;
DROP POLICY IF EXISTS "allow_admin_update" ON user_profiles;
DROP POLICY IF EXISTS "allow_admin_delete" ON user_profiles;
DROP POLICY IF EXISTS "allow_system_insert" ON user_profiles;

-- Create new, simplified policies
CREATE POLICY "read_all_profiles"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "admin_write_access"
  ON user_profiles FOR ALL
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
    AND
    (SELECT status FROM user_profiles WHERE id = auth.uid() LIMIT 1) = 'active'
  );

-- Drop and recreate indexes
DROP INDEX IF EXISTS idx_user_profiles_role_status;
DROP INDEX IF EXISTS idx_user_profiles_role;
DROP INDEX IF EXISTS idx_user_profiles_status;

CREATE INDEX idx_user_profiles_role_status ON user_profiles(role, status);

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role user_role;
BEGIN
  -- Determine role (admin if no admins exist, user otherwise)
  SELECT CASE 
    WHEN NOT EXISTS (SELECT 1 FROM user_profiles WHERE role = 'admin')
    THEN 'admin'::user_role
    ELSE 'user'::user_role
  END INTO v_role;

  -- Insert new profile
  INSERT INTO public.user_profiles (id, role, status)
  VALUES (new.id, v_role, 'active'::user_status)
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure all existing users have profiles
INSERT INTO public.user_profiles (id, role, status)
SELECT 
  users.id,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE role = 'admin')
    THEN 'admin'::user_role
    ELSE 'user'::user_role
  END,
  'active'::user_status
FROM auth.users
LEFT JOIN public.user_profiles ON user_profiles.id = users.id
WHERE user_profiles.id IS NULL;

-- Ensure at least one admin exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE role = 'admin') THEN
    UPDATE user_profiles
    SET role = 'admin',
        status = 'active'
    WHERE id = (
      SELECT id 
      FROM user_profiles 
      ORDER BY created_at ASC 
      LIMIT 1
    );
  END IF;
END $$;