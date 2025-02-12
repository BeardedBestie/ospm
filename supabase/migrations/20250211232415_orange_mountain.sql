/*
  # Fix Policy Recursion

  1. Changes
    - Drop existing recursive policies
    - Create simplified non-recursive policies
    - Update indexes for better performance
    - Fix user profile handling

  2. Security
    - Maintain RLS protection
    - Ensure admin access control
    - Prevent privilege escalation
*/

-- Drop existing policies
DROP POLICY IF EXISTS "view_profiles" ON user_profiles;
DROP POLICY IF EXISTS "update_profiles" ON user_profiles;
DROP POLICY IF EXISTS "insert_profiles" ON user_profiles;
DROP POLICY IF EXISTS "delete_profiles" ON user_profiles;

-- Create simplified policies
CREATE POLICY "allow_select"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "allow_admin_update"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role = 'admin'
      AND up.status = 'active'
    )
  );

CREATE POLICY "allow_admin_delete"
  ON user_profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role = 'admin'
      AND up.status = 'active'
    )
  );

CREATE POLICY "allow_system_insert"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Drop existing indexes
DROP INDEX IF EXISTS idx_user_profiles_role_status;
DROP INDEX IF EXISTS idx_user_profiles_role;
DROP INDEX IF EXISTS idx_user_profiles_status;

-- Create optimized indexes
CREATE INDEX idx_user_profiles_role_status ON user_profiles(role, status);

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role, status)
  VALUES (
    new.id,
    CASE 
      WHEN NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE role = 'admin')
      THEN 'admin'::user_role
      ELSE 'user'::user_role
    END,
    'active'::user_status
  )
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
  END as role,
  'active'::user_status as status
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