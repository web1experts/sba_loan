/*
  # Fix Admin Applications View

  1. Database Functions
    - Create function to get applications with user profiles for admin
    - Ensure proper permissions and data access
    - Handle user profile relationships correctly

  2. Security
    - Admin-only access to application data
    - Proper RLS policies for admin viewing
    - Safe data retrieval functions

  3. Performance
    - Optimized queries for admin dashboard
    - Proper indexing for fast retrieval
*/

-- Create function to get applications for admin with proper user data
CREATE OR REPLACE FUNCTION get_applications_for_admin()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  status text,
  stage text,
  notes text,
  submitted_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  user_email text,
  user_first_name text,
  user_last_name text,
  user_phone text,
  user_company text,
  document_count bigint
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if user is admin
  IF NOT (COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin') THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
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
    COALESCE(up.email, au.email) as user_email,
    COALESCE(up.first_name, au.raw_user_meta_data ->> 'first_name', '') as user_first_name,
    COALESCE(up.last_name, au.raw_user_meta_data ->> 'last_name', '') as user_last_name,
    COALESCE(up.phone, au.raw_user_meta_data ->> 'phone', '') as user_phone,
    COALESCE(up.company, au.raw_user_meta_data ->> 'company', '') as user_company,
    COALESCE(doc_count.count, 0) as document_count
  FROM application_status a
  LEFT JOIN user_profiles up ON a.user_id = up.id
  LEFT JOIN auth.users au ON a.user_id = au.id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as count
    FROM documents
    GROUP BY user_id
  ) doc_count ON a.user_id = doc_count.user_id
  WHERE a.status IN ('documents_pending', 'under_review', 'approved')
  ORDER BY a.created_at DESC;
END;
$$;

-- Create function to get borrowers for admin
CREATE OR REPLACE FUNCTION get_borrowers_for_admin()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  status text,
  stage text,
  notes text,
  submitted_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  user_email text,
  user_first_name text,
  user_last_name text,
  user_phone text,
  user_company text,
  document_count bigint
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if user is admin
  IF NOT (COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin') THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
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
    COALESCE(up.email, au.email) as user_email,
    COALESCE(up.first_name, au.raw_user_meta_data ->> 'first_name', '') as user_first_name,
    COALESCE(up.last_name, au.raw_user_meta_data ->> 'last_name', '') as user_last_name,
    COALESCE(up.phone, au.raw_user_meta_data ->> 'phone', '') as user_phone,
    COALESCE(up.company, au.raw_user_meta_data ->> 'company', '') as user_company,
    COALESCE(doc_count.count, 0) as document_count
  FROM application_status a
  LEFT JOIN user_profiles up ON a.user_id = up.id
  LEFT JOIN auth.users au ON a.user_id = au.id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as count
    FROM documents
    GROUP BY user_id
  ) doc_count ON a.user_id = doc_count.user_id
  WHERE a.status = 'approved'
  ORDER BY a.updated_at DESC;
END;
$$;

-- Grant execute permissions to authenticated users (admin check is inside function)
GRANT EXECUTE ON FUNCTION get_applications_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_borrowers_for_admin() TO authenticated;

-- Ensure proper RLS policies for application_status table
DROP POLICY IF EXISTS "Admins can view all applications" ON application_status;
CREATE POLICY "Admins can view all applications" ON application_status
  FOR SELECT TO authenticated
  USING (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

-- Ensure documents table has proper admin access
DROP POLICY IF EXISTS "Admins can view all documents" ON documents;
CREATE POLICY "Admins can view all documents" ON documents
  FOR SELECT TO authenticated
  USING (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_application_status_admin_view 
ON application_status (status, created_at DESC) 
WHERE status IN ('documents_pending', 'under_review', 'approved');

CREATE INDEX IF NOT EXISTS idx_documents_user_count 
ON documents (user_id);