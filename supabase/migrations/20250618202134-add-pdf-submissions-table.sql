
-- Create the pdf_submissions table
CREATE TABLE IF NOT EXISTS pdf_submissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id uuid REFERENCES studios(id) NOT NULL,
  project_id uuid REFERENCES projects(id),
  client_id uuid REFERENCES clients(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready_for_review', 'completed', 'rejected')),
  notes text,
  file_name text NOT NULL,
  file_size integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  processed_at timestamp with time zone,
  processed_by uuid REFERENCES users(id)
);

-- Add RLS policies for pdf_submissions
ALTER TABLE pdf_submissions ENABLE ROW LEVEL SECURITY;

-- Allow users to view submissions for their studio
CREATE POLICY pdf_submissions_select_policy
  ON pdf_submissions
  FOR SELECT
  USING (studio_id = (SELECT studio_id FROM users WHERE id = auth.uid()));

-- Allow users to insert submissions for their studio
CREATE POLICY pdf_submissions_insert_policy
  ON pdf_submissions
  FOR INSERT
  WITH CHECK (studio_id = (SELECT studio_id FROM users WHERE id = auth.uid()));
  
-- Create the extracted_materials table to store materials extracted from PDFs
CREATE TABLE IF NOT EXISTS extracted_materials (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id uuid REFERENCES pdf_submissions(id) NOT NULL,
  studio_id uuid REFERENCES studios(id) NOT NULL,
  name text NOT NULL,
  tag text,
  manufacturer_name text,
  category text NOT NULL,
  subcategory text,
  location text,
  reference_sku text,
  dimensions text,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  approved_at timestamp with time zone,
  approved_by uuid REFERENCES users(id),
  rejected_at timestamp with time zone,
  rejected_by uuid REFERENCES users(id)
);

-- Add RLS policies for extracted_materials
ALTER TABLE extracted_materials ENABLE ROW LEVEL SECURITY;

-- Allow users to view extracted materials for their studio
CREATE POLICY extracted_materials_select_policy
  ON extracted_materials
  FOR SELECT
  USING (studio_id = (SELECT studio_id FROM users WHERE id = auth.uid()));

-- Create updated_at trigger for both tables
CREATE TRIGGER set_pdf_submissions_updated_at
  BEFORE UPDATE ON pdf_submissions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_extracted_materials_updated_at
  BEFORE UPDATE ON extracted_materials
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
