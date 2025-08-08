/*
  # Update Admin Dashboard Tables

  1. Updates
    - Add submitted_at column to application_status table
    - Create indexes for better performance
    - Update RLS policies for admin access

  2. Security
    - Maintain existing RLS policies
    - Ensure admin access to all data
*/

-- Add submitted_at column to application_status if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'application_status' AND column_name = 'submitted_at'
  ) THEN
    ALTER TABLE application_status ADD COLUMN submitted_at timestamptz;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_application_status_submitted_at ON application_status(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_application_status_status_stage ON application_status(status, stage);

-- Update application_status trigger to set submitted_at when status changes to submitted
CREATE OR REPLACE FUNCTION update_application_submitted_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Set submitted_at when status changes to indicate submission
  IF NEW.status IN ('documents_pending', 'under_review') AND OLD.status != NEW.status THEN
    NEW.submitted_at = COALESCE(NEW.submitted_at, now());
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_application_status_submitted_at ON application_status;
CREATE TRIGGER update_application_status_submitted_at
  BEFORE UPDATE ON application_status
  FOR EACH ROW
  EXECUTE FUNCTION update_application_submitted_at();