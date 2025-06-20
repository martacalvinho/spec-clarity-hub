
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UnitToggle } from '@/components/ui/unit-toggle';
import { useUnitToggle } from '@/hooks/useUnitToggle';
import { supabase } from '@/integrations/supabase/client';
import { Search, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import AddMaterialForm from '@/components/forms/AddMaterialForm';
import EditMaterialForm from '@/components/forms/EditMaterialForm';
import DeleteMaterialForm from '@/components/forms/DeleteMaterialForm';

const Materials = () => {
  const { studioId } = useAuth();
  const { formatArea } = useUnitToggle();
  const [materials, setMaterials] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [manufacturerFilter, setManufacturerFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest_first');

  useEffect(() => {
    if (studioId) {
      fetchMaterials();
      fetchFilters();
    }
  }, [studioId]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      console.log('Fetching materials for studio:', studioId);
      
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

      if (error) {
        console.error('Error fetching materials:', error);
        throw error;
      }
      
      console.log('Fetched materials:', data?.length || 0);
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [clientsData, projectsData, manufacturersData] = await Promise.all([
        supabase.from('clients').select('id, name').eq('studio_id', studioId).order('name'),
        supabase.from('projects').select('id, name').eq('studio_id', studioId).order('name'),
        supabase.from('manufacturers').select('id, name').eq('studio_id', studioId).order('name')
      ]);

      setClients(clientsData.data || []);
      setProjects(projectsData.data || []);
      setManufacturers(manufacturersData.data || []);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const filteredAndSortedMaterials = materials
    .filter(material => {
      const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.manufacturers?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || material.category === categoryFilter;
      const matchesManufacturer = manufacturerFilter === 'all' || material.manufacturer_id === manufacturerFilter;
      
      // Check project filter
      const matchesProject = projectFilter === 'all' || 
        material.proj_materials?.some((pm: any) => pm.project_id === projectFilter);
      
      // Check client filter
      const matchesClient = clientFilter === 'all' || 
        material.proj_materials?.some((pm: any) => pm.projects?.client_id === clientFilter);
      
      return matchesSearch && matchesCategory && matchesManufacturer && matchesProject && matchesClient;
    })
    .sort((a, b) => {
      if (sortBy === 'newest_first') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'price_high_low') {
        const aPrice = a.price_per_sqft || 0;
        const bPrice = b.price_per_sqft || 0;
        return bPrice - aPrice;
      }
      if (sortBy === 'price_low_high') {
        const aPrice = a.price_per_sqft || 0;
        const bPrice = b.price_per_sqft || 0;
        return aPrice - bPrice;
      }
      // Default alphabetical sorting
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });

  const categories = [...new Set(materials.map(m => m.category))];

  if (loading) {
    return <div className="p-6">Loading materials...</div>;
  }

  if (!studioId) {
    return <div className="p-6">No studio selected</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Materials</h1>
        <div className="flex items-center gap-4">
          <UnitToggle />
          <AddMaterialForm onMaterialAdded={fetchMaterials} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Materials</CardTitle>
              <CardDescription>Manage your material library</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Client..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Project..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Manufacturer..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Manufacturers</SelectItem>
                  {manufacturers.map((manufacturer) => (
                    <SelectItem key={manufacturer.id} value={manufacturer.id}>
                      {manufacturer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest_first">Newest First</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  <SelectItem value="price_high_low">Price: High to Low</SelectItem>
                  <SelectItem value="price_low_high">Price: Low to High</SelectItem>
                </SelectContent>
              </Select>
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAndSortedMaterials.map((material) => {
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
                      <div className="flex items-center gap-4 mt-1">
                        <Badge variant="outline">{material.category}</Badge>
                        {material.subcategory && (
                          <span className="text-sm text-gray-500">• {material.subcategory}</span>
                        )}
                        {material.model && (
                          <span className="text-sm text-gray-500">• Model: {material.model}</span>
                        )}
                        <span className="text-sm text-gray-500">
                          {material.manufacturers?.name || 'No manufacturer'}
                        </span>
                        {material.price_per_sqft && (
                          <span className="text-sm text-green-600 font-medium">
                            ${material.price_per_sqft}/{formatArea(1).split(' ')[1]}
                          </span>
                        )}
                      </div>
                      
                      {/* Additional details */}
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        {material.reference_sku && (
                          <>
                            <span>SKU: {material.reference_sku}</span>
                            <span>•</span>
                          </>
                        )}
                        {material.location && (
                          <>
                            <span>Location: {material.location}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>Added: {new Date(material.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      {/* Projects and Clients */}
                      {projects.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-2">
                            <div>
                              <span className="text-sm text-gray-600 font-medium">Projects: </span>
                              {projects.map((projMaterial: any, index: number) => (
                                <span key={projMaterial.project_id} className="text-sm">
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
                                        className="text-green-600 hover:text-green-800 hover:underline"
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
            {filteredAndSortedMaterials.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || categoryFilter !== 'all' || clientFilter !== 'all' || projectFilter !== 'all' || manufacturerFilter !== 'all'
                  ? 'No materials found matching your filters.' 
                  : 'No materials yet. Add your first material!'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Materials;
