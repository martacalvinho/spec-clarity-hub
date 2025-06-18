
-- Create a function to calculate simple string similarity (Levenshtein-like)
CREATE OR REPLACE FUNCTION public.calculate_similarity(text1 TEXT, text2 TEXT)
RETURNS FLOAT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    len1 INT := LENGTH(text1);
    len2 INT := LENGTH(text2);
    max_len INT := GREATEST(len1, len2);
    distance INT;
BEGIN
    -- Handle edge cases
    IF text1 = text2 THEN
        RETURN 1.0;
    END IF;
    
    IF max_len = 0 THEN
        RETURN 1.0;
    END IF;
    
    -- Simple distance calculation based on character differences
    -- This is a simplified version - for production you might want to use pg_trgm extension
    distance := ABS(len1 - len2);
    
    -- Add character difference penalty
    FOR i IN 1..LEAST(len1, len2) LOOP
        IF SUBSTRING(UPPER(text1), i, 1) != SUBSTRING(UPPER(text2), i, 1) THEN
            distance := distance + 1;
        END IF;
    END LOOP;
    
    -- Return similarity as a percentage
    RETURN GREATEST(0.0, 1.0 - (distance::FLOAT / max_len::FLOAT));
END;
$$;

-- Create function to find similar materials
CREATE OR REPLACE FUNCTION public.find_similar_materials(
    studio_id_param UUID,
    material_name_param TEXT,
    category_param TEXT,
    manufacturer_id_param UUID DEFAULT NULL,
    similarity_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT,
    subcategory TEXT,
    manufacturer_name TEXT,
    manufacturer_id UUID,
    reference_sku TEXT,
    dimensions TEXT,
    similarity_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.name,
        m.category,
        m.subcategory,
        COALESCE(man.name, 'No Manufacturer') as manufacturer_name,
        m.manufacturer_id,
        m.reference_sku,
        m.dimensions,
        calculate_similarity(m.name, material_name_param) as similarity_score
    FROM materials m
    LEFT JOIN manufacturers man ON m.manufacturer_id = man.id
    WHERE 
        m.studio_id = studio_id_param
        AND m.category = category_param
        AND (
            -- Exact manufacturer match if provided
            (manufacturer_id_param IS NULL OR m.manufacturer_id = manufacturer_id_param)
            OR 
            -- Or high name similarity regardless of manufacturer
            calculate_similarity(m.name, material_name_param) >= similarity_threshold
        )
        AND calculate_similarity(m.name, material_name_param) >= similarity_threshold
    ORDER BY similarity_score DESC, m.name
    LIMIT 10;
END;
$$;
