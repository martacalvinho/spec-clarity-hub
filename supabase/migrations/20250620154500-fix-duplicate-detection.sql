
-- Enhanced duplicate detection that prioritizes SKU + manufacturer matches
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
    WITH pending_material_info AS (
        -- Get the reference SKU from the pending material being checked
        SELECT pm.reference_sku as pending_sku
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
                -- Very high score for exact SKU + manufacturer match (regardless of category)
                WHEN m.manufacturer_id = manufacturer_id_param 
                     AND m.reference_sku IS NOT NULL 
                     AND m.reference_sku != ''
                     AND m.reference_sku = (SELECT pending_sku FROM pending_material_info)
                     AND (SELECT pending_sku FROM pending_material_info) IS NOT NULL
                     AND (SELECT pending_sku FROM pending_material_info) != ''
                THEN 0.98
                
                -- High score for manufacturer match + high name similarity in same/similar category
                WHEN m.manufacturer_id = manufacturer_id_param 
                     AND (
                         LOWER(m.category) = LOWER(category_param)
                         OR LOWER(m.category) = 'wood' AND LOWER(category_param) = 'madeira'
                         OR LOWER(m.category) = 'madeira' AND LOWER(category_param) = 'wood'
                     )
                     AND calculate_similarity(m.name, material_name_param) >= 0.5
                THEN GREATEST(0.8, calculate_similarity(m.name, material_name_param))
                
                -- Medium-high score for same manufacturer + similar name (any category)
                WHEN m.manufacturer_id = manufacturer_id_param 
                     AND calculate_similarity(m.name, material_name_param) >= 0.4
                THEN GREATEST(0.7, calculate_similarity(m.name, material_name_param))
                
                -- Standard name similarity for same category
                WHEN LOWER(m.category) = LOWER(category_param)
                THEN calculate_similarity(m.name, material_name_param)
                
                -- Lower score for cross-category name matches
                ELSE calculate_similarity(m.name, material_name_param) * 0.7
            END as similarity_score
        FROM materials m
        LEFT JOIN manufacturers man ON m.manufacturer_id = man.id
        CROSS JOIN pending_material_info
        WHERE 
            m.studio_id = studio_id_param
            AND (
                -- Same or equivalent category
                LOWER(m.category) = LOWER(category_param)
                OR LOWER(m.category) = 'wood' AND LOWER(category_param) = 'madeira'
                OR LOWER(m.category) = 'madeira' AND LOWER(category_param) = 'wood'
                OR
                -- Or manufacturer + SKU match (cross-category)
                (m.manufacturer_id = manufacturer_id_param 
                 AND m.reference_sku IS NOT NULL 
                 AND m.reference_sku != ''
                 AND m.reference_sku = (SELECT pending_sku FROM pending_material_info)
                 AND (SELECT pending_sku FROM pending_material_info) IS NOT NULL
                 AND (SELECT pending_sku FROM pending_material_info) != '')
                OR
                -- Or same manufacturer with similar names
                (m.manufacturer_id = manufacturer_id_param 
                 AND calculate_similarity(m.name, material_name_param) >= 0.4)
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
