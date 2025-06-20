
-- Drop existing policies for pending_materials
DROP POLICY IF EXISTS "Users can view their studio's pending materials" ON public.pending_materials;
DROP POLICY IF EXISTS "Users can create their studio's pending materials" ON public.pending_materials;
DROP POLICY IF EXISTS "Users can update their studio's pending materials" ON public.pending_materials;
DROP POLICY IF EXISTS "Users can delete their studio's pending materials" ON public.pending_materials;

-- Create updated policies that allow admins to work with any studio
CREATE POLICY "Users can view their studio's pending materials" 
  ON public.pending_materials 
  FOR SELECT 
  USING (
    studio_id IN (
      SELECT studio_id FROM public.users WHERE id = auth.uid()
    )
    OR 
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can create their studio's pending materials" 
  ON public.pending_materials 
  FOR INSERT 
  WITH CHECK (
    studio_id IN (
      SELECT studio_id FROM public.users WHERE id = auth.uid()
    )
    OR 
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can update their studio's pending materials" 
  ON public.pending_materials 
  FOR UPDATE 
  USING (
    studio_id IN (
      SELECT studio_id FROM public.users WHERE id = auth.uid()
    )
    OR 
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can delete their studio's pending materials" 
  ON public.pending_materials 
  FOR DELETE 
  USING (
    studio_id IN (
      SELECT studio_id FROM public.users WHERE id = auth.uid()
    )
    OR 
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Also update pending_manufacturers policies to allow admin access
DROP POLICY IF EXISTS "Users can view their studio's pending manufacturers" ON public.pending_manufacturers;
DROP POLICY IF EXISTS "Users can create their studio's pending manufacturers" ON public.pending_manufacturers;
DROP POLICY IF EXISTS "Users can update their studio's pending manufacturers" ON public.pending_manufacturers;
DROP POLICY IF EXISTS "Users can delete their studio's pending manufacturers" ON public.pending_manufacturers;

CREATE POLICY "Users can view their studio's pending manufacturers" 
  ON public.pending_manufacturers 
  FOR SELECT 
  USING (
    studio_id IN (
      SELECT studio_id FROM public.users WHERE id = auth.uid()
    )
    OR 
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can create their studio's pending manufacturers" 
  ON public.pending_manufacturers 
  FOR INSERT 
  WITH CHECK (
    studio_id IN (
      SELECT studio_id FROM public.users WHERE id = auth.uid()
    )
    OR 
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can update their studio's pending manufacturers" 
  ON public.pending_manufacturers 
  FOR UPDATE 
  USING (
    studio_id IN (
      SELECT studio_id FROM public.users WHERE id = auth.uid()
    )
    OR 
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can delete their studio's pending manufacturers" 
  ON public.pending_manufacturers 
  FOR DELETE 
  USING (
    studio_id IN (
      SELECT studio_id FROM public.users WHERE id = auth.uid()
    )
    OR 
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );
