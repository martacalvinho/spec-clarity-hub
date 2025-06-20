
-- Create function to find similar manufacturers
CREATE OR REPLACE FUNCTION public.find_similar_manufacturers(
    studio_id_param uuid,
    manufacturer_name_param text,
    similarity_threshold double precision DEFAULT 0.7
) 
RETURNS TABLE(
    id uuid,
    name text,
    contact_name text,
    email text,
    phone text,
    website text,
    notes text,
    similarity_score double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.name,
        m.contact_name,
        m.email,
        m.phone,
        m.website,
        m.notes,
        calculate_similarity(m.name, manufacturer_name_param) as similarity_score
    FROM manufacturers m
    WHERE 
        m.studio_id = studio_id_param
        AND calculate_similarity(m.name, manufacturer_name_param) >= similarity_threshold
    ORDER BY similarity_score DESC, m.name
    LIMIT 10;
END;
$$;
