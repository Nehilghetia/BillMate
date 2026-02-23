-- Create Demo Accounts for BillMate Testing

-- Delete demo accounts if they exist (to allow re-running the script)
DELETE FROM users WHERE email IN ('admin@billmate.com', 'customer@billmate.com');
DELETE FROM auth.users WHERE email IN ('admin@billmate.com', 'customer@billmate.com');

-- Admin Demo Account
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@billmate.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin User","role":"admin"}',
  false,
  'authenticated'
);

-- Customer Demo Account
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'customer@billmate.com',
  crypt('customer123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Customer User","role":"customer"}',
  false,
  'authenticated'
);

-- Add corresponding user profiles
INSERT INTO users (
  auth_id,
  email,
  full_name,
  user_type,
  created_at
)
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'role',
  NOW()
FROM auth.users
WHERE email IN ('admin@billmate.com', 'customer@billmate.com');
