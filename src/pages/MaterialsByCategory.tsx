
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Package } from 'lucide-react';

const MaterialsByCategory = () => {
  const { category } = useParams();
  const { studioId } = useAuth();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subcategoryFilter, setSubcategoryFilter] = useState('all');
  const [subcategories, setSubcategories] = useState<string[]>([]);

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
      
      const materialsData = data || [];
      
      // Fetch user information separately for created_by field
      const materialsWithUsers = await Promise.all(
        materialsData.map(async (material) => {
          if (material.created_by) {
            try {
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('first_name, last_name')
                .eq('id', material.created_by)
                .single();
              
              if (!userError && userData) {
                return {
                  ...material,
                  users: userData
                };
              }
            } catch (userError) {
              console.log('Could not fetch user data for material:', material.id);
            }
          }
          return material;
        })
      );
      
      setMaterials(materialsWithUsers);
      
      // Extract unique subcategories
      const uniqueSubcategories = [...new Set(materialsWithUsers.map(m => m.subcategory).filter(Boolean))];
      setSubcategories(uniqueSubcategories);
    } catch (error) {
      console.error('Error fetching materials by category:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = materials.filter(material => {
    if (subcategoryFilter === 'all') return true;
    return material.subcategory === subcategoryFilter;
  });

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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Materials in {decodedCategory}</CardTitle>
              <CardDescription>
                All materials categorized as {decodedCategory}
              </CardDescription>
            </div>
            {subcategories.length > 0 && (
              <div className="w-48">
                <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All subcategories</SelectItem>
                    {subcategories.map((subcategory) => (
                      <SelectItem key={subcategory} value={subcategory}>
                        {subcategory}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMaterials.map((material) => {
              const projects = material.proj_materials || [];
              const uniqueClients = [...new Set(projects.map((p: any) => p.projects?.clients?.name).filter(Boolean))];
              
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
                      
                      {/* Projects, Clients, and Added by information */}
                      <div className="mt-2">
                        <div className="text-sm text-gray-600">
                          {projects.length > 0 && (
                            <>
                              <span className="font-medium">Projects: </span>
                              {projects.map((projMaterial: any, index: number) => (
                                <span key={projMaterial.project_id}>
                                  <Link 
                                    to={`/projects/${projMaterial.projects.id}`}
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                  >
                                    {projMaterial.projects.name}
                                  </Link>
                                  {index < projects.length - 1 && <span className="text-gray-400">, </span>}
                                </span>
                              ))}
                              
                              {/* Show unique clients */}
                              {uniqueClients.length > 0 && (
                                <>
                                  <span className="font-medium"> Client: </span>
                                  {uniqueClients.map((clientName: string, index: number) => {
                                    const clientProject = projects.find((p: any) => p.projects?.clients?.name === clientName);
                                    return (
                                      <span key={clientName}>
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
                                </>
                              )}
                              
                              {material.users && <span> </span>}
                            </>
                          )}
                          
                          {/* Added by information */}
                          {material.users && (
                            <>
                              <span className="font-medium">Added by: </span>
                              <span>{material.users.first_name} {material.users.last_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {material.notes && (
                        <p className="text-sm text-gray-600 mt-2">{material.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredMaterials.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {subcategoryFilter !== 'all' 
                  ? `No materials found in the ${subcategoryFilter} subcategory.`
                  : `No materials found in the ${decodedCategory} category.`
                }
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialsByCategory;
