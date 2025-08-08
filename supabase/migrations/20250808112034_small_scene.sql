/*
  # Fix Application Submission Error

  1. Tables
    - Fix application_status table to have proper unique constraint
    - Ensure user_id has unique constraint for ON CONFLICT clause

  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing constraint if it exists and recreate properly
DO $$
BEGIN
  -- Check if unique constraint exists on user_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'application_status_user_id_key' 
    AND table_name = 'application_status'
  ) THEN
    -- Add unique constraint on user_id for ON CONFLICT clause
    ALTER TABLE application_status ADD CONSTRAINT application_status_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Ensure the table has proper structure for upsert operations
DO $$
BEGIN
  -- Update the trigger function to handle updated_at properly
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'update_application_status_updated_at'
  ) THEN
    CREATE OR REPLACE FUNCTION update_application_status_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    -- Create trigger if it doesn't exist
    CREATE TRIGGER update_application_status_updated_at_trigger
      BEFORE UPDATE ON application_status
      FOR EACH ROW
      EXECUTE FUNCTION update_application_status_updated_at();
  END IF;
END $$;