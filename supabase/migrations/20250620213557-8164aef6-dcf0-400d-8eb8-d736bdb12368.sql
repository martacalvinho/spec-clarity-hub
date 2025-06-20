
-- Update foreign key constraints to cascade deletions
-- This will automatically delete related records when parent records are deleted

-- Drop existing foreign key constraints
ALTER TABLE pdf_submissions DROP CONSTRAINT IF EXISTS pdf_submissions_project_id_fkey;
ALTER TABLE pdf_submissions DROP CONSTRAINT IF EXISTS pdf_submissions_client_id_fkey;
ALTER TABLE pending_materials DROP CONSTRAINT IF EXISTS pending_materials_manufacturer_id_fkey;

-- Recreate constraints with CASCADE deletion
ALTER TABLE pdf_submissions 
ADD CONSTRAINT pdf_submissions_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE pdf_submissions 
ADD CONSTRAINT pdf_submissions_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE pending_materials 
ADD CONSTRAINT pending_materials_manufacturer_id_fkey 
FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id) ON DELETE CASCADE;

-- Also update other related tables for consistency
ALTER TABLE materials DROP CONSTRAINT IF EXISTS materials_manufacturer_id_fkey;
ALTER TABLE materials 
ADD CONSTRAINT materials_manufacturer_id_fkey 
FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id) ON DELETE SET NULL;

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_client_id_fkey;
ALTER TABLE projects 
ADD CONSTRAINT projects_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

ALTER TABLE proj_materials DROP CONSTRAINT IF EXISTS proj_materials_project_id_fkey;
ALTER TABLE proj_materials 
ADD CONSTRAINT proj_materials_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE proj_materials DROP CONSTRAINT IF EXISTS proj_materials_material_id_fkey;
ALTER TABLE proj_materials 
ADD CONSTRAINT proj_materials_material_id_fkey 
FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE;
