/*
  # Fix User Profiles RLS Policies

  1. Security
    - Drop existing problematic policies that reference users table
    - Create new simplified policies using auth.uid() directly
    - Enable proper access for users to manage their own profiles
    - Add admin access policies

  2. Changes
    - Remove policies that cause "permission denied for table users" errors
    - Add policies for SELECT, INSERT, UPDATE operations
    - Use auth.uid() instead of complex joins
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON user_profiles;

-- Create new simplified policies using auth.uid()
CREATE POLICY "Allow authenticated users to read their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Allow authenticated users to create their own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Allow authenticated users to update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admin policy using JWT metadata (no table joins)
CREATE POLICY "Allow admins to view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Allow admins to update all profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );