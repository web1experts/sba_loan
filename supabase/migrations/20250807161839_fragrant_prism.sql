/*
  # Create Storage Policies for borrower-docs Bucket

  1. Storage Bucket
    - Create `borrower-docs` bucket if it doesn't exist
    - Configure bucket settings for file uploads

  2. Security Policies
    - Allow authenticated users to upload files to their own folders
    - Allow users to view, update, and delete their own files
    - Use storage.foldername() function to extract folder path
    - Ensure user isolation by checking auth.uid() matches folder name

  3. Policy Structure
    - INSERT: Users can upload to folders named after their user ID
    - SELECT: Users can view files in their own folders
    - UPDATE: Users can update metadata of their own files
    - DELETE: Users can delete their own files
*/

-- Create the borrower-docs bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'borrower-docs',
  'borrower-docs',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own files" ON storage.objects;

-- Create INSERT policy for uploading files to user's own folder
CREATE POLICY "Allow authenticated users to upload to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'borrower-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create SELECT policy for viewing user's own files
CREATE POLICY "Allow authenticated users to view their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'borrower-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create UPDATE policy for updating user's own files
CREATE POLICY "Allow authenticated users to update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'borrower-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'borrower-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create DELETE policy for deleting user's own files
CREATE POLICY "Allow authenticated users to delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'borrower-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);