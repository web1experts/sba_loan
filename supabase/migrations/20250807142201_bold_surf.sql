/*
  # Fix Application Status RLS Policies

  1. Security Changes
    - Fix RLS policies for application_status table
    - Remove problematic references to auth.users table
    - Use auth.uid() and auth.jwt() for proper authentication checks

  2. Policy Updates
    - Update admin policies to use JWT metadata instead of users table join
    - Simplify user access policies to use auth.uid() directly
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can manage application statuses" ON application_status;
DROP POLICY IF EXISTS "Admins can view all application statuses" ON application_status;
DROP POLICY IF EXISTS "Users can view own application status" ON application_status;

-- Create new simplified policies that don't reference auth.users
CREATE POLICY "Users can view own application status"
  ON application_status
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all application statuses"
  ON application_status
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can manage application statuses"
  ON application_status
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );