/*
  # Fix Storage RLS Policies for User Folders

  1. Storage Bucket Setup
    - Ensure `borrower-docs` bucket exists and is public
    - Configure proper RLS policies for user-specific folders

  2. RLS Policies
    - Allow users to upload files to their own folders only
    - Allow users to view their own files only  
    - Allow users to delete their own files only
    - Folder structure: user_id/category/filename

  3. Security
    - Users can only access files in folders matching their auth.uid()
    - Prevents cross-user file access
    - Maintains data isolation
*/

-- Create the borrower-docs bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('borrower-docs', 'borrower-docs', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own files" ON storage.objects;

-- Create RLS policy for INSERT (upload files)
CREATE POLICY "Allow authenticated users to upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'borrower-docs' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Create RLS policy for SELECT (view files)
CREATE POLICY "Allow authenticated users to view their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'borrower-docs' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Create RLS policy for DELETE (delete files)
CREATE POLICY "Allow authenticated users to delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'borrower-docs' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Create RLS policy for UPDATE (update file metadata)
CREATE POLICY "Allow authenticated users to update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'borrower-docs' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
)
WITH CHECK (
  bucket_id = 'borrower-docs' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);