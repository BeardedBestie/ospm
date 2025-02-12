/*
  # Update all users to admin status
  
  1. Changes
    - Updates all existing user profiles to admin role and active status
*/

-- Update all existing user profiles to admin
UPDATE user_profiles 
SET role = 'admin'::user_role,
    status = 'active'::user_status;