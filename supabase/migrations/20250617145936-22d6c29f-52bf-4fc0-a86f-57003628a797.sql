
-- Add model column to materials table
ALTER TABLE public.materials 
ADD COLUMN model TEXT;

-- Add model column to material_versions table for version tracking
ALTER TABLE public.material_versions 
ADD COLUMN model TEXT;
