/*
  # Fix Storage RLS Policies for borrower-docs bucket

  1. Storage Configuration
    - Create borrower-docs bucket if it doesn't exist
    - Configure proper RLS policies for user folder access
  
  2. Security Policies
    - Allow authenticated users to upload files to their own folders
    - Ensure users can only access files in folders matching their user ID
    - Use proper storage.foldername() function for path validation
  
  3. Operations Covered
    - INSERT: Users can upload files to their own folders
    - SELECT: Users can view their own files
    - UPDATE: Users can update their own files
    - DELETE: Users can delete their own files
*/

-- Create the borrower-docs bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('borrower-docs', 'borrower-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Create policy for INSERT (uploading files)
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'borrower-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for SELECT (viewing files)
CREATE POLICY "Users can view own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'borrower-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for UPDATE (updating file metadata)
CREATE POLICY "Users can update own files"
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

-- Create policy for DELETE (deleting files)
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'borrower-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);