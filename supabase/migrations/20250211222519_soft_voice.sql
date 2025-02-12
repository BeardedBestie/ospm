/*
  # Fix existing users

  1. Changes
    - Add user profiles for any existing users that don't have one
    - Set first user as admin
    - Set all existing users as active
*/

-- Create profiles for any existing users that don't have one
INSERT INTO user_profiles (id, role, status)
SELECT 
  users.id,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM user_profiles WHERE role = 'admin')
    THEN 'admin'::user_role
    ELSE 'user'::user_role
  END as role,
  'active'::user_status as status
FROM auth.users
LEFT JOIN user_profiles ON user_profiles.id = users.id
WHERE user_profiles.id IS NULL;

-- Ensure we have at least one admin
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE role = 'admin') THEN
    UPDATE user_profiles
    SET role = 'admin'
    WHERE id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1);
  END IF;
END $$;