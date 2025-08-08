/*
  # Application Submission Function

  1. Functions
    - `submit_application_for_review()` - Handles application submission
    - Updates application status to submitted
    - Records submission timestamp
    - Returns success confirmation

  2. Security
    - Function requires authentication
    - Only allows users to submit their own applications
*/

-- Function to handle application submission
CREATE OR REPLACE FUNCTION submit_application_for_review(
  p_user_id UUID,
  p_document_count INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  app_record RECORD;
BEGIN
  -- Verify the user is authenticated and matches the requesting user
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Permission denied: can only submit own application';
  END IF;

  -- Update or insert application status
  INSERT INTO application_status (
    user_id,
    status,
    stage,
    submitted_at,
    updated_at,
    notes
  ) VALUES (
    p_user_id,
    'documents_pending',
    'review',
    NOW(),
    NOW(),
    'Application submitted with ' || p_document_count || ' documents'
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    status = 'documents_pending',
    stage = 'review',
    submitted_at = NOW(),
    updated_at = NOW(),
    notes = 'Application submitted with ' || p_document_count || ' documents';

  -- Get the updated record
  SELECT * INTO app_record
  FROM application_status
  WHERE user_id = p_user_id;

  -- Return success result
  result := json_build_object(
    'success', true,
    'message', 'Application submitted successfully',
    'application_id', app_record.id,
    'status', app_record.status,
    'submitted_at', app_record.submitted_at
  );

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION submit_application_for_review(UUID, INTEGER) TO authenticated;