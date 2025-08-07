/*
  # Fix RLS Policies for Referral Leads

  1. Security Changes
    - Drop existing problematic policies that reference users table
    - Create new policies using only auth.uid() and auth.jwt()
    - Ensure referral partners can manage their own leads
    - Allow admins to view and manage all leads

  2. Policy Updates
    - Use auth.uid() instead of direct users table queries
    - Use auth.jwt() for role-based access control
    - Avoid any direct references to users table in policies
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admin users can update all leads" ON referral_leads;
DROP POLICY IF EXISTS "Admin users can view all leads" ON referral_leads;
DROP POLICY IF EXISTS "Admins can update leads" ON referral_leads;
DROP POLICY IF EXISTS "Admins can view all leads" ON referral_leads;
DROP POLICY IF EXISTS "Referral partners can manage own leads" ON referral_leads;
DROP POLICY IF EXISTS "Referral users can insert own leads" ON referral_leads;
DROP POLICY IF EXISTS "Referral users can update own leads" ON referral_leads;
DROP POLICY IF EXISTS "Referral users can view own leads" ON referral_leads;

-- Create new policies using only auth functions
CREATE POLICY "Referral users can view own leads"
  ON referral_leads
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referral_user_id);

CREATE POLICY "Referral users can insert own leads"
  ON referral_leads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = referral_user_id);

CREATE POLICY "Referral users can update own leads"
  ON referral_leads
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = referral_user_id)
  WITH CHECK (auth.uid() = referral_user_id);

CREATE POLICY "Referral users can delete own leads"
  ON referral_leads
  FOR DELETE
  TO authenticated
  USING (auth.uid() = referral_user_id);

-- Admin policies using JWT metadata
CREATE POLICY "Admins can view all leads"
  ON referral_leads
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can update all leads"
  ON referral_leads
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can insert leads"
  ON referral_leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can delete leads"
  ON referral_leads
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );