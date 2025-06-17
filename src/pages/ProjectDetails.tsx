
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Edit, Plus, TrendingUp, Package } from 'lucide-react';
import EditProjectForm from '@/components/forms/EditProjectForm';
import EditMaterialForm from '@/components/forms/EditMaterialForm';
import AddConsideredMaterialForm from '@/components/forms/AddConsideredMaterialForm';
import ConsideredMaterialsList from '@/components/ConsideredMaterialsList';
import PricingAnalytics from '@/components/PricingAnalytics';
import UserInitials from '@/components/UserInitials';

const ProjectDetails = () => {
  const { id } = useParams();
  const { studioId } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [allMaterials, setAllMaterials] = useState<any[]>([]);
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);

  useEffect(() => {
    if (id && studioId) {
      fetchProjectDetails();
      fetchProjectMaterials();
      fetchAllMaterials();
      fetchManufacturers();
    }
  }, [id, studioId]);

  const fetchProjectDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, clients(name)')
        .eq('id', id)
        .eq('studio_id', studioId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchProjectMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('proj_materials')
        .select(`
          *,
          materials(
            id, 
            name, 
            category, 
            subcategory,
            tag,
            location,
            notes,
            reference_sku,
            dimensions,
            photo_url,
            manufacturers(name)
          )
        `)
        .eq('project_id', id)
        .eq('studio_id', studioId);

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching project materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('id, name')
        .eq('studio_id', studioId)
        .order('name');

      if (error) throw error;
      setAllMaterials(data || []);
    } catch (error) {
      console.error('Error fetching all materials:', error);
    }
  };

  const fetchManufacturers = async () => {
    try {
      const { data, error } = await supabase
        .from('manufacturers')
        .select('id, name')
        .eq('studio_id', studioId)
        .order('name');

      if (error) throw error;
      setManufacturers(data || []);
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'on_hold': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleProjectUpdated = () => {
    fetchProjectDetails();
  };

  const handleMaterialUpdated = () => {
    fetchProjectMaterials();
  };

  const handleConsideredMaterialAdded = () => {
    // Refresh considered materials list
  };

  const handleDeleteMaterial = async (projMaterialId: string) => {
    try {
      const { error } = await supabase
        .from('proj_materials')
        .delete()
        .eq('id', projMaterialId)
        .eq('studio_id', studioId);

      if (error) throw error;
      
      fetchProjectMaterials();
    } catch (error) {
      console.error('Error deleting material from project:', error);
    }
  };

  if (loading || !project) {
    return <div className="p-6">Loading project details...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/projects">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Project: {project.name}</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvancedAnalytics(!showAdvancedAnalytics)}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Pricing Analytics
        </Button>
      </div>

      {showAdvancedAnalytics && (
        <PricingAnalytics 
          type="project" 
          entityId={id!} 
          entityName={project.name}
          onClose={() => setShowAdvancedAnalytics(false)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <p className="text-lg capitalize">{project.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Client</label>
                  {project.clients && project.client_id ? (
                    <Link to={`/clients/${project.client_id}`} className="text-lg text-coral hover:text-coral-600 hover:underline">
                      {project.clients.name}
                    </Link>
                  ) : (
                    <p className="text-lg">No client assigned</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Start Date</label>
                  <p className="text-lg">{project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}</p>
                </div>
              </div>
              {project.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-gray-700 mt-1">{project.notes}</p>
                </div>
              )}
              <EditProjectForm project={project} onProjectUpdated={handleProjectUpdated} />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Project Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-2xl font-bold">{materials.length}</div>
                <p className="text-sm text-gray-500">Materials Used</p>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {project.end_date && project.start_date 
                    ? Math.ceil((new Date(project.end_date).getTime() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24))
                    : '-'}
                </div>
                <p className="text-sm text-gray-500">Duration (days)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="materials">Selected Materials</TabsTrigger>
          <TabsTrigger value="considered">Considered Materials</TabsTrigger>
        </TabsList>
        
        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Materials Used</CardTitle>
                  <CardDescription>Materials assigned to this project</CardDescription>
                </div>
                <Button 
                  className="bg-coral hover:bg-coral-600"
                  onClick={() => setShowAddMaterial(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Material
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {materials.map((projMaterial) => (
                  <div key={projMaterial.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-coral-100 rounded-lg">
                        {projMaterial.materials?.photo_url ? (
                          <img 
                            src={projMaterial.materials.photo_url} 
                            alt={projMaterial.materials.name}
                            className="h-12 w-12 object-cover rounded"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-coral-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <Link to={`/materials/${projMaterial.material_id}`} className="hover:text-coral">
                          <h3 className="font-semibold">{projMaterial.materials?.name}</h3>
                        </Link>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>Category: {projMaterial.materials?.category}</span>
                          {projMaterial.materials?.subcategory && (
                            <span>• {projMaterial.materials.subcategory}</span>
                          )}
                          {projMaterial.materials?.manufacturers?.name && (
                            <span>• Manufacturer: {projMaterial.materials.manufacturers.name}</span>
                          )}
                          {projMaterial.quantity && (
                            <span>• Qty: {projMaterial.quantity} {projMaterial.unit || ''}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          {projMaterial.materials?.tag && (
                            <span>Tag: {projMaterial.materials.tag}</span>
                          )}
                          {projMaterial.materials?.location && (
                            <span>• Location: {projMaterial.materials.location}</span>
                          )}
                          {projMaterial.materials?.reference_sku && (
                            <span>• SKU: {projMaterial.materials.reference_sku}</span>
                          )}
                        </div>
                        {projMaterial.materials?.dimensions && (
                          <div className="text-sm text-gray-500 mt-1">
                            Dimensions: {projMaterial.materials.dimensions}
                          </div>
                        )}
                        {projMaterial.materials?.notes && (
                          <p className="text-sm text-gray-600 mt-1">Material Notes: {projMaterial.materials.notes}</p>
                        )}
                        {projMaterial.notes && (
                          <p className="text-sm text-gray-600 mt-1">Project Notes: {projMaterial.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {projMaterial.materials && (
                        <EditMaterialForm 
                          material={projMaterial.materials} 
                          onMaterialUpdated={handleMaterialUpdated} 
                        />
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteMaterial(projMaterial.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                {materials.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No materials assigned to this project yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="considered">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Considered Materials</CardTitle>
                  <CardDescription>Materials that were evaluated but not selected</CardDescription>
                </div>
                <AddConsideredMaterialForm 
                  projectId={id}
                  onMaterialAdded={handleConsideredMaterialAdded}
                  manufacturers={manufacturers}
                  materials={allMaterials}
                />
              </div>
            </CardHeader>
            <CardContent>
              <ConsideredMaterialsList projectId={id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showAddMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Material to Project</h3>
            <p className="text-gray-600 mb-4">
              To add materials to this project, go to the Materials page and use the "Apply to Project" button on any material.
            </p>
            <div className="flex gap-2">
              <Link to="/materials">
                <Button className="bg-coral hover:bg-coral-600">
                  Go to Materials
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={() => setShowAddMaterial(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
