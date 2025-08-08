/*
  # Fix Application Status RLS Policies

  1. Security Updates
    - Fix RLS policies for application_status table
    - Ensure users can insert their own application status
    - Maintain admin access for all operations
    - Add proper user verification

  2. Changes
    - Drop existing problematic policies
    - Create new comprehensive policies
    - Add indexes for performance
    - Ensure proper foreign key relationships
*/

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view own application status" ON application_status;
DROP POLICY IF EXISTS "Admins can view all application statuses" ON application_status;
DROP POLICY IF EXISTS "Admins can manage application statuses" ON application_status;

-- Create comprehensive RLS policies for application_status
CREATE POLICY "Users can insert own application status"
  ON application_status
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own application status"
  ON application_status
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own application status"
  ON application_status
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all application statuses"
  ON application_status
  FOR ALL
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin',
      false
    )
  )
  WITH CHECK (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin',
      false
    )
  );

-- Ensure the table has proper structure
ALTER TABLE application_status 
  ALTER COLUMN user_id SET NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_application_status_user_id_unique 
  ON application_status(user_id);

-- Ensure foreign key constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'application_status_user_id_fkey'
    AND table_name = 'application_status'
  ) THEN
    ALTER TABLE application_status 
      ADD CONSTRAINT application_status_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create function to handle application status upsert safely
CREATE OR REPLACE FUNCTION upsert_application_status(
  p_user_id uuid,
  p_status text,
  p_stage text,
  p_notes text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_id uuid;
BEGIN
  -- Verify the user is authenticated and matches the user_id
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Permission denied: can only update own application status';
  END IF;
  
  -- Upsert the application status
  INSERT INTO application_status (
    user_id,
    status,
    stage,
    notes,
    updated_by,
    created_at,
    updated_at,
    submitted_at
  ) VALUES (
    p_user_id,
    p_status,
    p_stage,
    p_notes,
    p_user_id,
    now(),
    now(),
    CASE WHEN p_status != 'started' THEN now() ELSE NULL END
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    status = EXCLUDED.status,
    stage = EXCLUDED.stage,
    notes = EXCLUDED.notes,
    updated_by = EXCLUDED.updated_by,
    updated_at = now(),
    submitted_at = CASE 
      WHEN EXCLUDED.status != 'started' AND application_status.submitted_at IS NULL 
      THEN now() 
      ELSE application_status.submitted_at 
    END
  RETURNING id INTO result_id;
  
  RETURN result_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upsert_application_status(uuid, text, text, text) TO authenticated;