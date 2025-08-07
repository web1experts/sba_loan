/*
  # Create application status tracking table

  1. New Tables
    - `application_status`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `status` (text, current application status)
      - `stage` (text, current stage in process)
      - `notes` (text, status notes)
      - `updated_by` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `application_status` table
    - Add policies for users to view their status
    - Add policy for admins to manage all statuses
*/

CREATE TABLE IF NOT EXISTS application_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'started' CHECK (status IN ('started', 'documents_pending', 'under_review', 'approved', 'funded', 'declined')),
  stage text DEFAULT 'application' CHECK (stage IN ('application', 'documentation', 'review', 'underwriting', 'closing', 'funded', 'complete')),
  notes text DEFAULT '',
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE application_status ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own application status
CREATE POLICY "Users can view own application status"
  ON application_status
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Admins can view all application statuses
CREATE POLICY "Admins can view all application statuses"
  ON application_status
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy: Admins can manage all application statuses
CREATE POLICY "Admins can manage application statuses"
  ON application_status
  FOR ALL
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

-- Function to automatically create application status for new borrowers
CREATE OR REPLACE FUNCTION create_application_status()
RETURNS trigger AS $$
BEGIN
  -- Only create status for borrowers
  IF NEW.raw_user_meta_data->>'role' = 'borrower' THEN
    INSERT INTO public.application_status (user_id, status, stage)
    VALUES (NEW.id, 'started', 'application');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create application status for new borrowers
DROP TRIGGER IF EXISTS on_borrower_created ON auth.users;
CREATE TRIGGER on_borrower_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_application_status();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS application_status_user_id_idx ON application_status(user_id);
CREATE INDEX IF NOT EXISTS application_status_status_idx ON application_status(status);
CREATE INDEX IF NOT EXISTS application_status_stage_idx ON application_status(stage);