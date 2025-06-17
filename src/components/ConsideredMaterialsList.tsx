
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Package, Copy, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import UserInitials from './UserInitials';
import ApplyToProjectForm from './forms/ApplyToProjectForm';

interface ConsideredMaterialsListProps {
  projectId?: string;
  showProjectFilter?: boolean;
}

const ConsideredMaterialsList = ({ projectId, showProjectFilter = false }: ConsideredMaterialsListProps) => {
  const { studioId } = useAuth();
  const [consideredMaterials, setConsideredMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studioId) {
      fetchConsideredMaterials();
    }
  }, [studioId, projectId]);

  const fetchConsideredMaterials = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('considered_materials')
        .select(`
          *,
          manufacturers(name),
          projects(name)
        `)
        .eq('studio_id', studioId)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch selected materials separately if they exist
      const materialsWithSelected = await Promise.all(
        (data || []).map(async (item) => {
          if (item.selected_material_id) {
            const { data: selectedMaterial } = await supabase
              .from('materials')
              .select('name')
              .eq('id', item.selected_material_id)
              .single();
            
            return {
              ...item,
              selected_material: selectedMaterial
            };
          }
          return item;
        })
      );

      setConsideredMaterials(materialsWithSelected);
    } catch (error) {
      console.error('Error fetching considered materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToNewMaterial = async (consideredMaterial: any) => {
    try {
      const newMaterial = {
        studio_id: studioId,
        name: consideredMaterial.material_name,
        category: consideredMaterial.category,
        subcategory: consideredMaterial.subcategory,
        manufacturer_id: consideredMaterial.manufacturer_id,
        reference_sku: consideredMaterial.reference_sku,
        dimensions: consideredMaterial.dimensions,
        location: consideredMaterial.location,
        photo_url: consideredMaterial.photo_url,
        notes: `Copied from considered material: ${consideredMaterial.notes || ''}`
      };

      const { error } = await supabase
        .from('materials')
        .insert(newMaterial);

      if (error) throw error;

      // Refresh the list
      fetchConsideredMaterials();
    } catch (error) {
      console.error('Error copying to materials:', error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading considered materials...</div>;
  }

  return (
    <div className="space-y-4">
      {consideredMaterials.map((material) => (
        <Card key={material.id} className="border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  {material.photo_url ? (
                    <img 
                      src={material.photo_url} 
                      alt={material.material_name}
                      className="h-12 w-12 object-cover rounded"
                    />
                  ) : (
                    <Package className="h-6 w-6 text-orange-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{material.material_name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span>Category: {material.category}</span>
                    {material.subcategory && <span>• {material.subcategory}</span>}
                    {material.manufacturers?.name && <span>• Manufacturer: {material.manufacturers.name}</span>}
                  </div>
                  {material.reference_sku && (
                    <div className="text-sm text-gray-500 mt-1">
                      SKU: {material.reference_sku}
                    </div>
                  )}
                  {material.dimensions && (
                    <div className="text-sm text-gray-500 mt-1">
                      Dimensions: {material.dimensions}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">Not Selected</Badge>
                    {showProjectFilter && material.projects?.name && (
                      <Badge variant="outline">Project: {material.projects.name}</Badge>
                    )}
                  </div>
                  {material.notes && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                      <strong>Why not chosen:</strong> {material.notes}
                    </div>
                  )}
                  {material.selected_material?.name && (
                    <div className="mt-2 text-sm text-green-600">
                      <strong>Chosen instead:</strong> 
                      <Link to={`/materials/${material.selected_material_id}`} className="hover:underline ml-1">
                        {material.selected_material.name}
                        <ExternalLink className="h-3 w-3 inline ml-1" />
                      </Link>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-400">Evaluated by:</span>
                    <UserInitials userId={material.evaluated_by} size="sm" />
                    <span className="text-xs text-gray-400">
                      {new Date(material.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToNewMaterial(material)}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy to Materials
                </Button>
                {material.manufacturers?.name && material.manufacturer_id && (
                  <Link to={`/manufacturers/${material.manufacturer_id}`}>
                    <Button variant="outline" size="sm">
                      View Manufacturer
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {consideredMaterials.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No considered materials found.
        </div>
      )}
    </div>
  );
};

export default ConsideredMaterialsList;
