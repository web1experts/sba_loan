/*
  # Create referral leads table for referral partner submissions

  1. New Tables
    - `referral_leads`
      - `id` (uuid, primary key)
      - `referral_user_id` (uuid, references auth.users)
      - `business_name` (text, business name)
      - `contact_name` (text, contact person)
      - `contact_email` (text, contact email)
      - `contact_phone` (text, contact phone)
      - `loan_amount` (text, requested loan amount)
      - `business_type` (text, type of business)
      - `notes` (text, additional notes)
      - `status` (text, lead status)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `referral_leads` table
    - Add policies for referral partners to manage their leads
    - Add policy for admins to view and manage all leads
*/

CREATE TABLE IF NOT EXISTS referral_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_name text NOT NULL,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text DEFAULT '',
  loan_amount text DEFAULT '',
  business_type text DEFAULT '',
  notes text DEFAULT '',
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'in_review', 'approved', 'funded', 'declined')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE referral_leads ENABLE ROW LEVEL SECURITY;

-- Policy: Referral partners can view and manage their own leads
CREATE POLICY "Referral partners can manage own leads"
  ON referral_leads
  FOR ALL
  TO authenticated
  USING (auth.uid() = referral_user_id)
  WITH CHECK (auth.uid() = referral_user_id);

-- Policy: Admins can view all leads
CREATE POLICY "Admins can view all leads"
  ON referral_leads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy: Admins can update lead status
CREATE POLICY "Admins can update leads"
  ON referral_leads
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS referral_leads_user_id_idx ON referral_leads(referral_user_id);
CREATE INDEX IF NOT EXISTS referral_leads_status_idx ON referral_leads(status);
CREATE INDEX IF NOT EXISTS referral_leads_created_at_idx ON referral_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS referral_leads_business_name_idx ON referral_leads(business_name);