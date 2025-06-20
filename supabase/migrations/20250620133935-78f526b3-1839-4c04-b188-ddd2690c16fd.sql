
-- First, let's enable RLS if not already enabled
ALTER TABLE public.pdf_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict and recreate them
DROP POLICY IF EXISTS "Users can delete their studio's PDF submissions" ON public.pdf_submissions;
DROP POLICY IF EXISTS "Users can view their studio's PDF submissions" ON public.pdf_submissions;
DROP POLICY IF EXISTS "Users can create their studio's PDF submissions" ON public.pdf_submissions;
DROP POLICY IF EXISTS "Users can update their studio's PDF submissions" ON public.pdf_submissions;

-- Create policy to allow users to delete their own studio's PDF submissions
CREATE POLICY "Users can delete their studio's PDF submissions" 
  ON public.pdf_submissions 
  FOR DELETE 
  USING (studio_id = get_user_studio_id());

-- Create policy to allow users to select their own studio's PDF submissions
CREATE POLICY "Users can view their studio's PDF submissions" 
  ON public.pdf_submissions 
  FOR SELECT 
  USING (studio_id = get_user_studio_id());

-- Create policy to allow users to insert their own studio's PDF submissions
CREATE POLICY "Users can create their studio's PDF submissions" 
  ON public.pdf_submissions 
  FOR INSERT 
  WITH CHECK (studio_id = get_user_studio_id());

-- Create policy to allow users to update their own studio's PDF submissions
CREATE POLICY "Users can update their studio's PDF submissions" 
  ON public.pdf_submissions 
  FOR UPDATE 
  USING (studio_id = get_user_studio_id());
