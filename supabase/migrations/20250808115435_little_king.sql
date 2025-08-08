/*
  # Fix Meeting Scheduling Permissions

  1. Security Updates
    - Fix RLS policies to use proper auth functions
    - Remove direct access to auth.users table
    - Use auth.uid() and auth.jwt() functions instead
  
  2. Function Updates
    - Update get_meetings_for_admin function to use proper auth
    - Remove dependency on auth.users table
    - Use user_profiles table as primary source
  
  3. Policy Fixes
    - Ensure proper admin access using JWT metadata
    - Fix user access policies
    - Add proper error handling
*/

-- Drop existing function and recreate with proper permissions
DROP FUNCTION IF EXISTS get_meetings_for_admin();

-- Create improved function that doesn't access auth.users directly
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
  created_at timestamptz,
  updated_at timestamptz,
  contact_info text,
  user_first_name text,
  user_last_name text,
  user_email text,
  user_phone text,
  user_company text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin using JWT metadata
  IF NOT (
    SELECT COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
      false
    )
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Return meetings with user profile data
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
    m.created_at,
    m.updated_at,
    m.contact_info,
    COALESCE(up.first_name, 'Unknown') as user_first_name,
    COALESCE(up.last_name, 'User') as user_last_name,
    COALESCE(up.email, 'No email') as user_email,
    COALESCE(up.phone, '') as user_phone,
    COALESCE(up.company, '') as user_company
  FROM meetings m
  LEFT JOIN user_profiles up ON m.user_id = up.id
  ORDER BY m.created_at DESC;
END;
$$;

-- Update RLS policies for meetings table
DROP POLICY IF EXISTS "Admins can manage all meetings" ON meetings;
DROP POLICY IF EXISTS "Users can manage own meetings" ON meetings;

-- Create comprehensive policies
CREATE POLICY "Users can manage own meetings"
  ON meetings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all meetings"
  ON meetings
  FOR ALL
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
      false
    )
  )
  WITH CHECK (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
      false
    )
  );

-- Ensure meetings table has proper structure
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

-- Update meeting type constraint to include callback
ALTER TABLE meetings DROP CONSTRAINT IF EXISTS meetings_meeting_type_check;
ALTER TABLE meetings ADD CONSTRAINT meetings_meeting_type_check 
  CHECK (meeting_type = ANY (ARRAY['video'::text, 'phone'::text, 'in-person'::text, 'callback'::text]));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meetings_user_id_created_at ON meetings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_status_type ON meetings(status, meeting_type);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON meetings TO authenticated;
GRANT EXECUTE ON FUNCTION get_meetings_for_admin() TO authenticated;