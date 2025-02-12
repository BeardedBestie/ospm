/*
  # Fix User Profile Policies with Materialized Views

  1. Changes
    - Create materialized view for admin status
    - Create simplified policies using materialized view
    - Add refresh trigger for materialized view

  2. Security
    - Maintain admin access control
    - Prevent privilege escalation
    - Ensure data access control
*/

-- Create materialized view for admin status
CREATE MATERIALIZED VIEW admin_users AS
SELECT id
FROM user_profiles
WHERE role = 'admin' AND status = 'active';

-- Create index on materialized view
CREATE UNIQUE INDEX admin_users_id ON admin_users(id);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_admin_users()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY admin_users;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to refresh materialized view
CREATE TRIGGER refresh_admin_users_trigger
AFTER INSERT OR UPDATE OR DELETE ON user_profiles
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_admin_users();

-- Drop existing policies
DROP POLICY IF EXISTS "read_all_profiles" ON user_profiles;
DROP POLICY IF EXISTS "admin_write_access" ON user_profiles;

-- Create new policies using materialized view
CREATE POLICY "allow_read_profiles"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "allow_admin_write"
  ON user_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Initial refresh of materialized view
REFRESH MATERIALIZED VIEW admin_users;