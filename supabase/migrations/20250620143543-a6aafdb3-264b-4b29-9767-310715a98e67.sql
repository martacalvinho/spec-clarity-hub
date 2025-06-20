
-- Fix duplicate detection to properly prioritize SKU + manufacturer matches
CREATE OR REPLACE FUNCTION public.find_similar_materials(
    studio_id_param UUID,
    material_name_param TEXT,
    category_param TEXT,
    manufacturer_id_param UUID DEFAULT NULL,
    similarity_threshold FLOAT DEFAULT 0.6
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
    WITH pending_sku AS (
        -- Get the SKU from pending material
        SELECT pm.reference_sku as sku
        FROM pending_materials pm 
        WHERE pm.name = material_name_param 
        AND pm.category = category_param 
        AND pm.studio_id = studio_id_param
        LIMIT 1
    ),
    material_scores AS (
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
                -- HIGHEST PRIORITY: Exact SKU + manufacturer match
                WHEN m.manufacturer_id = manufacturer_id_param 
                     AND m.reference_sku IS NOT NULL 
                     AND m.reference_sku != ''
                     AND (SELECT sku FROM pending_sku) IS NOT NULL
                     AND (SELECT sku FROM pending_sku) != ''
                     AND TRIM(UPPER(m.reference_sku)) = TRIM(UPPER((SELECT sku FROM pending_sku)))
                THEN 0.99
                
                -- High score for manufacturer + name similarity in same category
                WHEN m.manufacturer_id = manufacturer_id_param 
                     AND LOWER(m.category) = LOWER(category_param)
                     AND calculate_similarity(m.name, material_name_param) >= 0.7
                THEN 0.85
                
                -- Medium score for manufacturer + name similarity cross-category
                WHEN m.manufacturer_id = manufacturer_id_param 
                     AND calculate_similarity(m.name, material_name_param) >= 0.6
                THEN 0.75
                
                -- Standard name similarity for same category
                WHEN LOWER(m.category) = LOWER(category_param)
                     AND calculate_similarity(m.name, material_name_param) >= similarity_threshold
                THEN calculate_similarity(m.name, material_name_param)
                
                -- Lower score for cross-category name matches
                WHEN calculate_similarity(m.name, material_name_param) >= 0.8
                THEN calculate_similarity(m.name, material_name_param) * 0.7
                
                ELSE 0.0
            END as similarity_score
        FROM materials m
        LEFT JOIN manufacturers man ON m.manufacturer_id = man.id
        CROSS JOIN pending_sku
        WHERE 
            m.studio_id = studio_id_param
            AND (
                -- SKU + manufacturer match (highest priority)
                (m.manufacturer_id = manufacturer_id_param 
                 AND m.reference_sku IS NOT NULL 
                 AND m.reference_sku != ''
                 AND (SELECT sku FROM pending_sku) IS NOT NULL
                 AND (SELECT sku FROM pending_sku) != ''
                 AND TRIM(UPPER(m.reference_sku)) = TRIM(UPPER((SELECT sku FROM pending_sku))))
                OR
                -- Manufacturer + good name similarity
                (m.manufacturer_id = manufacturer_id_param 
                 AND calculate_similarity(m.name, material_name_param) >= 0.6)
                OR
                -- Same category + good name similarity
                (LOWER(m.category) = LOWER(category_param)
                 AND calculate_similarity(m.name, material_name_param) >= similarity_threshold)
                OR
                -- Very high name similarity regardless of category
                (calculate_similarity(m.name, material_name_param) >= 0.8)
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
    WHERE ms.similarity_score > 0
    ORDER BY ms.similarity_score DESC, ms.name
    LIMIT 10;
END;
$$;
