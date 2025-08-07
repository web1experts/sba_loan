/*
  # Fix Storage RLS Policies for borrower-docs bucket

  1. Storage Configuration
    - Create borrower-docs bucket if it doesn't exist
    - Enable RLS on the bucket
    
  2. Security Policies
    - Allow authenticated users to upload files to their own user folders
    - Allow users to read their own files
    - Allow users to update their own files
    - Allow users to delete their own files
    
  3. Policy Logic
    - Uses storage.foldername(name) to extract folder path
    - Ensures users can only access folders matching their user ID
*/

-- Create the borrower-docs bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('borrower-docs', 'borrower-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;

-- Create INSERT policy for uploading files
CREATE POLICY "Allow authenticated users to upload their own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'borrower-docs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create SELECT policy for viewing files
CREATE POLICY "Allow users to view their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'borrower-docs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create UPDATE policy for updating files
CREATE POLICY "Allow users to update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'borrower-docs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'borrower-docs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create DELETE policy for deleting files
CREATE POLICY "Allow users to delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'borrower-docs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);