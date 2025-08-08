/*
  # Fix meetings table RLS and relationships

  1. Updates
    - Fix RLS policies for meetings table
    - Ensure proper foreign key relationships
    - Add indexes for better performance

  2. Security
    - Allow admins to view all meetings
    - Allow users to view their own meetings
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all meetings" ON meetings;
DROP POLICY IF EXISTS "Users can manage own meetings" ON meetings;

-- Create proper RLS policies
CREATE POLICY "Admins can view all meetings"
  ON meetings
  FOR ALL
  TO authenticated
  USING (((jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text)
  WITH CHECK (((jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text);

CREATE POLICY "Users can manage own meetings"
  ON meetings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure the foreign key relationship exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'meetings_user_id_fkey'
  ) THEN
    ALTER TABLE meetings 
    ADD CONSTRAINT meetings_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meetings_user_id_status ON meetings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_meetings_meeting_type ON meetings(meeting_type);
CREATE INDEX IF NOT EXISTS idx_meetings_created_at ON meetings(created_at DESC);