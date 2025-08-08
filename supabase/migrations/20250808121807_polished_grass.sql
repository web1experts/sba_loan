/*
  # Fix Complete Application Submission and Admin Panel Workflow

  1. Database Functions
    - `submit_application_for_review` - Handles complete application submission
    - `get_submitted_applications_for_admin` - Fetches all submitted applications with documents
    - `approve_application` - Handles application approval workflow
    - `get_application_documents` - Fetches documents for specific application

  2. Security
    - Proper RLS policies for application workflow
    - Admin-only access to review functions
    - Secure document access

  3. Data Structure
    - Clear submission tracking
    - Document linking
    - Status management
*/

-- Create function to handle complete application submission
CREATE OR REPLACE FUNCTION submit_application_for_review(
  p_user_id uuid,
  p_document_count integer DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
  v_application_id uuid;
BEGIN
  -- Verify user is authenticated
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Insert or update application status
  INSERT INTO application_status (
    user_id,
    status,
    stage,
    notes,
    submitted_at,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    'documents_pending',
    'documentation',
    format('Application submitted with %s documents', p_document_count),
    now(),
    now(),
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    status = 'documents_pending',
    stage = 'documentation',
    notes = format('Application resubmitted with %s documents', p_document_count),
    submitted_at = now(),
    updated_at = now()
  RETURNING id INTO v_application_id;

  -- Return success result
  SELECT json_build_object(
    'success', true,
    'application_id', v_application_id,
    'status', 'documents_pending',
    'message', 'Application submitted successfully'
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Create function to get submitted applications for admin
CREATE OR REPLACE FUNCTION get_submitted_applications_for_admin()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  status text,
  stage text,
  notes text,
  submitted_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  user_first_name text,
  user_last_name text,
  user_email text,
  user_phone text,
  user_company text,
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
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    a.id,
    a.user_id,
    a.status,
    a.stage,
    a.notes,
    a.submitted_at,
    a.created_at,
    a.updated_at,
    COALESCE(up.first_name, au.raw_user_meta_data->>'first_name', 'Unknown') as user_first_name,
    COALESCE(up.last_name, au.raw_user_meta_data->>'last_name', 'User') as user_last_name,
    COALESCE(up.email, au.email, 'No email') as user_email,
    COALESCE(up.phone, au.raw_user_meta_data->>'phone', '') as user_phone,
    COALESCE(up.company, au.raw_user_meta_data->>'company', '') as user_company,
    COALESCE(doc_count.count, 0) as document_count
  FROM application_status a
  LEFT JOIN user_profiles up ON a.user_id = up.id
  LEFT JOIN auth.users au ON a.user_id = au.id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as count
    FROM documents
    GROUP BY user_id
  ) doc_count ON a.user_id = doc_count.user_id
  WHERE a.submitted_at IS NOT NULL
    AND a.status IN ('documents_pending', 'under_review', 'approved')
  ORDER BY a.submitted_at DESC;
END;
$$;

-- Create function to get application documents
CREATE OR REPLACE FUNCTION get_application_documents(p_user_id uuid)
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
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (auth.users.raw_user_meta_data->>'role' = 'admin')
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    d.id,
    d.doc_name,
    d.file_name,
    d.file_path,
    d.status,
    d.uploaded_at,
    '' as signed_url -- We'll generate this in the frontend
  FROM documents d
  WHERE d.user_id = p_user_id
  ORDER BY d.doc_name, d.uploaded_at DESC;
END;
$$;

-- Create function to approve application
CREATE OR REPLACE FUNCTION approve_application(
  p_application_id uuid,
  p_admin_notes text DEFAULT ''
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
  v_user_id uuid;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (auth.users.raw_user_meta_data->>'role' = 'admin')
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Update application status
  UPDATE application_status 
  SET 
    status = 'approved',
    stage = 'approved',
    notes = COALESCE(notes, '') || E'\n' || 'Approved by admin: ' || COALESCE(p_admin_notes, ''),
    updated_at = now(),
    updated_by = auth.uid()
  WHERE id = p_application_id
  RETURNING user_id INTO v_user_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  -- Return success result
  SELECT json_build_object(
    'success', true,
    'application_id', p_application_id,
    'user_id', v_user_id,
    'status', 'approved',
    'message', 'Application approved successfully'
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Create function to approve individual document
CREATE OR REPLACE FUNCTION approve_document(
  p_document_id uuid,
  p_admin_notes text DEFAULT ''
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (auth.users.raw_user_meta_data->>'role' = 'admin')
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Update document status
  UPDATE documents 
  SET 
    status = 'approved',
    updated_at = now()
  WHERE id = p_document_id;

  -- Return success result
  SELECT json_build_object(
    'success', true,
    'document_id', p_document_id,
    'status', 'approved',
    'message', 'Document approved successfully'
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Update RLS policies to ensure proper access
DROP POLICY IF EXISTS "Admins can view all applications" ON application_status;
CREATE POLICY "Admins can view all applications"
  ON application_status
  FOR SELECT
  TO authenticated
  USING (
    COALESCE(((jwt() -> 'user_metadata'::text) ->> 'role'::text), ''::text) = 'admin'::text
    OR uid() = user_id
  );

-- Ensure documents can be viewed by admins
DROP POLICY IF EXISTS "Admins can view all documents" ON documents;
CREATE POLICY "Admins can view all documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    COALESCE(((jwt() -> 'user_metadata'::text) ->> 'role'::text), ''::text) = 'admin'::text
    OR uid() = user_id
  );

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION submit_application_for_review(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_submitted_applications_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_application_documents(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_application(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_document(uuid, text) TO authenticated;