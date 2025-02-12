-- Drop and recreate the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Check if a profile already exists
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles WHERE id = new.id
  ) THEN
    -- Insert new profile with admin role if no other admins exist
    INSERT INTO public.user_profiles (id, role, status)
    VALUES (
      new.id,
      CASE 
        WHEN NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE role = 'admin')
        THEN 'admin'::user_role
        ELSE 'user'::user_role
      END,
      'active'::user_status
    );
  END IF;
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error (Supabase will capture this in the logs)
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    -- Still return new to allow user creation even if profile creation fails
    RETURN new;
END;
$$ language plpgsql security definer;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

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