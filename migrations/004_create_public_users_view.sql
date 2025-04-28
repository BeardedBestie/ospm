-- 004_create_public_users_view.sql
-- Recreate the public.users view so Supabase client can fetch user info
CREATE OR REPLACE VIEW public.users AS
  SELECT
    id,
    email,
    raw_user_meta_data
  FROM auth.users;

GRANT SELECT ON public.users TO authenticated;
