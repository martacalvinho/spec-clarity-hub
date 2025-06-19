
-- First, let's create the storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pdfs', 'pdfs', false);

-- Create storage policies for the PDF bucket
CREATE POLICY "Users can upload PDFs to their studio folder"
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'pdfs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view PDFs from their studio"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'pdfs' 
  AND (
    -- Admin can see all
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    OR
    -- Studio users can see their studio's files
    auth.uid()::text = (storage.foldername(name))[1]
  )
);

-- Now update the pdf_submissions table to include storage references
ALTER TABLE pdf_submissions 
ADD COLUMN bucket_id text NOT NULL DEFAULT 'pdfs',
ADD COLUMN object_path text,
ADD COLUMN mime_type text DEFAULT 'application/pdf';

-- Add indexes for better performance
CREATE INDEX idx_pdf_submissions_studio_created ON pdf_submissions (studio_id, created_at DESC);
CREATE INDEX idx_pdf_submissions_status ON pdf_submissions (status);
CREATE INDEX idx_pdf_submissions_storage ON pdf_submissions (bucket_id, object_path);

-- Update RLS policies to be more specific
DROP POLICY IF EXISTS "pdf_submissions_select_policy" ON pdf_submissions;
DROP POLICY IF EXISTS "pdf_submissions_insert_policy" ON pdf_submissions;
DROP POLICY IF EXISTS "pdf_submissions_update_policy" ON pdf_submissions;

CREATE POLICY "Users can view PDF submissions for their studio"
ON pdf_submissions FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  OR 
  studio_id = (SELECT studio_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Users can create PDF submissions for their studio"
ON pdf_submissions FOR INSERT
WITH CHECK (studio_id = (SELECT studio_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update PDF submissions for their studio"
ON pdf_submissions FOR UPDATE
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  OR 
  studio_id = (SELECT studio_id FROM users WHERE id = auth.uid())
);
