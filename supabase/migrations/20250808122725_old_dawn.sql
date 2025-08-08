/*
  # Application Submission System

  1. Tables
    - Ensure application_status table exists with proper structure
    - Add application_submissions table for tracking submissions
  
  2. Functions
    - submit_borrower_application: Handle complete application submission
    - get_admin_applications: Fetch applications for admin panel
    - get_application_documents_with_urls: Get documents with signed URLs
  
  3. Security
    - RLS policies for proper access control
    - Admin-only access to review functions
*/

-- Ensure application_status table has all required fields
DO $$
BEGIN
  -- Add submitted_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'application_status' AND column_name = 'submitted_at'
  ) THEN
    ALTER TABLE application_status ADD COLUMN submitted_at timestamptz;
  END IF;
  
  -- Add folder_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'application_status' AND column_name = 'folder_name'
  ) THEN
    ALTER TABLE application_status ADD COLUMN folder_name text;
  END IF;
END $$;

-- Create application_submissions table for detailed tracking
CREATE TABLE IF NOT EXISTS application_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_status_id uuid REFERENCES application_status(id),
  submission_data jsonb DEFAULT '{}',
  document_count integer DEFAULT 0,
  folder_name text NOT NULL,
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE application_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for application_submissions
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_application_submissions_user_id 
  ON application_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_application_submissions_submitted_at 
  ON application_submissions(submitted_at DESC);

-- Function to submit borrower application
CREATE OR REPLACE FUNCTION submit_borrower_application(
  p_user_id uuid,
  p_document_count integer,
  p_folder_name text,
  p_submission_data jsonb DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_profile user_profiles%ROWTYPE;
  v_application_status_id uuid;
  v_submission_id uuid;
  v_result jsonb;
BEGIN
  -- Verify user exists and get profile
  SELECT * INTO v_user_profile
  FROM user_profiles
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found for user_id: %', p_user_id;
  END IF;
  
  -- Create or update application_status
  INSERT INTO application_status (
    user_id,
    status,
    stage,
    submitted_at,
    folder_name,
    notes,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    'submitted',
    'review',
    now(),
    p_folder_name,
    format('Application submitted with %s documents', p_document_count),
    now(),
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    status = 'submitted',
    stage = 'review',
    submitted_at = now(),
    folder_name = p_folder_name,
    notes = format('Application resubmitted with %s documents', p_document_count),
    updated_at = now()
  RETURNING id INTO v_application_status_id;
  
  -- Create submission record
  INSERT INTO application_submissions (
    user_id,
    application_status_id,
    submission_data,
    document_count,
    folder_name,
    submitted_at
  )
  VALUES (
    p_user_id,
    v_application_status_id,
    p_submission_data,
    p_document_count,
    p_folder_name,
    now()
  )
  RETURNING id INTO v_submission_id;
  
  -- Return success result
  v_result := jsonb_build_object(
    'success', true,
    'submission_id', v_submission_id,
    'application_status_id', v_application_status_id,
    'message', 'Application submitted successfully'
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to submit application: %', SQLERRM;
END;
$$;

-- Function to get applications for admin panel
CREATE OR REPLACE FUNCTION get_admin_applications()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  borrower_name text,
  email text,
  status text,
  stage text,
  submitted_at timestamptz,
  document_count integer,
  folder_name text,
  notes text,
  created_at timestamptz,
  updated_at timestamptz
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
    a.id,
    a.user_id,
    COALESCE(
      CONCAT(up.first_name, ' ', up.last_name),
      CONCAT(
        COALESCE((au.raw_user_meta_data ->> 'first_name'), ''),
        ' ',
        COALESCE((au.raw_user_meta_data ->> 'last_name'), '')
      ),
      'Unknown User'
    ) as borrower_name,
    COALESCE(up.email, au.email, 'No email') as email,
    a.status,
    a.stage,
    a.submitted_at,
    COALESCE(
      (SELECT COUNT(*)::integer FROM documents d WHERE d.user_id = a.user_id),
      0
    ) as document_count,
    a.folder_name,
    a.notes,
    a.created_at,
    a.updated_at
  FROM application_status a
  LEFT JOIN user_profiles up ON a.user_id = up.id
  LEFT JOIN auth.users au ON a.user_id = au.id
  WHERE a.status IN ('submitted', 'under_review', 'documents_pending')
    AND a.submitted_at IS NOT NULL
  ORDER BY a.submitted_at DESC;
END;
$$;

-- Function to get application documents with signed URLs
CREATE OR REPLACE FUNCTION get_application_documents_with_urls(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  doc_name text,
  file_name text,
  file_path text,
  status text,
  uploaded_at timestamptz,
  signed_url text
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
    d.id,
    d.doc_name,
    d.file_name,
    d.file_path,
    d.status,
    d.uploaded_at,
    -- Generate signed URL for document access
    CASE 
      WHEN d.file_path IS NOT NULL THEN
        (SELECT url FROM storage.objects WHERE bucket_id = 'borrower-docs' AND name = d.file_path LIMIT 1)
      ELSE NULL
    END as signed_url
  FROM documents d
  WHERE d.user_id = p_user_id
  ORDER BY d.uploaded_at DESC;
END;
$$;

-- Function to approve application
CREATE OR REPLACE FUNCTION approve_application(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') != 'admin' THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  -- Update application status
  UPDATE application_status
  SET 
    status = 'approved',
    stage = 'approved',
    updated_at = now(),
    notes = COALESCE(notes, '') || ' | Application approved by admin on ' || now()::text
  WHERE user_id = p_user_id;
  
  -- Update all documents to approved
  UPDATE documents
  SET 
    status = 'approved',
    updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Application approved successfully'
  );
END;
$$;

-- Function to approve individual document
CREATE OR REPLACE FUNCTION approve_document(p_document_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') != 'admin' THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  -- Update document status
  UPDATE documents
  SET 
    status = 'approved',
    updated_at = now()
  WHERE id = p_document_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Document approved successfully'
  );
END;
$$;