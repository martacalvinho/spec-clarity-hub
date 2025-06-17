
-- Create storage bucket for material photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('material-photos', 'material-photos', true);

-- Create storage policies for material photos
CREATE POLICY "Allow public access to material photos" ON storage.objects
FOR SELECT USING (bucket_id = 'material-photos');

CREATE POLICY "Allow authenticated users to upload material photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'material-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update material photos" ON storage.objects
FOR UPDATE USING (bucket_id = 'material-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete material photos" ON storage.objects
FOR DELETE USING (bucket_id = 'material-photos' AND auth.role() = 'authenticated');
