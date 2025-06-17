
-- Add created_by field to materials table to track who added each material
ALTER TABLE public.materials 
ADD COLUMN created_by uuid REFERENCES auth.users(id);

-- Update existing materials to set created_by to the first user in their studio (as a fallback)
UPDATE public.materials 
SET created_by = (
  SELECT u.id 
  FROM public.users u 
  WHERE u.studio_id = materials.studio_id 
  LIMIT 1
) 
WHERE created_by IS NULL;
