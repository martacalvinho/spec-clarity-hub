
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
          <div className="space-y-4">
            {filteredMaterials.map((material) => {
              const projectCount = material.proj_materials?.length || 0;
              const projects = material.proj_materials || [];
              
              return (
                <div key={material.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 bg-coral-100 rounded-lg">
                      <Package className="h-6 w-6 text-coral-600" />
                    </div>
                    <div className="flex-1">
                      <Link to={`/materials/${material.id}`} className="hover:text-coral">
                        <h3 className="font-semibold text-lg hover:underline">{material.name}</h3>
                      </Link>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <Link 
                          to={`/materials/category/${encodeURIComponent(material.category)}`}
                          className="hover:text-coral hover:underline"
                        >
                          Category: {material.category}
                        </Link>
                        {material.manufacturers?.name && (
                          <>
                            <span>•</span>
                            <Link 
                              to={`/manufacturers/${material.manufacturer_id}`}
                              className="hover:text-coral hover:underline"
                            >
                              Manufacturer: {material.manufacturers.name}
                            </Link>
                          </>
                        )}
                        <span>• Used in {projectCount} project{projectCount !== 1 ? 's' : ''}</span>
                      </div>
                      
                      {/* Projects List */}
                      {projects.length > 0 && (
                        <div className="mt-2 text-sm">
                          <span className="text-gray-600 font-medium">Projects: </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {projects.map((projMaterial, index) => (
                              <span key={projMaterial.project_id}>
                                <Link 
                                  to={`/projects/${projMaterial.projects.id}`}
                                  className="text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  {projMaterial.projects.name}
                                </Link>
                                {projMaterial.projects.clients?.name && (
                                  <span className="text-gray-500">
                                    {' '}(
                                    <Link 
                                      to={`/clients/${projMaterial.projects.client_id}`}
                                      className="hover:text-coral hover:underline"
                                    >
                                      {projMaterial.projects.clients.name}
                                    </Link>
                                    )
                                  </span>
                                )}
                                {index < projects.length - 1 && <span className="text-gray-400">, </span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {material.notes && (
                        <p className="text-sm text-gray-600 mt-1">{material.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <EditMaterialForm material={material} onMaterialUpdated={fetchMaterials} />
                    <DeleteMaterialForm material={material} onMaterialDeleted={fetchMaterials} />
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
