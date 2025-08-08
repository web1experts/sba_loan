/*
  # Fix Meetings Display Issues

  1. Security
    - Update RLS policies for meetings table to allow admin access
    - Ensure proper foreign key relationships
  
  2. Performance
    - Add indexes for better query performance
    - Optimize admin queries
  
  3. Data Integrity
    - Ensure all meeting types are properly supported
    - Add missing constraints if needed
*/

-- First, let's ensure the meetings table has proper structure
DO $$
BEGIN
  -- Add contact_info column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meetings' AND column_name = 'contact_info'
  ) THEN
    ALTER TABLE meetings ADD COLUMN contact_info text DEFAULT '';
  END IF;
END $$;

-- Update meeting_type constraint to include 'callback'
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'meetings_meeting_type_check' 
    AND table_name = 'meetings'
  ) THEN
    ALTER TABLE meetings DROP CONSTRAINT meetings_meeting_type_check;
  END IF;
  
  -- Add updated constraint
  ALTER TABLE meetings ADD CONSTRAINT meetings_meeting_type_check 
    CHECK (meeting_type = ANY (ARRAY['video'::text, 'phone'::text, 'in-person'::text, 'callback'::text]));
END $$;

-- Ensure foreign key exists for user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'meetings_user_id_fkey' 
    AND table_name = 'meetings'
  ) THEN
    ALTER TABLE meetings 
    ADD CONSTRAINT meetings_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Admins can view all meetings" ON meetings;
DROP POLICY IF EXISTS "Users can manage own meetings" ON meetings;
DROP POLICY IF EXISTS "Admins can update meeting status" ON meetings;

-- Create comprehensive RLS policies
CREATE POLICY "Admins can manage all meetings"
  ON meetings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data ->> 'role') = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data ->> 'role') = 'admin'
    )
  );

CREATE POLICY "Users can manage own meetings"
  ON meetings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_meetings_user_id_created_at 
  ON meetings(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_meetings_status_type 
  ON meetings(status, meeting_type);

CREATE INDEX IF NOT EXISTS idx_meetings_meeting_date 
  ON meetings(meeting_date);

-- Create a function to get meeting data with user info for admins
CREATE OR REPLACE FUNCTION get_meetings_for_admin()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  meeting_date date,
  meeting_time text,
  meeting_type text,
  purpose text,
  notes text,
  status text,
  contact_info text,
  created_at timestamptz,
  updated_at timestamptz,
  user_email text,
  user_first_name text,
  user_last_name text,
  user_phone text,
  user_company text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (auth.users.raw_user_meta_data ->> 'role') = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT 
    m.id,
    m.user_id,
    m.meeting_date,
    m.meeting_time,
    m.meeting_type,
    m.purpose,
    m.notes,
    m.status,
    m.contact_info,
    m.created_at,
    m.updated_at,
    u.email as user_email,
    COALESCE(up.first_name, u.raw_user_meta_data ->> 'first_name', '') as user_first_name,
    COALESCE(up.last_name, u.raw_user_meta_data ->> 'last_name', '') as user_last_name,
    COALESCE(up.phone, u.raw_user_meta_data ->> 'phone', '') as user_phone,
    COALESCE(up.company, u.raw_user_meta_data ->> 'company', '') as user_company
  FROM meetings m
  LEFT JOIN auth.users u ON m.user_id = u.id
  LEFT JOIN user_profiles up ON m.user_id = up.id
  ORDER BY m.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_meetings_for_admin() TO authenticated;