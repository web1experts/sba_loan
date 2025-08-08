/*
  # Fix Application Workflow - Step 1: Basic Functions

  1. Functions
    - Create submit_application_for_review function
    - Create get_submitted_applications_for_admin function
    - Create approve_application function
    - Create approve_document function

  2. Security
    - All functions use security definer
    - Proper admin role checks
    - Safe error handling
*/

-- Function to submit application for review
CREATE OR REPLACE FUNCTION submit_application_for_review(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Insert or update application status
  INSERT INTO application_status (
    user_id,
    status,
    stage,
    submitted_at,
    updated_at
  ) VALUES (
    p_user_id,
    'documents_pending',
    'review',
    now(),
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    status = 'documents_pending',
    stage = 'review',
    submitted_at = COALESCE(application_status.submitted_at, now()),
    updated_at = now();

  -- Return success
  SELECT json_build_object(
    'success', true,
    'message', 'Application submitted successfully',
    'user_id', p_user_id,
    'status', 'documents_pending'
  ) INTO result;

  RETURN result;
END;
$$;

-- Function to get submitted applications for admin
CREATE OR REPLACE FUNCTION get_submitted_applications_for_admin()
RETURNS TABLE (
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  company text,
  phone text,
  status text,
  stage text,
  submitted_at timestamptz,
  updated_at timestamptz,
  document_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (auth.users.raw_user_meta_data->>'role' = 'admin')
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT 
    a.user_id,
    COALESCE(up.email, u.email) as email,
    COALESCE(up.first_name, u.raw_user_meta_data->>'first_name', '') as first_name,
    COALESCE(up.last_name, u.raw_user_meta_data->>'last_name', '') as last_name,
    COALESCE(up.company, '') as company,
    COALESCE(up.phone, '') as phone,
    a.status,
    a.stage,
    a.submitted_at,
    a.updated_at,
    COALESCE(doc_counts.doc_count, 0) as document_count
  FROM application_status a
  LEFT JOIN auth.users u ON u.id = a.user_id
  LEFT JOIN user_profiles up ON up.id = a.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as doc_count
    FROM documents
    GROUP BY user_id
  ) doc_counts ON doc_counts.user_id = a.user_id
  WHERE a.status IN ('documents_pending', 'under_review', 'approved')
  ORDER BY a.submitted_at DESC NULLS LAST, a.updated_at DESC;
END;
$$;

-- Function to approve application
CREATE OR REPLACE FUNCTION approve_application(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (auth.users.raw_user_meta_data->>'role' = 'admin')
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Update application status
  UPDATE application_status 
  SET 
    status = 'approved',
    stage = 'approved',
    updated_at = now(),
    updated_by = auth.uid()
  WHERE user_id = p_user_id;

  -- Approve all documents for this user
  UPDATE documents 
  SET 
    status = 'approved',
    updated_at = now()
  WHERE user_id = p_user_id;

  SELECT json_build_object(
    'success', true,
    'message', 'Application approved successfully',
    'user_id', p_user_id
  ) INTO result;

  RETURN result;
END;
$$;

-- Function to approve individual document
CREATE OR REPLACE FUNCTION approve_document(p_document_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (auth.users.raw_user_meta_data->>'role' = 'admin')
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Update document status
  UPDATE documents 
  SET 
    status = 'approved',
    updated_at = now()
  WHERE id = p_document_id;

  SELECT json_build_object(
    'success', true,
    'message', 'Document approved successfully',
    'document_id', p_document_id
  ) INTO result;

  RETURN result;
END;
$$;