/*
  # Fix Storage RLS Policies for borrower-docs bucket

  1. Storage Bucket Setup
    - Ensure borrower-docs bucket exists and is public
    - Configure proper RLS policies for user folder access

  2. Security Policies
    - Allow authenticated users to upload to their own folders
    - Allow users to read, update, and delete only their own files
    - Use proper storage.foldername() function for path checking

  3. Policy Structure
    - INSERT: Allow users to upload to folders starting with their user ID
    - SELECT: Allow users to read only their own files
    - UPDATE: Allow users to update only their own files  
    - DELETE: Allow users to delete only their own files
*/

-- Create the borrower-docs bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('borrower-docs', 'borrower-docs', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to read their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;

-- Create INSERT policy for uploading files to user's own folder
CREATE POLICY "Allow authenticated users to upload to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'borrower-docs' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Create SELECT policy for reading user's own files
CREATE POLICY "Allow users to read their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'borrower-docs' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Create UPDATE policy for updating user's own files
CREATE POLICY "Allow users to update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'borrower-docs' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
)
WITH CHECK (
  bucket_id = 'borrower-docs' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Create DELETE policy for deleting user's own files
CREATE POLICY "Allow users to delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'borrower-docs' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);