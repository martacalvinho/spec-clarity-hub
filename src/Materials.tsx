
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, Package } from 'lucide-react';
import AddMaterialForm from '@/components/forms/AddMaterialForm';
import EditMaterialForm from '@/components/forms/EditMaterialForm';
import DeleteMaterialForm from '@/components/forms/DeleteMaterialForm';
import { Link } from 'react-router-dom';

const Materials = () => {
  const { studioId } = useAuth();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (studioId) {
      fetchMaterials();
    }
  }, [studioId]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('materials')
        .select(`
          *,
          manufacturers(name),
          users!materials_created_by_fkey(first_name, last_name),
          proj_materials(
            project_id, 
            projects(
              id,
              name,
              client_id,
              clients(name)
            )
          )
        `)
        .eq('studio_id', studioId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = materials.filter(material =>
    material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.manufacturers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-6">Loading materials...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Materials Library</h1>
        <AddMaterialForm onMaterialAdded={fetchMaterials} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Materials</CardTitle>
              <CardDescription>Manage your materials library</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredMaterials.map((material) => {
              const projects = material.proj_materials || [];
              
              return (
                <div key={material.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-2 bg-coral-100 rounded-lg flex-shrink-0">
                        <Package className="h-5 w-5 text-coral-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Main material info - clean hierarchy */}
                        <Link to={`/materials/${material.id}`} className="hover:text-coral">
                          <h3 className="font-semibold text-lg text-gray-900 hover:underline truncate">
                            {material.name}
                          </h3>
                        </Link>
                        
                        {/* Secondary info line - model and reference */}
                        <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                          {material.model && (
                            <span className="font-medium">Model: {material.model}</span>
                          )}
                          {material.reference_sku && (
                            <>
                              {material.model && <span>•</span>}
                              <span>REF: {material.reference_sku}</span>
                            </>
                          )}
                        </div>

                        {/* Category and manufacturer line */}
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                          <Link 
                            to={`/materials/category/${encodeURIComponent(material.category)}`}
                            className="hover:text-coral hover:underline"
                          >
                            {material.category}
                          </Link>
                          {material.manufacturers?.name && (
                            <>
                              <span>•</span>
                              <Link 
                                to={`/manufacturers/${material.manufacturer_id}`}
                                className="hover:text-coral hover:underline"
                              >
                                {material.manufacturers.name}
                              </Link>
                            </>
                          )}
                        </div>
                        
                        {/* Projects - simplified */}
                        {projects.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-xs">
                              {projects.length} project{projects.length !== 1 ? 's' : ''}
                            </Badge>
                            {projects.slice(0, 2).map((projMaterial: any) => (
                              <Badge key={projMaterial.project_id} variant="outline" className="text-xs">
                                <Link 
                                  to={`/projects/${projMaterial.projects.id}`}
                                  className="hover:underline"
                                >
                                  {projMaterial.projects.name}
                                </Link>
                              </Badge>
                            ))}
                            {projects.length > 2 && (
                              <Badge variant="outline" className="text-xs text-gray-500">
                                +{projects.length - 2} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <EditMaterialForm material={material} onMaterialUpdated={fetchMaterials} />
                      <DeleteMaterialForm material={material} onMaterialDeleted={fetchMaterials} />
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredMaterials.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No materials found matching your search.' : 'No materials yet. Create your first material!'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Materials;
