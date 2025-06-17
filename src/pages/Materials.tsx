import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMaterialLimits } from '@/hooks/useMaterialLimits';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { Search, Package, X, Filter, AlertTriangle, Settings, Camera, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import AddMaterialForm from '@/components/forms/AddMaterialForm';
import EditMaterialForm from '@/components/forms/EditMaterialForm';
import ApplyToProjectForm from '@/components/forms/ApplyToProjectForm';
import MaterialPricingInput from '@/components/MaterialPricingInput';
import MaterialStatsCards from '@/components/MaterialStatsCards';
import MaterialPhotoUpload from '@/components/MaterialPhotoUpload';
import ConsideredMaterialsList from '@/components/ConsideredMaterialsList';
import UserInitials from '@/components/UserInitials';
import AddConsideredMaterialForm from '@/components/forms/AddConsideredMaterialForm';
import { useToast } from '@/hooks/use-toast';
import DeleteMaterialForm from '@/components/forms/DeleteMaterialForm';

const Materials = () => {
  const { studioId } = useAuth();
  const { canAddMaterial } = useMaterialLimits();
  const { toast } = useToast();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [manufacturerFilter, setManufacturerFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subcategoryFilter, setSubcategoryFilter] = useState('');
  
  // Filter options
  const [projects, setProjects] = useState<any[]>([]);
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);

  useEffect(() => {
    if (studioId) {
      fetchMaterials();
      fetchFilterOptions();
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
              name,
              client_id,
              clients(name)
            )
          )
        `)
        .eq('studio_id', studioId)
        .order('name', { ascending: true }); // Sort alphabetically by name

      if (error) throw error;
      
      const materialsData = data || [];
      setMaterials(materialsData);
      
      // Extract unique categories and subcategories
      const uniqueCategories = [...new Set(materialsData.map(m => m.category).filter(Boolean))];
      const uniqueSubcategories = [...new Set(materialsData.map(m => m.subcategory).filter(Boolean))];
      
      setCategories(uniqueCategories);
      setSubcategories(uniqueSubcategories);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name')
        .eq('studio_id', studioId)
        .order('name');

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      // Fetch manufacturers
      const { data: manufacturersData, error: manufacturersError } = await supabase
        .from('manufacturers')
        .select('id, name')
        .eq('studio_id', studioId)
        .order('name');

      if (manufacturersError) throw manufacturersError;
      setManufacturers(manufacturersData || []);

      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name')
        .eq('studio_id', studioId)
        .order('name');

      if (clientsError) throw clientsError;
      setClients(clientsData || []);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const checkForDuplicates = async () => {
    setCheckingDuplicates(true);
    try {
      const materialsWithSku = materials.filter(m => m.reference_sku && m.reference_sku.trim() !== '');
      
      const duplicateGroups = new Map();
      const duplicateIds = new Set();
      
      materialsWithSku.forEach(material => {
        const sku = material.reference_sku.trim().toLowerCase();
        if (!duplicateGroups.has(sku)) {
          duplicateGroups.set(sku, []);
        }
        duplicateGroups.get(sku).push(material);
      });
      
      const duplicatesList: any[] = [];
      duplicateGroups.forEach((group, sku) => {
        if (group.length > 1) {
          group.forEach((material: any) => {
            duplicateIds.add(material.id);
            duplicatesList.push({
              ...material,
              duplicateSku: sku,
              duplicateCount: group.length
            });
          });
        }
      });
      
      setDuplicates(duplicatesList);
      
      if (duplicatesList.length > 0) {
        toast({
          title: "Duplicates Found",
          description: `Found ${duplicatesList.length} materials with duplicate reference SKUs`,
          variant: "default"
        });
        setShowDuplicatesOnly(true);
      } else {
        toast({
          title: "No Duplicates",
          description: "No duplicate reference SKUs found in your materials",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      toast({
        title: "Error",
        description: "Failed to check for duplicates. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const clearDuplicateFilter = () => {
    setShowDuplicatesOnly(false);
    setDuplicates([]);
  };

  const filteredMaterials = materials.filter(material => {
    if (showDuplicatesOnly) {
      const isDuplicate = duplicates.some(dup => dup.id === material.id);
      if (!isDuplicate) return false;
    }

    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.reference_sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.dimensions?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.manufacturers?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProject = !projectFilter || projectFilter === 'all' ||
      material.proj_materials?.some((pm: any) => pm.project_id === projectFilter);

    const matchesManufacturer = !manufacturerFilter || manufacturerFilter === 'all' ||
      material.manufacturer_id === manufacturerFilter;

    const matchesClient = !clientFilter || clientFilter === 'all' ||
      material.proj_materials?.some((pm: any) => pm.projects?.client_id === clientFilter);

    const matchesLocation = !locationFilter ||
      material.location?.toLowerCase().includes(locationFilter.toLowerCase());

    const matchesCategory = !categoryFilter || categoryFilter === 'all' ||
      material.category === categoryFilter;

    const matchesSubcategory = !subcategoryFilter || subcategoryFilter === 'all' ||
      material.subcategory === subcategoryFilter;

    return matchesSearch && matchesProject && matchesManufacturer && matchesClient && 
           matchesLocation && matchesCategory && matchesSubcategory;
  });

  const clearFilters = () => {
    setProjectFilter('');
    setManufacturerFilter('');
    setClientFilter('');
    setLocationFilter('');
    setCategoryFilter('');
    setSubcategoryFilter('');
  };

  const hasActiveFilters = projectFilter && projectFilter !== 'all' || 
                          manufacturerFilter && manufacturerFilter !== 'all' || 
                          clientFilter && clientFilter !== 'all' ||
                          locationFilter ||
                          categoryFilter && categoryFilter !== 'all' ||
                          subcategoryFilter && subcategoryFilter !== 'all';

  const parseLocations = (locationString: string | null) => {
    if (!locationString) return [];
    return locationString.split(',').map(loc => loc.trim()).filter(loc => loc.length > 0);
  };

  const handleLocationClick = (location: string) => {
    if (locationFilter === location) {
      setLocationFilter('');
    } else {
      setLocationFilter(location);
    }
  };

  const handlePhotoUpdated = (materialId: string, photoUrl: string | null) => {
    setMaterials(prev => prev.map(material => 
      material.id === materialId 
        ? { ...material, photo_url: photoUrl }
        : material
    ));
  };

  if (loading) {
    return <div className="p-6">Loading materials...</div>;
  }

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Materials Library</h1>
          <div className="flex items-center gap-2">
            {!canAddMaterial && (
              <p className="text-sm text-gray-500">
                Material limit reached for this month
              </p>
            )}
            <Button
              onClick={() => setAdvancedMode(!advancedMode)}
              variant={advancedMode ? "default" : "outline"}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Advanced
            </Button>
            <AddMaterialForm onMaterialAdded={fetchMaterials} />
          </div>
        </div>

        <MaterialStatsCards />

        <Tabs defaultValue="materials" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="materials">All Materials</TabsTrigger>
            <TabsTrigger value="duplicates" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Check for Duplicates
            </TabsTrigger>
            <TabsTrigger value="outtakes">Outtakes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="materials">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Materials</CardTitle>
                    <CardDescription>
                      Manage your materials library
                      {advancedMode && <span className="text-blue-600"> • Advanced pricing mode enabled</span>}
                    </CardDescription>
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
                {/* Filter Section */}
                <div className="mb-6 space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Filters</span>
                    {showDuplicatesOnly && (
                      <Badge variant="destructive" className="text-xs">
                        Showing {duplicates.length} duplicates
                        <button
                          onClick={clearDuplicateFilter}
                          className="ml-1 hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-6 px-2 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear all
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Project Filter */}
                    <div>
                      <Select value={projectFilter || 'all'} onValueChange={setProjectFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by project" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All projects</SelectItem>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Manufacturer Filter */}
                    <div>
                      <Select value={manufacturerFilter || 'all'} onValueChange={setManufacturerFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by manufacturer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All manufacturers</SelectItem>
                          {manufacturers.map((manufacturer) => (
                            <SelectItem key={manufacturer.id} value={manufacturer.id}>
                              {manufacturer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Client Filter */}
                    <div>
                      <Select value={clientFilter || 'all'} onValueChange={setClientFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by client" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All clients</SelectItem>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Category Filter */}
                    <div>
                      <Select value={categoryFilter || 'all'} onValueChange={setCategoryFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All categories</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Subcategory Filter */}
                    <div>
                      <Select value={subcategoryFilter || 'all'} onValueChange={setSubcategoryFilter}>
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
                  </div>

                  {/* Active Filters Display */}
                  {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2">
                      {projectFilter && projectFilter !== 'all' && (
                        <Badge variant="secondary" className="text-xs">
                          Project: {projects.find(p => p.id === projectFilter)?.name}
                          <button
                            onClick={() => setProjectFilter('all')}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      {manufacturerFilter && manufacturerFilter !== 'all' && (
                        <Badge variant="secondary" className="text-xs">
                          Manufacturer: {manufacturers.find(m => m.id === manufacturerFilter)?.name}
                          <button
                            onClick={() => setManufacturerFilter('all')}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      {clientFilter && clientFilter !== 'all' && (
                        <Badge variant="secondary" className="text-xs">
                          Client: {clients.find(c => c.id === clientFilter)?.name}
                          <button
                            onClick={() => setClientFilter('all')}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      {categoryFilter && categoryFilter !== 'all' && (
                        <Badge variant="secondary" className="text-xs">
                          Category: {categoryFilter}
                          <button
                            onClick={() => setCategoryFilter('all')}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      {subcategoryFilter && subcategoryFilter !== 'all' && (
                        <Badge variant="secondary" className="text-xs">
                          Subcategory: {subcategoryFilter}
                          <button
                            onClick={() => setSubcategoryFilter('all')}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      {locationFilter && (
                        <Badge variant="secondary" className="text-xs">
                          Location: {locationFilter}
                          <button
                            onClick={() => setLocationFilter('')}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {filteredMaterials.map((material) => {
                    const projectCount = material.proj_materials?.length || 0;
                    const clientName = material.proj_materials?.[0]?.projects?.clients?.name;
                    const locations = parseLocations(material.location);
                    const isDuplicate = duplicates.some(dup => dup.id === material.id);
                    const duplicateInfo = duplicates.find(dup => dup.id === material.id);
                    
                    return (
                      <div key={material.id} className="space-y-0">
                        <div 
                          className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 ${
                            isDuplicate ? 'border-red-200 bg-red-50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            {/* Photo or Package Icon */}
                            <div className={`p-2 rounded-lg ${isDuplicate ? 'bg-red-100' : 'bg-coral-100'}`}>
                              {material.photo_url ? (
                                <img 
                                  src={material.photo_url} 
                                  alt={material.name}
                                  className="h-12 w-12 object-cover rounded"
                                />
                              ) : (
                                <Package className={`h-6 w-6 ${isDuplicate ? 'text-red-600' : 'text-coral-600'}`} />
                              )}
                            </div>
                            <div className="flex-1">
                              <Link to={`/materials/${material.id}`} className="hover:text-coral">
                                <h3 className="font-semibold text-lg">{material.name}</h3>
                              </Link>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                <span>Category: {material.category}</span>
                                {material.subcategory && <span>• {material.subcategory}</span>}
                                <span>• Manufacturer: {material.manufacturers?.name || 'None'}</span>
                                <span>• Used in {projectCount} project{projectCount !== 1 ? 's' : ''}</span>
                                {clientName && <span>• Client: {clientName}</span>}
                              </div>
                              {(material.reference_sku || material.dimensions) && (
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                  {material.reference_sku && (
                                    <span className={isDuplicate ? 'text-red-600 font-medium' : ''}>
                                      SKU: {material.reference_sku}
                                      {isDuplicate && (
                                        <span className="ml-1 text-red-500">
                                          (Duplicate - {duplicateInfo?.duplicateCount} total)
                                        </span>
                                      )}
                                    </span>
                                  )}
                                  {material.dimensions && <span>• Dimensions: {material.dimensions}</span>}
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                {material.tag && (
                                  <Badge variant="secondary" className="text-xs">
                                    {material.tag}
                                  </Badge>
                                )}
                                {locations.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    {locations.map((location, index) => (
                                      <Badge 
                                        key={index} 
                                        variant={locationFilter === location ? "default" : "outline"} 
                                        className="text-xs cursor-pointer hover:bg-gray-200"
                                        onClick={() => handleLocationClick(location)}
                                      >
                                        📍 {location}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                {advancedMode && (material.price_per_sqft || material.price_per_unit) && (
                                  <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                                    {material.unit_type === 'sqft' 
                                      ? `$${material.price_per_sqft}/sqft` 
                                      : `$${material.price_per_unit}/unit`
                                    }
                                  </Badge>
                                )}
                              </div>
                              {material.notes && (
                                <p className="text-sm text-gray-600 mt-1">{material.notes}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <MaterialPhotoUpload 
                                    materialId={material.id}
                                    currentPhotoUrl={material.photo_url}
                                    onPhotoUpdated={(photoUrl) => handlePhotoUpdated(material.id, photoUrl)}
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Upload or update material photo</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <ApplyToProjectForm material={material} onMaterialUpdated={fetchMaterials} />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Apply material to a project</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <EditMaterialForm material={material} onMaterialUpdated={fetchMaterials} />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit material details</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <DeleteMaterialForm material={material} onMaterialDeleted={fetchMaterials} />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Move material to outtakes</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                        {advancedMode && (
                          <MaterialPricingInput 
                            material={material} 
                            onPricingUpdated={fetchMaterials}
                          />
                        )}
                      </div>
                    );
                  })}
                  {filteredMaterials.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {showDuplicatesOnly 
                        ? 'No duplicate materials found.' 
                        : searchTerm || hasActiveFilters 
                        ? 'No materials found matching your search or filters.' 
                        : 'No materials yet. Create your first material!'
                      }
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="duplicates">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Duplicate Detection
                </CardTitle>
                <CardDescription>
                  Check for materials with duplicate reference SKUs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button
                    onClick={checkForDuplicates}
                    disabled={checkingDuplicates || materials.length === 0}
                    className="flex items-center gap-2"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    {checkingDuplicates ? 'Checking...' : 'Check for Duplicates'}
                  </Button>
                  
                  {duplicates.length > 0 && (
                    <div className="space-y-4">
                      {filteredMaterials.filter(material => 
                        duplicates.some(dup => dup.id === material.id)
                      ).map((material) => {
                        const duplicateInfo = duplicates.find(dup => dup.id === material.id);
                        return (
                          <div key={material.id} className="p-4 border border-red-200 bg-red-50 rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-red-100 rounded-lg">
                                {material.photo_url ? (
                                  <img 
                                    src={material.photo_url} 
                                    alt={material.name}
                                    className="h-12 w-12 object-cover rounded"
                                  />
                                ) : (
                                  <Package className="h-6 w-6 text-red-600" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{material.name}</h3>
                                <div className="text-sm text-gray-600">
                                  SKU: {material.reference_sku}
                                  <span className="ml-2 text-red-600 font-medium">
                                    (Found {duplicateInfo?.duplicateCount} materials with this SKU)
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="outtakes">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Outtakes</CardTitle>
                    <CardDescription>
                      Materials that were considered but not selected for projects
                    </CardDescription>
                  </div>
                  <AddConsideredMaterialForm />
                </div>
              </CardHeader>
              <CardContent>
                <ConsideredMaterialsList showProjectFilter={true} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
};

export default Materials;
