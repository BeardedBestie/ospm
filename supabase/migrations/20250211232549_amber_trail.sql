/*
  # Fix User Profile Policies

  1. Changes
    - Drop existing policies
    - Create simple, non-recursive policies
    - Add function to check admin status safely
    - Update indexes for better performance

  2. Security
    - Maintain admin access control
    - Prevent privilege escalation
    - Ensure data access control
*/

-- Drop existing policies and views
DROP POLICY IF EXISTS "allow_read_profiles" ON user_profiles;
DROP POLICY IF EXISTS "allow_admin_write" ON user_profiles;
DROP MATERIALIZED VIEW IF EXISTS admin_users;
DROP TRIGGER IF EXISTS refresh_admin_users_trigger ON user_profiles;
DROP FUNCTION IF EXISTS refresh_admin_users();

-- Create a simple policy for reading profiles
CREATE POLICY "read_profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

-- Create a policy for admin write access using a subquery
CREATE POLICY "admin_write"
  ON user_profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role = 'admin'
      AND up.status = 'active'
      LIMIT 1
    )
  );

-- Create function to safely check admin status
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE id = user_id
    AND role = 'admin'
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (id, role, status)
  VALUES (
    new.id,
    CASE 
      WHEN NOT EXISTS (SELECT 1 FROM user_profiles WHERE role = 'admin')
      THEN 'admin'::user_role
      ELSE 'user'::user_role
    END,
    'active'::user_status
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure indexes exist
DROP INDEX IF EXISTS idx_user_profiles_role_status;
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_status ON user_profiles(role, status);

-- Ensure all users have profiles
INSERT INTO user_profiles (id, role, status)
SELECT 
  users.id,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM user_profiles WHERE role = 'admin')
    THEN 'admin'::user_role
    ELSE 'user'::user_role
  END,
  'active'::user_status
FROM auth.users
LEFT JOIN user_profiles ON user_profiles.id = users.id
WHERE user_profiles.id IS NULL;

-- Ensure at least one admin exists
UPDATE user_profiles
SET role = 'admin',
    status = 'active'
WHERE id IN (
  SELECT id
  FROM user_profiles
  ORDER BY created_at ASC
  LIMIT 1
)
AND NOT EXISTS (
  SELECT 1
  FROM user_profiles
  WHERE role = 'admin'
  AND status = 'active'
);