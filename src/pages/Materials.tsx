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
import { Search, Package, X, Filter, AlertTriangle, Settings, Camera, Upload } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import AddMaterialForm from '@/components/forms/AddMaterialForm';
import EditMaterialForm from '@/components/forms/EditMaterialForm';
import ApplyToProjectForm from '@/components/forms/ApplyToProjectForm';
import MaterialPricingInput from '@/components/MaterialPricingInput';
import MaterialStatsCards from '@/components/MaterialStatsCards';
import MaterialPhotoUpload from '@/components/MaterialPhotoUpload';
import ConsideredMaterialsList from '@/components/ConsideredMaterialsList';
import UserInitials from '@/components/UserInitials';
import PDFMaterialExtractorForm from '@/components/forms/PDFMaterialExtractorForm';
import { useToast } from '@/hooks/use-toast';
import DeleteMaterialForm from '@/components/forms/DeleteMaterialForm';
import AddConsideredMaterialForm from '@/components/forms/AddConsideredMaterialForm';

const Materials = () => {
  const { studioId } = useAuth();
  const { canAddMaterial } = useMaterialLimits();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  const [showPDFUpload, setShowPDFUpload] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [manufacturerFilter, setManufacturerFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subcategoryFilter, setSubcategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('alphabetical');
  
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

  useEffect(() => {
    // Check for sortBy query parameter and set it
    const sortByParam = searchParams.get('sortBy');
    if (sortByParam === 'most_projects') {
      setSortBy('most_projects');
    }
  }, [searchParams]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      
      // Simplified query for better performance
      const { data, error } = await supabase
        .from('materials')
        .select(`
          id,
          name,
          model,
          category,
          subcategory,
          reference_sku,
          dimensions,
          location,
          tag,
          photo_url,
          price_per_sqft,
          price_per_unit,
          unit_type,
          total_area,
          total_units,
          notes,
          created_by,
          manufacturer_id,
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
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching materials:', error);
        throw error;
      }
      
      const materialsData = data || [];
      
      // Batch fetch user information for better performance
      const userIds = [...new Set(materialsData.map(m => m.created_by).filter(Boolean))];
      const usersMap = new Map();
      
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .in('id', userIds);
        
        if (!usersError && usersData) {
          usersData.forEach(user => {
            usersMap.set(user.id, user);
          });
        }
      }
      
      // Map user data to materials
      const materialsWithUsers = materialsData.map(material => ({
        ...material,
        users: material.created_by ? usersMap.get(material.created_by) : null
      }));
      
      setMaterials(materialsWithUsers);
      
      // Extract unique categories and subcategories
      const uniqueCategories = [...new Set(materialsWithUsers.map(m => m.category).filter(Boolean))];
      const uniqueSubcategories = [...new Set(materialsWithUsers.map(m => m.subcategory).filter(Boolean))];
      
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
      material.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
  }).sort((a, b) => {
    if (sortBy === 'most_projects') {
      const aProjectCount = a.proj_materials?.length || 0;
      const bProjectCount = b.proj_materials?.length || 0;
      return bProjectCount - aProjectCount;
    }
    // Default alphabetical sorting
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
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
            onClick={() => setShowPDFUpload(!showPDFUpload)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload PDF
          </Button>
          <Button
            onClick={checkForDuplicates}
            disabled={checkingDuplicates || materials.length === 0}
            variant="outline"
            className="flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            {checkingDuplicates ? 'Checking...' : 'Check Duplicates'}
          </Button>
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

      {/* PDF Upload Section */}
      {showPDFUpload && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Material Schedule PDF
                </CardTitle>
                <CardDescription>
                  Upload a PDF material schedule and let our AI automatically extract all materials, 
                  manufacturers, and specifications. Review and approve before importing.
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowPDFUpload(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 p-6 rounded-lg">
              <Upload className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">AI-Powered PDF Extraction</h3>
              <p className="text-gray-600 mb-4 text-center">
                Upload a PDF material schedule and let our AI automatically extract all materials, 
                manufacturers, and specifications. Review and approve before importing.
              </p>
              <PDFMaterialExtractorForm />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Duplicates Section */}
      {(showDuplicatesOnly || duplicates.length > 0) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Duplicate Materials Found
                </CardTitle>
                <CardDescription>
                  Materials with duplicate reference SKUs
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearDuplicateFilter}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="materials">All Materials</TabsTrigger>
          <TabsTrigger value="not-used">Outtakes</TabsTrigger>
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
                <div className="flex items-center gap-4">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alphabetical">Alphabetical</SelectItem>
                      <SelectItem value="most_projects">Most Projects</SelectItem>
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
                  const projects = material.proj_materials || [];
                  const locations = parseLocations(material.location);
                  const isDuplicate = duplicates.some(dup => dup.id === material.id);
                  const duplicateInfo = duplicates.find(dup => dup.id === material.id);
                  
                  return (
                    <div key={material.id} className="space-y-0">
                      <div 
                        className={`flex items-center justify-between p-6 border rounded-lg hover:bg-gray-50 relative ${
                          isDuplicate ? 'border-red-200 bg-red-50' : ''
                        }`}
                      >
                        {/* Action icons - fixed positioning in top right */}
                        <TooltipProvider>
                          <div className="absolute top-4 right-4 flex items-center gap-1">
                            <MaterialPhotoUpload 
                              materialId={material.id}
                              currentPhotoUrl={material.photo_url}
                              onPhotoUpdated={(photoUrl) => handlePhotoUpdated(material.id, photoUrl)}
                            />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <ApplyToProjectForm material={material} onMaterialUpdated={fetchMaterials} />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copy material to project</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <EditMaterialForm material={material} onMaterialUpdated={fetchMaterials} />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit material</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <DeleteMaterialForm material={material} onMaterialDeleted={fetchMaterials} />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete material</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>

                        <div className="flex items-start gap-6 flex-1 pr-32">
                          {/* Photo or Package Icon */}
                          <div className={`p-2 rounded-lg flex-shrink-0 ${isDuplicate ? 'bg-red-100' : 'bg-coral-100'}`}>
                            {material.photo_url ? (
                              <img 
                                src={material.photo_url} 
                                alt={material.name}
                                className="h-16 w-16 object-cover rounded"
                              />
                            ) : (
                              <Package className={`h-8 w-8 ${isDuplicate ? 'text-red-600' : 'text-coral-600'}`} />
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Material Name */}
                            <div className="mb-3">
                              <Link to={`/materials/${material.id}`} className="hover:text-coral">
                                <h3 className="font-semibold text-xl text-gray-900 hover:underline leading-tight">
                                  {material.name}
                                </h3>
                              </Link>
                            </div>
                            
                            {/* Main Info Line */}
                            <div className="mb-2">
                              <div className="flex items-center gap-2 text-sm text-gray-700 flex-wrap">
                                <span className="font-medium">Category:</span>
                                <Link 
                                  to={`/materials/category/${encodeURIComponent(material.category)}`}
                                  className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                >
                                  {material.category}
                                </Link>
                                {material.subcategory && (
                                  <>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-gray-600">{material.subcategory}</span>
                                  </>
                                )}
                                {material.model && (
                                  <>
                                    <span className="text-gray-400">•</span>
                                    <span className="font-medium">Model:</span>
                                    <span className="text-gray-900 font-medium">{material.model}</span>
                                  </>
                                )}
                                {material.manufacturers?.name && (
                                  <>
                                    <span className="text-gray-400">•</span>
                                    <span className="font-medium">Manufacturer:</span>
                                    <Link 
                                      to={`/manufacturers/${material.manufacturer_id}`}
                                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                    >
                                      {material.manufacturers.name}
                                    </Link>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {/* Projects and Client Info */}
                            {(projects.length > 0 || material.users) && (
                              <div className="mb-2">
                                <div className="text-sm text-gray-600">
                                  {projects.length > 0 && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-medium text-gray-700">Projects:</span>
                                      {projects.map((projMaterial: any, index: number) => (
                                        <span key={projMaterial.project_id} className="flex items-center gap-1">
                                          <Link 
                                            to={`/projects/${projMaterial.projects.id}`}
                                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                          >
                                            {projMaterial.projects.name}
                                          </Link>
                                          {index < projects.length - 1 && <span className="text-gray-400">,</span>}
                                        </span>
                                      ))}
                                      
                                      {/* Show unique clients */}
                                      {(() => {
                                        const uniqueClients = [...new Set(projects.map((p: any) => p.projects?.clients?.name).filter(Boolean))];
                                        if (uniqueClients.length > 0) {
                                          return (
                                            <div className="flex items-center gap-2 ml-2">
                                              <span className="font-medium text-gray-700">Client:</span>
                                              {uniqueClients.map((clientName: string, index: number) => {
                                                const clientProject = projects.find((p: any) => p.projects?.clients?.name === clientName);
                                                return (
                                                  <span key={clientName} className="flex items-center gap-1">
                                                    <Link 
                                                      to={`/clients/${clientProject?.projects?.client_id}`}
                                                      className="text-green-600 hover:text-green-800 hover:underline font-medium"
                                                    >
                                                      {clientName}
                                                    </Link>
                                                    {index < uniqueClients.length - 1 && <span className="text-gray-400">,</span>}
                                                  </span>
                                                );
                                              })}
                                            </div>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </div>
                                  )}
                                  
                                  {/* Added by information */}
                                  {material.users && (
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="font-medium text-gray-700">Added by:</span>
                                      <span className="text-gray-600">{material.users.first_name} {material.users.last_name}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* SKU and Dimensions */}
                            {(material.reference_sku || material.dimensions) && (
                              <div className="mb-3">
                                <div className="flex items-center gap-4 text-sm">
                                  {material.reference_sku && (
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium text-gray-700">SKU:</span>
                                      <span className={`font-mono ${isDuplicate ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
                                        {material.reference_sku}
                                        {isDuplicate && (
                                          <span className="ml-2 text-red-500 font-normal">
                                            (Duplicate - {duplicateInfo?.duplicateCount} total)
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  )}
                                  {material.dimensions && (
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium text-gray-700">Dimensions:</span>
                                      <span className="text-gray-900">{material.dimensions}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Tags and Badges */}
                            <div className="flex items-center gap-2 mb-2">
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
                            
                            {/* Notes */}
                            {material.notes && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border-l-2 border-gray-300">
                                  {material.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* MaterialPricingInput section */}
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
        
        <TabsContent value="not-used">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Outtakes</CardTitle>
                  <CardDescription>
                    Materials that were considered but not selected for projects
                  </CardDescription>
                </div>
                <AddConsideredMaterialForm 
                  onMaterialAdded={fetchMaterials}
                  manufacturers={manufacturers}
                  materials={materials}
                />
              </div>
            </CardHeader>
            <CardContent>
              <ConsideredMaterialsList showProjectFilter={true} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Materials;
