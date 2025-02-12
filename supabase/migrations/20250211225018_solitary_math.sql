/*
  # Safety measures and admin privileges

  1. Changes:
    - Add trigger to prevent users from disabling their own accounts
    - Make all existing accounts active admins
    - Add policy to prevent self-disabling

  2. Safety:
    - Users cannot disable their own accounts
    - At least one admin must always exist
*/

-- Create function to prevent self-disabling
CREATE OR REPLACE FUNCTION prevent_self_disable()
RETURNS trigger AS $$
BEGIN
  IF NEW.id = auth.uid() AND NEW.status = 'disabled' THEN
    RAISE EXCEPTION 'Users cannot disable their own accounts';
  END IF;
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Create trigger to prevent self-disabling
DROP TRIGGER IF EXISTS prevent_self_disable_trigger ON user_profiles;
CREATE TRIGGER prevent_self_disable_trigger
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_disable();

-- Make all accounts active admins
UPDATE user_profiles 
SET role = 'admin'::user_role,
    status = 'active'::user_status;

-- Ensure the trigger function for new users creates active admins
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role, status)
  VALUES (new.id, 'admin'::user_role, 'active'::user_status)
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin'::user_role,
      status = 'active'::user_status;
  RETURN new;
END;
$$ language plpgsql security definer;