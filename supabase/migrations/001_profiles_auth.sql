-- 001_profiles_auth.sql
-- User profiles and auth triggers

CREATE TYPE user_role AS ENUM ('admin','user','viewer');
CREATE TYPE user_status AS ENUM ('pending','active','disabled');

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'viewer',
  status user_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, role, status)
  VALUES (
    NEW.id,
    CASE WHEN NOT EXISTS (SELECT 1 FROM user_profiles WHERE role = 'admin') THEN 'admin' ELSE 'user' END,
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
