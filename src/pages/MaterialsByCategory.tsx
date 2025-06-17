
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Package } from 'lucide-react';

const MaterialsByCategory = () => {
  const { category } = useParams();
  const { studioId } = useAuth();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (category && studioId) {
      fetchMaterialsByCategory();
    }
  }, [category, studioId]);

  const fetchMaterialsByCategory = async () => {
    try {
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
        .eq('category', decodeURIComponent(category || ''))
        .order('name');

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials by category:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading materials...</div>;
  }

  const decodedCategory = decodeURIComponent(category || '');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/materials">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Materials
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Category: {decodedCategory}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Materials in {decodedCategory}</CardTitle>
          <CardDescription>
            All materials categorized as {decodedCategory}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {materials.map((material) => {
              const projects = material.proj_materials || [];
              const uniqueClients = [...new Set(projects.map(p => p.projects?.clients?.name).filter(Boolean))];
              
              return (
                <div key={material.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-coral-100 rounded-lg">
                      <Package className="h-6 w-6 text-coral-600" />
                    </div>
                    <div className="flex-1">
                      <Link to={`/materials/${material.id}`} className="hover:text-coral">
                        <h3 className="font-semibold text-lg hover:underline">{material.name}</h3>
                      </Link>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        {material.subcategory && (
                          <span>Subcategory: {material.subcategory}</span>
                        )}
                        {material.manufacturers?.name && (
                          <>
                            {material.subcategory && <span>•</span>}
                            <Link 
                              to={`/manufacturers/${material.manufacturer_id}`}
                              className="hover:text-coral hover:underline"
                            >
                              Manufacturer: {material.manufacturers.name}
                            </Link>
                          </>
                        )}
                        <span>• Used in {projects.length} project{projects.length !== 1 ? 's' : ''}</span>
                      </div>
                      
                      {/* Projects and Clients */}
                      {projects.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-2">
                            <div>
                              <span className="text-sm text-gray-600 font-medium">Projects: </span>
                              {projects.map((projMaterial, index) => (
                                <span key={projMaterial.project_id} className="text-sm">
                                  <Link 
                                    to={`/projects/${projMaterial.projects.id}`}
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                  >
                                    {projMaterial.projects.name}
                                  </Link>
                                  {index < projects.length - 1 && <span className="text-gray-400">, </span>}
                                </span>
                              ))}
                            </div>
                          </div>
                          {uniqueClients.length > 0 && (
                            <div className="mt-1">
                              <span className="text-sm text-gray-600 font-medium">Clients: </span>
                              {uniqueClients.map((clientName, index) => {
                                const clientProject = projects.find(p => p.projects?.clients?.name === clientName);
                                return (
                                  <span key={clientName} className="text-sm">
                                    <Link 
                                      to={`/clients/${clientProject?.projects?.client_id}`}
                                      className="text-green-600 hover:text-green-800 hover:underline"
                                    >
                                      {clientName}
                                    </Link>
                                    {index < uniqueClients.length - 1 && <span className="text-gray-400">, </span>}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {material.notes && (
                        <p className="text-sm text-gray-600 mt-2">{material.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {materials.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No materials found in the {decodedCategory} category.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialsByCategory;
