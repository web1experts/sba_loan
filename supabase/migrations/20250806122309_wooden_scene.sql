/*
  # SBA Loan Dashboard Database Schema

  1. New Tables
    - `documents`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `doc_name` (text, document category)
      - `file_name` (text, original file name)
      - `file_path` (text, path in storage)
      - `status` (text, upload status)
      - `uploaded_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `referral_leads`
      - `id` (uuid, primary key)
      - `referral_user_id` (uuid, references auth.users)
      - `business_name` (text)
      - `contact_name` (text)
      - `contact_email` (text)
      - `contact_phone` (text)
      - `loan_amount` (text)
      - `business_type` (text)
      - `notes` (text)
      - `status` (text, lead status)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Storage Buckets
    - `borrower-docs` (for borrower document uploads)
    - `referral_uploads` (for referral partner documents)

  3. Security
    - Enable RLS on all tables
    - Add policies for user data access
    - Configure storage bucket policies
*/

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  doc_name text NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  status text DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'approved', 'rejected')),
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create referral_leads table
CREATE TABLE IF NOT EXISTS referral_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_name text NOT NULL,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  loan_amount text,
  business_type text,
  notes text,
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'in_review', 'approved', 'funded', 'declined')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_leads ENABLE ROW LEVEL SECURITY;

-- Documents policies
CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin users can view all documents
CREATE POLICY "Admin users can view all documents"
  ON documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Referral leads policies
CREATE POLICY "Referral users can view own leads"
  ON referral_leads FOR SELECT
  TO authenticated
  USING (auth.uid() = referral_user_id);

CREATE POLICY "Referral users can insert own leads"
  ON referral_leads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = referral_user_id);

CREATE POLICY "Referral users can update own leads"
  ON referral_leads FOR UPDATE
  TO authenticated
  USING (auth.uid() = referral_user_id);

-- Admin users can view and update all leads
CREATE POLICY "Admin users can view all leads"
  ON referral_leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admin users can update all leads"
  ON referral_leads FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create storage buckets (run these in Supabase dashboard)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('borrower-docs', 'borrower-docs', false),
  ('referral_uploads', 'referral_uploads', false)
ON CONFLICT DO NOTHING;

-- Storage policies for borrower-docs bucket
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'borrower-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'borrower-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'borrower-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admin can access all documents
CREATE POLICY "Admin can access all borrower documents"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'borrower-docs' AND
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Storage policies for referral_uploads bucket
CREATE POLICY "Referral users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'referral_uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Referral users can view own uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'referral_uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_referral_leads_referral_user_id ON referral_leads(referral_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_leads_status ON referral_leads(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to update the updated_at column
CREATE TRIGGER update_documents_updated_at 
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_leads_updated_at 
  BEFORE UPDATE ON referral_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();