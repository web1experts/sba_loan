-- Create simple application system
-- This migration creates a basic application submission system

-- First, ensure we have the submitted_at column in application_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'application_status' AND column_name = 'submitted_at'
  ) THEN
    ALTER TABLE application_status ADD COLUMN submitted_at timestamptz;
  END IF;
END $$;

-- Create a simple function to submit applications
CREATE OR REPLACE FUNCTION submit_borrower_application(
  p_user_id uuid,
  p_borrower_name text,
  p_borrower_email text,
  p_phone text DEFAULT '',
  p_company text DEFAULT '',
  p_document_folder text DEFAULT '',
  p_document_count integer DEFAULT 0
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  -- Update or insert application status with submission timestamp
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
    format('Application submitted by %s (%s). Documents: %s files in folder: %s', 
           p_borrower_name, p_borrower_email, p_document_count, p_document_folder),
    now(),
    now(),
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    status = 'documents_pending',
    stage = 'documentation',
    notes = format('Application submitted by %s (%s). Documents: %s files in folder: %s', 
                   p_borrower_name, p_borrower_email, p_document_count, p_document_folder),
    submitted_at = now(),
    updated_at = now();

  -- Return success result
  v_result := json_build_object(
    'success', true,
    'message', 'Application submitted successfully',
    'user_id', p_user_id,
    'submitted_at', now()
  );

  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION submit_borrower_application TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_application_status_submitted_at 
ON application_status (submitted_at DESC) 
WHERE submitted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_application_status_status_submitted 
ON application_status (status, submitted_at DESC) 
WHERE submitted_at IS NOT NULL;