
-- Create considered_materials table to track materials that were evaluated but not selected
CREATE TABLE public.considered_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL,
  project_id UUID NOT NULL,
  material_name TEXT NOT NULL,
  manufacturer_id UUID,
  category TEXT NOT NULL,
  subcategory TEXT,
  notes TEXT, -- why it wasn't chosen
  selected_material_id UUID, -- what was chosen instead
  photo_url TEXT,
  reference_sku TEXT,
  dimensions TEXT,
  location TEXT,
  evaluated_by UUID NOT NULL, -- user who evaluated it
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create material_versions table for tracking spec changes
CREATE TABLE public.material_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL,
  studio_id UUID NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  notes TEXT,
  reference_sku TEXT,
  dimensions TEXT,
  location TEXT,
  manufacturer_id UUID,
  price_per_sqft NUMERIC,
  price_per_unit NUMERIC,
  unit_type TEXT,
  total_area NUMERIC,
  total_units NUMERIC,
  tag TEXT,
  photo_url TEXT,
  changed_by UUID NOT NULL,
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for considered_materials
ALTER TABLE public.considered_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their studio's considered materials" ON public.considered_materials
FOR SELECT USING (studio_id = get_user_studio_id());

CREATE POLICY "Users can create considered materials for their studio" ON public.considered_materials
FOR INSERT WITH CHECK (studio_id = get_user_studio_id());

CREATE POLICY "Users can update their studio's considered materials" ON public.considered_materials
FOR UPDATE USING (studio_id = get_user_studio_id());

CREATE POLICY "Users can delete their studio's considered materials" ON public.considered_materials
FOR DELETE USING (studio_id = get_user_studio_id());

-- Add RLS policies for material_versions
ALTER TABLE public.material_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their studio's material versions" ON public.material_versions
FOR SELECT USING (studio_id = get_user_studio_id());

CREATE POLICY "Users can create material versions for their studio" ON public.material_versions
FOR INSERT WITH CHECK (studio_id = get_user_studio_id());

-- Create trigger to automatically create material versions when materials are updated
CREATE OR REPLACE FUNCTION public.create_material_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only create version if significant fields have changed
  IF (OLD.name IS DISTINCT FROM NEW.name) OR 
     (OLD.category IS DISTINCT FROM NEW.category) OR 
     (OLD.subcategory IS DISTINCT FROM NEW.subcategory) OR
     (OLD.reference_sku IS DISTINCT FROM NEW.reference_sku) OR
     (OLD.dimensions IS DISTINCT FROM NEW.dimensions) OR
     (OLD.manufacturer_id IS DISTINCT FROM NEW.manufacturer_id) OR
     (OLD.price_per_sqft IS DISTINCT FROM NEW.price_per_sqft) OR
     (OLD.price_per_unit IS DISTINCT FROM NEW.price_per_unit) OR
     (OLD.unit_type IS DISTINCT FROM NEW.unit_type) OR
     (OLD.total_area IS DISTINCT FROM NEW.total_area) OR
     (OLD.total_units IS DISTINCT FROM NEW.total_units) OR
     (OLD.tag IS DISTINCT FROM NEW.tag) OR
     (OLD.location IS DISTINCT FROM NEW.location) OR
     (OLD.photo_url IS DISTINCT FROM NEW.photo_url) THEN
    
    INSERT INTO public.material_versions (
      material_id,
      studio_id,
      version_number,
      name,
      category,
      subcategory,
      notes,
      reference_sku,
      dimensions,
      location,
      manufacturer_id,
      price_per_sqft,
      price_per_unit,
      unit_type,
      total_area,
      total_units,
      tag,
      photo_url,
      changed_by,
      change_reason
    ) VALUES (
      NEW.id,
      NEW.studio_id,
      COALESCE((SELECT MAX(version_number) + 1 FROM public.material_versions WHERE material_id = NEW.id), 1),
      NEW.name,
      NEW.category,
      NEW.subcategory,
      NEW.notes,
      NEW.reference_sku,
      NEW.dimensions,
      NEW.location,
      NEW.manufacturer_id,
      NEW.price_per_sqft,
      NEW.price_per_unit,
      NEW.unit_type,
      NEW.total_area,
      NEW.total_units,
      NEW.tag,
      NEW.photo_url,
      auth.uid(),
      'Material specifications updated'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on materials table
CREATE TRIGGER trigger_create_material_version
  AFTER UPDATE ON public.materials
  FOR EACH ROW
  EXECUTE FUNCTION public.create_material_version();

-- Add foreign key constraints
ALTER TABLE public.considered_materials
ADD CONSTRAINT fk_considered_materials_studio_id
FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE;

ALTER TABLE public.considered_materials
ADD CONSTRAINT fk_considered_materials_project_id
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.considered_materials
ADD CONSTRAINT fk_considered_materials_manufacturer_id
FOREIGN KEY (manufacturer_id) REFERENCES public.manufacturers(id) ON DELETE SET NULL;

ALTER TABLE public.considered_materials
ADD CONSTRAINT fk_considered_materials_selected_material_id
FOREIGN KEY (selected_material_id) REFERENCES public.materials(id) ON DELETE SET NULL;

ALTER TABLE public.material_versions
ADD CONSTRAINT fk_material_versions_material_id
FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE CASCADE;

ALTER TABLE public.material_versions
ADD CONSTRAINT fk_material_versions_studio_id
FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE;

ALTER TABLE public.material_versions
ADD CONSTRAINT fk_material_versions_manufacturer_id
FOREIGN KEY (manufacturer_id) REFERENCES public.manufacturers(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_considered_materials_project_id ON public.considered_materials(project_id);
CREATE INDEX idx_considered_materials_studio_id ON public.considered_materials(studio_id);
CREATE INDEX idx_material_versions_material_id ON public.material_versions(material_id);
CREATE INDEX idx_material_versions_studio_id ON public.material_versions(studio_id);
