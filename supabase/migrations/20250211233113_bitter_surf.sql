-- Update all existing users to be active admins
UPDATE user_profiles 
SET role = 'admin'::user_role,
    status = 'active'::user_status;

-- Update the handle_new_user function to make all new users admins
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (id, role, status)
  VALUES (
    new.id,
    'admin'::user_role,
    'active'::user_status
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin'::user_role,
      status = 'active'::user_status;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;