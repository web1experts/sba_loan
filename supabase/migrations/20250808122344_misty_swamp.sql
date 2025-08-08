/*
  # Fix Application Workflow - Step 2: Document Functions

  1. Functions
    - Create get_application_documents function
    - Create get_approved_borrowers function

  2. Security
    - Admin-only access
    - Proper error handling
*/

-- Function to get documents for an application
CREATE OR REPLACE FUNCTION get_application_documents(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  doc_name text,
  file_name text,
  file_path text,
  status text,
  uploaded_at timestamptz,
  updated_at timestamptz
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
    d.id,
    d.doc_name,
    d.file_name,
    d.file_path,
    d.status,
    d.uploaded_at,
    d.updated_at
  FROM documents d
  WHERE d.user_id = p_user_id
  ORDER BY d.doc_name, d.uploaded_at DESC;
END;
$$;

-- Function to get approved borrowers
CREATE OR REPLACE FUNCTION get_approved_borrowers()
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
  WHERE a.status = 'approved'
  ORDER BY a.updated_at DESC;
END;
$$;