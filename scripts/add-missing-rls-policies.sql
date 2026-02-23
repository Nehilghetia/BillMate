-- Add missing RLS policies for user signup and profile updates

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Create policies for user signup
CREATE POLICY "Users can create their own profile" ON users FOR INSERT
  WITH CHECK (auth_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON users FOR UPDATE
  USING (auth_id = auth.uid()) WITH CHECK (auth_id = auth.uid());
