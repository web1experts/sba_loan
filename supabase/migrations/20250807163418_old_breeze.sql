/*
  # Documents Table RLS Policy Only
  
  This migration only handles the documents table RLS policy.
  Storage policies must be created manually in Supabase Dashboard.
  
  ## Storage Policy Instructions
  
  Go to Supabase Dashboard → Database → SQL Editor and run:
  
  ```sql
  -- Enable RLS on storage.objects (if not already enabled)
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  
  -- Create policy for user uploads to their own folder
  CREATE POLICY "Allow user uploads to their own folder"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'borrower-docs'
    AND auth.uid() IS NOT NULL
    AND storage.objects.name LIKE auth.uid()::text || '/%'
  );
  
  -- Create policy for users to view their own files
  CREATE POLICY "Allow users to view their own files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'borrower-docs'
    AND auth.uid() IS NOT NULL
    AND storage.objects.name LIKE auth.uid()::text || '/%'
  );
  
  -- Create policy for users to update their own files
  CREATE POLICY "Allow users to update their own files"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'borrower-docs'
    AND auth.uid() IS NOT NULL
    AND storage.objects.name LIKE auth.uid()::text || '/%'
  );
  
  -- Create policy for users to delete their own files
  CREATE POLICY "Allow users to delete their own files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'borrower-docs'
    AND auth.uid() IS NOT NULL
    AND storage.objects.name LIKE auth.uid()::text || '/%'
  );
  ```
*/

-- Only handle documents table RLS policy in migration
CREATE POLICY IF NOT EXISTS "Users can insert own documents"
ON documents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Ensure other document policies exist
DO $$
BEGIN
  -- Check if SELECT policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'documents' 
    AND policyname = 'Users can view own documents'
  ) THEN
    CREATE POLICY "Users can view own documents"
    ON documents
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  -- Check if UPDATE policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'documents' 
    AND policyname = 'Users can update own documents'
  ) THEN
    CREATE POLICY "Users can update own documents"
    ON documents
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Check if DELETE policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'documents' 
    AND policyname = 'Users can delete own documents'
  ) THEN
    CREATE POLICY "Users can delete own documents"
    ON documents
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;