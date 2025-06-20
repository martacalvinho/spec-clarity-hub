
-- Improve the find_similar_materials function to better detect duplicates
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
    WITH material_scores AS (
        SELECT 
            m.id,
            m.name,
            m.category,
            m.subcategory,
            COALESCE(man.name, 'No Manufacturer') as manufacturer_name,
            m.manufacturer_id,
            m.reference_sku,
            m.dimensions,
            CASE 
                -- High score for exact manufacturer + SKU match
                WHEN m.manufacturer_id = manufacturer_id_param 
                     AND m.reference_sku IS NOT NULL 
                     AND m.reference_sku = (
                         SELECT pm.reference_sku 
                         FROM pending_materials pm 
                         WHERE pm.name = material_name_param 
                         AND pm.category = category_param 
                         LIMIT 1
                     ) THEN 0.95
                -- High score for manufacturer match + high name similarity
                WHEN m.manufacturer_id = manufacturer_id_param 
                     AND calculate_similarity(m.name, material_name_param) >= 0.6 THEN
                    GREATEST(0.8, calculate_similarity(m.name, material_name_param))
                -- Standard name similarity
                ELSE calculate_similarity(m.name, material_name_param)
            END as similarity_score
        FROM materials m
        LEFT JOIN manufacturers man ON m.manufacturer_id = man.id
        WHERE 
            m.studio_id = studio_id_param
            AND (
                -- Same category
                m.category = category_param
                OR
                -- Or manufacturer + SKU match (cross-category)
                (m.manufacturer_id = manufacturer_id_param 
                 AND m.reference_sku IS NOT NULL 
                 AND m.reference_sku = (
                     SELECT pm.reference_sku 
                     FROM pending_materials pm 
                     WHERE pm.name = material_name_param 
                     AND pm.category = category_param 
                     LIMIT 1
                 ))
            )
    )
    SELECT 
        ms.id,
        ms.name,
        ms.category,
        ms.subcategory,
        ms.manufacturer_name,
        ms.manufacturer_id,
        ms.reference_sku,
        ms.dimensions,
        ms.similarity_score
    FROM material_scores ms
    WHERE ms.similarity_score >= similarity_threshold
    ORDER BY ms.similarity_score DESC, ms.name
    LIMIT 10;
END;
$$;
