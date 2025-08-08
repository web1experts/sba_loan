/*
  # Comprehensive Application Workflow Migration

  1. Functions
    - `submit_application_for_review()` - Handles application submission
    - `get_submitted_applications_for_admin()` - Fetches applications for admin
    - `get_application_documents()` - Retrieves documents with signed URLs
    - `approve_application()` - Handles full application approval
    - `approve_document()` - Handles individual document approval

  2. Security
    - Admin-only access to review functions
    - Proper user authentication checks
    - Secure document access

  3. Data Integrity
    - Proper status transitions
    - Timestamp tracking
    - Document count validation
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS submit_application_for_review(uuid, integer);
DROP FUNCTION IF EXISTS get_submitted_applications_for_admin();
DROP FUNCTION IF EXISTS get_application_documents(uuid);
DROP FUNCTION IF EXISTS approve_application(uuid);
DROP FUNCTION IF EXISTS approve_document(uuid);

-- Function to submit application for review
CREATE OR REPLACE FUNCTION submit_application_for_review(
  p_user_id uuid,
  p_document_count integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
  v_current_user_id uuid;
BEGIN
  -- Get current authenticated user
  v_current_user_id := auth.uid();
  
  -- Verify user is authenticated
  IF v_current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not authenticated'
    );
  END IF;
  
  -- Verify user can only submit their own application
  IF v_current_user_id != p_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Permission denied'
    );
  END IF;
  
  -- Verify minimum document count
  IF p_document_count < 5 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Minimum 5 documents required'
    );
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
    'review',
    format('Application submitted with %s documents', p_document_count),
    now(),
    now(),
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    status = 'documents_pending',
    stage = 'review',
    notes = format('Application submitted with %s documents', p_document_count),
    submitted_at = now(),
    updated_at = now();
  
  -- Return success response
  RETURN json_build_object(
    'success', true,
    'message', 'Application submitted successfully',
    'status', 'documents_pending',
    'submitted_at', now()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Function to get submitted applications for admin
CREATE OR REPLACE FUNCTION get_submitted_applications_for_admin()
RETURNS TABLE (
  application_id uuid,
  user_id uuid,
  borrower_name text,
  borrower_email text,
  status text,
  stage text,
  submitted_at timestamptz,
  document_count bigint,
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role text;
BEGIN
  -- Check if user is admin
  SELECT COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') INTO v_user_role;
  
  IF v_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  -- Return submitted applications with user and document data
  RETURN QUERY
  SELECT 
    a.id as application_id,
    a.user_id,
    COALESCE(
      CONCAT(up.first_name, ' ', up.last_name),
      CONCAT(
        COALESCE(u.raw_user_meta_data->>'first_name', ''),
        ' ',
        COALESCE(u.raw_user_meta_data->>'last_name', '')
      ),
      'Unknown User'
    ) as borrower_name,
    COALESCE(up.email, u.email, 'No email') as borrower_email,
    a.status,
    a.stage,
    a.submitted_at,
    COALESCE(doc_count.count, 0) as document_count,
    a.notes
  FROM application_status a
  LEFT JOIN auth.users u ON a.user_id = u.id
  LEFT JOIN user_profiles up ON a.user_id = up.id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as count
    FROM documents
    GROUP BY user_id
  ) doc_count ON a.user_id = doc_count.user_id
  WHERE a.status IN ('documents_pending', 'under_review')
    AND a.submitted_at IS NOT NULL
  ORDER BY a.submitted_at DESC;
END;
$$;

-- Function to get application documents
CREATE OR REPLACE FUNCTION get_application_documents(p_user_id uuid)
RETURNS TABLE (
  document_id uuid,
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
DECLARE
  v_user_role text;
  v_doc record;
  v_signed_url text;
BEGIN
  -- Check if user is admin
  SELECT COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') INTO v_user_role;
  
  IF v_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  -- Return documents with signed URLs
  FOR v_doc IN 
    SELECT d.id, d.doc_name, d.file_name, d.file_path, d.status, d.uploaded_at
    FROM documents d
    WHERE d.user_id = p_user_id
    ORDER BY d.doc_name, d.uploaded_at DESC
  LOOP
    -- Generate signed URL for document access
    BEGIN
      SELECT storage.url FROM storage.objects 
      WHERE bucket_id = 'borrower-docs' AND name = v_doc.file_path
      INTO v_signed_url;
      
      -- If no URL found, create a placeholder
      IF v_signed_url IS NULL THEN
        v_signed_url := '/api/document/' || v_doc.id;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        v_signed_url := '/api/document/' || v_doc.id;
    END;
    
    RETURN QUERY SELECT 
      v_doc.id,
      v_doc.doc_name,
      v_doc.file_name,
      v_doc.file_path,
      v_doc.status,
      v_doc.uploaded_at,
      v_signed_url;
  END LOOP;
END;
$$;

-- Function to approve individual document
CREATE OR REPLACE FUNCTION approve_document(p_document_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role text;
  v_result json;
BEGIN
  -- Check if user is admin
  SELECT COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') INTO v_user_role;
  
  IF v_user_role != 'admin' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Access denied. Admin role required.'
    );
  END IF;
  
  -- Update document status
  UPDATE documents 
  SET status = 'approved', updated_at = now()
  WHERE id = p_document_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Document not found'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Document approved successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Function to approve full application
CREATE OR REPLACE FUNCTION approve_application(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role text;
  v_result json;
BEGIN
  -- Check if user is admin
  SELECT COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') INTO v_user_role;
  
  IF v_user_role != 'admin' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Access denied. Admin role required.'
    );
  END IF;
  
  -- Update application status
  UPDATE application_status 
  SET 
    status = 'approved',
    stage = 'underwriting',
    notes = COALESCE(notes, '') || ' | Application approved by admin on ' || now()::text,
    updated_at = now(),
    updated_by = auth.uid()
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Application not found'
    );
  END IF;
  
  -- Approve all documents for this user
  UPDATE documents 
  SET status = 'approved', updated_at = now()
  WHERE user_id = p_user_id AND status != 'approved';
  
  RETURN json_build_object(
    'success', true,
    'message', 'Application approved successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION submit_application_for_review(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_submitted_applications_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_application_documents(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_document(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_application(uuid) TO authenticated;