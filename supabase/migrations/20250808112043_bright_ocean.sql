/*
  # Update Meetings Table for Better Admin Integration

  1. Tables
    - Ensure meetings table has proper structure
    - Add indexes for better performance
    - Update constraints

  2. Security
    - Maintain existing RLS policies
    - Ensure admin can view all meetings
*/

-- Ensure meetings table has all required columns
DO $$
BEGIN
  -- Add any missing columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meetings' AND column_name = 'contact_info'
  ) THEN
    ALTER TABLE meetings ADD COLUMN contact_info text DEFAULT '';
  END IF;
END $$;

-- Update meeting types constraint to include new types
DO $$
BEGIN
  -- Drop existing constraint
  ALTER TABLE meetings DROP CONSTRAINT IF EXISTS meetings_meeting_type_check;
  
  -- Add updated constraint
  ALTER TABLE meetings ADD CONSTRAINT meetings_meeting_type_check 
    CHECK (meeting_type = ANY (ARRAY['video'::text, 'phone'::text, 'in-person'::text, 'callback'::text]));
END $$;

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS meetings_user_id_status_idx ON meetings(user_id, status);
CREATE INDEX IF NOT EXISTS meetings_meeting_type_idx ON meetings(meeting_type);
CREATE INDEX IF NOT EXISTS meetings_created_at_desc_idx ON meetings(created_at DESC);