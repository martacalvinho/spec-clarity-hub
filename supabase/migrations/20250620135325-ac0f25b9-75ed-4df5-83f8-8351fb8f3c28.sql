
-- Create table for materials pending approval
CREATE TABLE public.pending_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL,
  submission_id UUID REFERENCES public.pdf_submissions(id),
  project_id UUID REFERENCES public.projects(id),
  client_id UUID REFERENCES public.clients(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  manufacturer_name TEXT,
  manufacturer_id UUID REFERENCES public.manufacturers(id),
  model TEXT,
  tag TEXT,
  location TEXT,
  reference_sku TEXT,
  dimensions TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID NOT NULL,
  approved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for manufacturers pending approval
CREATE TABLE public.pending_manufacturers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL,
  submission_id UUID REFERENCES public.pdf_submissions(id),
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID NOT NULL,
  approved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for pending_materials
ALTER TABLE public.pending_materials ENABLE ROW LEVEL SECURITY;

-- Create policies for pending_materials
CREATE POLICY "Users can view their studio's pending materials" 
  ON public.pending_materials 
  FOR SELECT 
  USING (studio_id = get_user_studio_id());

CREATE POLICY "Users can create their studio's pending materials" 
  ON public.pending_materials 
  FOR INSERT 
  WITH CHECK (studio_id = get_user_studio_id());

CREATE POLICY "Users can update their studio's pending materials" 
  ON public.pending_materials 
  FOR UPDATE 
  USING (studio_id = get_user_studio_id());

CREATE POLICY "Users can delete their studio's pending materials" 
  ON public.pending_materials 
  FOR DELETE 
  USING (studio_id = get_user_studio_id());

-- Enable RLS for pending_manufacturers
ALTER TABLE public.pending_manufacturers ENABLE ROW LEVEL SECURITY;

-- Create policies for pending_manufacturers
CREATE POLICY "Users can view their studio's pending manufacturers" 
  ON public.pending_manufacturers 
  FOR SELECT 
  USING (studio_id = get_user_studio_id());

CREATE POLICY "Users can create their studio's pending manufacturers" 
  ON public.pending_manufacturers 
  FOR INSERT 
  WITH CHECK (studio_id = get_user_studio_id());

CREATE POLICY "Users can update their studio's pending manufacturers" 
  ON public.pending_manufacturers 
  FOR UPDATE 
  USING (studio_id = get_user_studio_id());

CREATE POLICY "Users can delete their studio's pending manufacturers" 
  ON public.pending_manufacturers 
  FOR DELETE 
  USING (studio_id = get_user_studio_id());

-- Add trigger for updated_at on pending_materials
CREATE TRIGGER update_pending_materials_updated_at
    BEFORE UPDATE ON public.pending_materials
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add trigger for updated_at on pending_manufacturers
CREATE TRIGGER update_pending_manufacturers_updated_at
    BEFORE UPDATE ON public.pending_manufacturers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
