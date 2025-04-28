-- Delete all users except grantwalker107@gmail.com
DELETE FROM auth.users
WHERE email != 'grantwalker107@gmail.com';

-- Delete orphaned profiles
DELETE FROM user_profiles
WHERE id NOT IN (
  SELECT id FROM auth.users
);

-- Update grantwalker107@gmail.com to be admin
UPDATE user_profiles
SET role = 'admin',
    status = 'active'
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'grantwalker107@gmail.com'
);