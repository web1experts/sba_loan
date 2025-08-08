/*
  # Minimal Application Submission Fix

  1. Changes
    - Add submitted_at column to application_status table if it doesn't exist
    - Create simple function to handle application submission
    - Add index for better performance

  2. Security
    - Uses existing RLS policies
    - No complex permission changes
*/

-- Add submitted_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'application_status' AND column_name = 'submitted_at'
  ) THEN
    ALTER TABLE application_status ADD COLUMN submitted_at timestamptz;
  END IF;
END $$;

-- Create index for submitted applications
CREATE INDEX IF NOT EXISTS idx_application_status_submitted 
ON application_status (submitted_at DESC) 
WHERE submitted_at IS NOT NULL;

-- Simple function to submit application
CREATE OR REPLACE FUNCTION submit_application(
  p_user_id uuid,
  p_notes text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update or insert application status
  INSERT INTO application_status (
    user_id,
    status,
    stage,
    notes,
    submitted_at,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    'documents_pending',
    'documentation',
    p_notes,
    now(),
    now(),
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    status = 'documents_pending',
    stage = 'documentation',
    notes = EXCLUDED.notes,
    submitted_at = now(),
    updated_at = now();
END;
$$;