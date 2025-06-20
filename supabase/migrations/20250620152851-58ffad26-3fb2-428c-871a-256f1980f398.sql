
-- Add status tracking fields to pending_materials table
ALTER TABLE pending_materials 
ADD COLUMN rejected_by uuid REFERENCES auth.users(id),
ADD COLUMN rejected_at timestamp with time zone,
ADD COLUMN rejection_reason text;

-- Update the status enum to include rejected
-- First check what values exist
DO $$ 
BEGIN
    -- Add rejected status if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'rejected' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'text')) THEN
        -- Since it's a text field, we don't need to alter enum, just ensure rejected is allowed
        NULL;
    END IF;
END $$;

-- Create a table to track PDF processing status
CREATE TABLE IF NOT EXISTS pdf_material_status (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id uuid NOT NULL REFERENCES pdf_submissions(id) ON DELETE CASCADE,
    studio_id uuid NOT NULL REFERENCES studios(id),
    total_materials_extracted integer DEFAULT 0,
    materials_approved integer DEFAULT 0,
    materials_rejected integer DEFAULT 0,
    materials_edited integer DEFAULT 0,
    all_materials_processed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(submission_id)
);

-- Enable RLS on the new table
ALTER TABLE pdf_material_status ENABLE ROW LEVEL SECURITY;

-- Create policies for pdf_material_status
CREATE POLICY "Admin can view all pdf material status" ON pdf_material_status
    FOR SELECT USING (true);

CREATE POLICY "Admin can manage pdf material status" ON pdf_material_status
    FOR ALL USING (true);

-- Add trigger to update pdf_material_status when materials are processed
CREATE OR REPLACE FUNCTION update_pdf_material_status()
RETURNS TRIGGER AS $$
DECLARE
    submission_uuid uuid;
    studio_uuid uuid;
    total_count integer;
    approved_count integer;
    rejected_count integer;
    edited_count integer;
BEGIN
    -- Get submission and studio info
    IF TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN
        submission_uuid := NEW.submission_id;
        studio_uuid := NEW.studio_id;
    ELSE
        submission_uuid := OLD.submission_id;
        studio_uuid := OLD.studio_id;
    END IF;

    -- Skip if no submission_id
    IF submission_uuid IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Count materials by status for this submission
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE approved_at IS NOT NULL OR rejected_at IS NOT NULL) as edited
    INTO total_count, approved_count, rejected_count, edited_count
    FROM pending_materials 
    WHERE submission_id = submission_uuid;

    -- Insert or update the status tracking
    INSERT INTO pdf_material_status (
        submission_id, 
        studio_id, 
        total_materials_extracted,
        materials_approved,
        materials_rejected,
        materials_edited,
        all_materials_processed,
        updated_at
    ) VALUES (
        submission_uuid,
        studio_uuid,
        total_count,
        approved_count,
        rejected_count,
        edited_count,
        (total_count > 0 AND (approved_count + rejected_count) = total_count),
        now()
    )
    ON CONFLICT (submission_id) 
    DO UPDATE SET
        total_materials_extracted = EXCLUDED.total_materials_extracted,
        materials_approved = EXCLUDED.materials_approved,
        materials_rejected = EXCLUDED.materials_rejected,
        materials_edited = EXCLUDED.materials_edited,
        all_materials_processed = EXCLUDED.all_materials_processed,
        updated_at = now();

    -- Update PDF submission status to complete if all materials are processed
    IF (total_count > 0 AND (approved_count + rejected_count) = total_count) THEN
        UPDATE pdf_submissions 
        SET status = 'completed', updated_at = now()
        WHERE id = submission_uuid;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for pending_materials changes
DROP TRIGGER IF EXISTS trigger_update_pdf_material_status ON pending_materials;
CREATE TRIGGER trigger_update_pdf_material_status
    AFTER INSERT OR UPDATE OR DELETE ON pending_materials
    FOR EACH ROW
    EXECUTE FUNCTION update_pdf_material_status();

-- Create a function to reject materials
CREATE OR REPLACE FUNCTION reject_pending_material(
    material_id uuid,
    rejection_reason_text text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE pending_materials 
    SET 
        status = 'rejected',
        rejected_by = auth.uid(),
        rejected_at = now(),
        rejection_reason = rejection_reason_text,
        updated_at = now()
    WHERE id = material_id;
END;
$$;
