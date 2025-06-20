
-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view their studio's PDF submissions" ON public.pdf_submissions;
DROP POLICY IF EXISTS "Users can create PDF submissions for their studio" ON public.pdf_submissions;
DROP POLICY IF EXISTS "Users can update their studio's PDF submissions" ON public.pdf_submissions;
DROP POLICY IF EXISTS "Admins can view all PDF submissions" ON public.pdf_submissions;

-- Recreate RLS policies for pdf_submissions table
CREATE POLICY "Users can view their studio's PDF submissions" 
  ON public.pdf_submissions 
  FOR SELECT 
  USING (studio_id = public.get_user_studio_id());

CREATE POLICY "Users can create PDF submissions for their studio" 
  ON public.pdf_submissions 
  FOR INSERT 
  WITH CHECK (studio_id = public.get_user_studio_id());

CREATE POLICY "Users can update their studio's PDF submissions" 
  ON public.pdf_submissions 
  FOR UPDATE 
  USING (studio_id = public.get_user_studio_id());

CREATE POLICY "Admins can view all PDF submissions" 
  ON public.pdf_submissions 
  FOR ALL 
  USING (public.get_user_role() = 'admin');

-- Create the pdfs storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pdfs', 'pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can upload PDFs to their studio folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view PDFs from their studio folder" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all PDFs" ON storage.objects;

-- Create storage policies for the pdfs bucket
CREATE POLICY "Users can upload PDFs to their studio folder" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'pdfs' AND 
    (storage.foldername(name))[1] = public.get_user_studio_id()::text
  );

CREATE POLICY "Users can view PDFs from their studio folder" 
  ON storage.objects 
  FOR SELECT 
  USING (
    bucket_id = 'pdfs' AND 
    (storage.foldername(name))[1] = public.get_user_studio_id()::text
  );

CREATE POLICY "Admins can manage all PDFs" 
  ON storage.objects 
  FOR ALL 
  USING (
    bucket_id = 'pdfs' AND 
    public.get_user_role() = 'admin'
  );
