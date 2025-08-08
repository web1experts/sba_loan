/*
  # Simple Application Submission System

  1. New Tables
    - `application_submissions` - Stores submitted applications
  2. Functions
    - Simple functions for submission and retrieval
  3. Security
    - RLS policies for proper access control
*/

-- Create application_submissions table
CREATE TABLE IF NOT EXISTS application_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  borrower_name text NOT NULL,
  borrower_email text NOT NULL,
  phone text DEFAULT '',
  company text DEFAULT '',
  document_folder text NOT NULL,
  document_count integer DEFAULT 0,
  document_categories text[] DEFAULT '{}',
  status text DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'declined')),
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE application_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert own submissions"
  ON application_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own submissions"
  ON application_submissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all submissions"
  ON application_submissions
  FOR ALL
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role'),
      ''
    ) = 'admin'
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_application_submissions_user_id ON application_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_application_submissions_status ON application_submissions(status);
CREATE INDEX IF NOT EXISTS idx_application_submissions_submitted_at ON application_submissions(submitted_at DESC);

-- Simple function to submit application
CREATE OR REPLACE FUNCTION submit_application(
  p_borrower_name text,
  p_borrower_email text,
  p_phone text DEFAULT '',
  p_company text DEFAULT '',
  p_document_folder text,
  p_document_count integer DEFAULT 0,
  p_document_categories text[] DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_submission_id uuid;
BEGIN
  -- Insert submission
  INSERT INTO application_submissions (
    user_id,
    borrower_name,
    borrower_email,
    phone,
    company,
    document_folder,
    document_count,
    document_categories,
    status,
    submitted_at
  ) VALUES (
    auth.uid(),
    p_borrower_name,
    p_borrower_email,
    p_phone,
    p_company,
    p_document_folder,
    p_document_count,
    p_document_categories,
    'submitted',
    now()
  )
  RETURNING id INTO v_submission_id;

  -- Update application_status table
  INSERT INTO application_status (
    user_id,
    status,
    stage,
    submitted_at,
    updated_at
  ) VALUES (
    auth.uid(),
    'documents_pending',
    'review',
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    status = 'documents_pending',
    stage = 'review',
    submitted_at = now(),
    updated_at = now();

  RETURN v_submission_id;
END;
$$;

-- Simple function to get submissions for admin
CREATE OR REPLACE FUNCTION get_admin_submissions()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  borrower_name text,
  borrower_email text,
  phone text,
  company text,
  document_folder text,
  document_count integer,
  document_categories text[],
  status text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') != 'admin' THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    s.borrower_name,
    s.borrower_email,
    s.phone,
    s.company,
    s.document_folder,
    s.document_count,
    s.document_categories,
    s.status,
    s.submitted_at,
    s.reviewed_at,
    s.notes
  FROM application_submissions s
  ORDER BY s.submitted_at DESC;
END;
$$;

-- Function to approve application
CREATE OR REPLACE FUNCTION approve_application(p_submission_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') != 'admin' THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Update submission status
  UPDATE application_submissions 
  SET 
    status = 'approved',
    reviewed_at = now(),
    reviewed_by = auth.uid(),
    updated_at = now()
  WHERE id = p_submission_id;

  -- Update application_status
  UPDATE application_status 
  SET 
    status = 'approved',
    stage = 'complete',
    updated_at = now(),
    updated_by = auth.uid()
  WHERE user_id = (
    SELECT user_id FROM application_submissions WHERE id = p_submission_id
  );

  RETURN true;
END;
$$;