import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UnitToggle } from '@/components/ui/unit-toggle';
import { useUnitToggle } from '@/hooks/useUnitToggle';
import { supabase } from '@/integrations/supabase/client';
import { Search, Package, Upload, Copy, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import AddMaterialForm from '@/components/forms/AddMaterialForm';
import EditMaterialForm from '@/components/forms/EditMaterialForm';
import DeleteMaterialForm from '@/components/forms/DeleteMaterialForm';
import MaterialStatsCards from '@/components/MaterialStatsCards';
import MaterialPhotoUpload from '@/components/MaterialPhotoUpload';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

const Materials = () => {
  const { studioId } = useAuth();
  const { formatArea } = useUnitToggle();
  const { toast } = useToast();
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

  const handleCopyMaterial = async (material: any) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify({
        name: material.name,
        category: material.category,
        subcategory: material.subcategory,
        model: material.model,
        manufacturer: material.manufacturers?.name,
        reference_sku: material.reference_sku,
        dimensions: material.dimensions,
        location: material.location,
        notes: material.notes
      }, null, 2));
      
      toast({
        title: "Material Copied",
        description: "Material details copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy material details",
        variant: "destructive"
      });
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
      
      const matchesProject = projectFilter === 'all' || 
        material.proj_materials?.some((pm: any) => pm.project_id === projectFilter);
      
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

      <MaterialStatsCards />

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
                <Card key={material.id} className="border rounded-lg hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="flex-shrink-0">
                          {material.photo_url ? (
                            <img 
                              src={material.photo_url} 
                              alt={material.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="p-3 bg-coral-100 rounded-lg">
                              <Package className="h-10 w-10 text-coral-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <Link to={`/materials/${material.id}`} className="hover:text-coral">
                            <h3 className="font-semibold text-xl hover:underline mb-2">{material.name}</h3>
                          </Link>
                          
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-6">
                              <span>
                                <span className="font-medium">Category:</span>{' '}
                                <Link 
                                  to={`/materials/category/${encodeURIComponent(material.category)}`}
                                  className="text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  {material.category}
                                </Link>
                              </span>
                              {material.subcategory && (
                                <span>
                                  <span className="font-medium">Subcategory:</span> {material.subcategory}
                                </span>
                              )}
                              {material.model && (
                                <span>
                                  <span className="font-medium">Model:</span> {material.model}
                                </span>
                              )}
                              {material.manufacturers?.name && (
                                <span>
                                  <span className="font-medium">Manufacturer:</span>{' '}
                                  <Link 
                                    to={`/manufacturers/${material.manufacturer_id}`}
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                  >
                                    {material.manufacturers.name}
                                  </Link>
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-6">
                              {material.location && (
                                <span>
                                  <span className="font-medium">Location:</span>{' '}
                                  <button
                                    onClick={() => setSearchTerm(material.location)}
                                    className="text-gray-600 hover:text-coral hover:underline cursor-pointer"
                                  >
                                    {material.location}
                                  </button>
                                </span>
                              )}
                              {material.reference_sku && (
                                <span>
                                  <span className="font-medium">SKU:</span> {material.reference_sku}
                                </span>
                              )}
                              {material.dimensions && (
                                <span>
                                  <span className="font-medium">Dimensions:</span> {material.dimensions}
                                </span>
                              )}
                              {material.users && (
                                <span>
                                  <span className="font-medium">Added by:</span> {material.users.first_name} {material.users.last_name}
                                </span>
                              )}
                            </div>
                            
                            {projects.length > 0 && (
                              <div>
                                <span className="font-medium">Projects:</span>{' '}
                                {projects.map((projMaterial: any, index: number) => (
                                  <span key={projMaterial.project_id}>
                                    <Link 
                                      to={`/projects/${projMaterial.projects.id}`}
                                      className="text-green-600 hover:text-green-800 hover:underline"
                                    >
                                      {projMaterial.projects.name}
                                    </Link>
                                    {projMaterial.projects.clients?.name && (
                                      <span className="text-gray-500">
                                        {' '}(Client: 
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
                            )}
                            
                            {material.notes && (
                              <div>
                                <span className="font-medium">Notes:</span> {material.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <TooltipProvider>
                        <div className="flex items-center gap-1">
                          <MaterialPhotoUpload 
                            materialId={material.id}
                            currentPhotoUrl={material.photo_url}
                            onPhotoUpdated={fetchMaterials}
                          />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => handleCopyMaterial(material)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copy material details</p>
                            </TooltipContent>
                          </Tooltip>
                          <EditMaterialForm material={material} onMaterialUpdated={fetchMaterials} />
                          <DeleteMaterialForm material={material} onMaterialDeleted={fetchMaterials} />
                        </div>
                      </TooltipProvider>
                    </div>
                  </CardContent>
                </Card>
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
