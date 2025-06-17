
-- Add new optional columns to materials table for enhanced details
ALTER TABLE public.materials 
ADD COLUMN finish_color TEXT,
ADD COLUMN fire_rating TEXT,
ADD COLUMN certifications TEXT,
ADD COLUMN cost_band TEXT CHECK (cost_band IN ('Low', 'Mid', 'High')),
ADD COLUMN product_url TEXT,
ADD COLUMN product_sheet_url TEXT,
ADD COLUMN thumbnail_url TEXT;
