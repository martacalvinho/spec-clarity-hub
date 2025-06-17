
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Edit, Package, ExternalLink, Download, Calendar, User, Info } from 'lucide-react';
import EditMaterialForm from '@/components/forms/EditMaterialForm';
import ApplyToProjectForm from '@/components/forms/ApplyToProjectForm';

const MaterialDetails = () => {
  const { id } = useParams();
  const { studioId } = useAuth();
  const [material, setMaterial] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [relatedMaterials, setRelatedMaterials] = useState<any[]>([]);
  const [createdByUser, setCreatedByUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && studioId) {
      fetchMaterialDetails();
      fetchMaterialProjects();
    }
  }, [id, studioId]);

  const fetchMaterialDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*, manufacturers(name)')
        .eq('id', id)
        .eq('studio_id', studioId)
        .single();

      if (error) throw error;
      setMaterial(data);

      // Fetch created by user info if available
      if (data.created_by) {
        const { data: userData } = await supabase
          .from('users')
          .select('first_name, last_name, email')
          .eq('id', data.created_by)
          .single();
        
        if (userData) {
          setCreatedByUser(userData);
        }
      }

      // Fetch related materials after we have the current material data
      if (data) {
        await fetchRelatedMaterials(data);
      }
    } catch (error) {
      console.error('Error fetching material:', error);
    }
  };

  const fetchRelatedMaterials = async (currentMaterial: any) => {
    try {
      // Get similar materials based on category and manufacturer
      const { data: similarMaterials, error } = await supabase
        .from('materials')
        .select('id, name, category, photo_url, thumbnail_url, manufacturers(name)')
        .eq('studio_id', studioId)
        .neq('id', id)
        .or(`category.eq.${currentMaterial.category},manufacturer_id.eq.${currentMaterial.manufacturer_id}`)
        .limit(3);

      if (error) throw error;

      // Also get similar materials from considered materials
      const { data: consideredMaterials, error: consideredError } = await supabase
        .from('considered_materials')
        .select('id, material_name, category, photo_url, manufacturer_id, manufacturers(name)')
        .eq('studio_id', studioId)
        .eq('category', currentMaterial.category)
        .limit(2);

      if (consideredError) throw consideredError;

      // Combine and deduplicate
      const combined = [
        ...(similarMaterials || []),
        ...(consideredMaterials || []).map(item => ({
          id: item.id,
          name: item.material_name,
          category: item.category,
          photo_url: item.photo_url,
          thumbnail_url: null,
          manufacturers: item.manufacturers,
          isConsidered: true
        }))
      ].slice(0, 3);

      setRelatedMaterials(combined);
    } catch (error) {
      console.error('Error fetching related materials:', error);
    }
  };

  const fetchMaterialProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('proj_materials')
        .select('*, projects(id, name, status, type)')
        .eq('material_id', id)
        .eq('studio_id', studioId);

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching material projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMaterialUpdated = () => {
    fetchMaterialDetails();
    fetchMaterialProjects();
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

  const getCostBandColor = (band: string) => {
    switch (band?.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-700';
      case 'mid': return 'bg-yellow-100 text-yellow-700';
      case 'high': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading || !material) {
    return <div className="p-6">Loading material details...</div>;
  }

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/materials">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Materials
            </Button>
          </Link>
        </div>

        {/* Visual Header */}
        <div className="flex items-start gap-6 bg-white p-6 rounded-lg border">
          <div className="flex-shrink-0">
            {material.photo_url || material.thumbnail_url ? (
              <img 
                src={material.thumbnail_url || material.photo_url} 
                alt={material.name}
                className="h-24 w-24 object-cover rounded-lg border"
              />
            ) : (
              <div className="h-24 w-24 bg-coral-100 rounded-lg flex items-center justify-center">
                <Package className="h-8 w-8 text-coral-600" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{material.name}</h1>
            {material.reference_sku && (
              <p className="text-lg text-gray-600 mb-2">SKU: {material.reference_sku}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{material.category}</Badge>
              {material.subcategory && (
                <Badge variant="outline">{material.subcategory}</Badge>
              )}
              {material.cost_band && (
                <Badge className={getCostBandColor(material.cost_band)}>
                  {material.cost_band} Cost
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Core Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Material Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Category</label>
                    <Link to={`/materials/category/${encodeURIComponent(material.category)}`} className="hover:text-coral">
                      <p className="text-lg hover:underline cursor-pointer">{material.category}</p>
                    </Link>
                  </div>
                  {material.subcategory && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Subcategory</label>
                      <p className="text-lg">{material.subcategory}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Manufacturer</label>
                    {material.manufacturer_id ? (
                      <Link to={`/manufacturers/${material.manufacturer_id}`} className="hover:text-coral">
                        <p className="text-lg hover:underline cursor-pointer">{material.manufacturers?.name || 'Not specified'}</p>
                      </Link>
                    ) : (
                      <p className="text-lg">Not specified</p>
                    )}
                  </div>
                  {material.dimensions && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Dimensions</label>
                      <p className="text-lg">{material.dimensions}</p>
                    </div>
                  )}
                </div>

                {/* Pricing Information */}
                {(material.price_per_unit || material.price_per_sqft) && (
                  <div className="border-t pt-4">
                    <h4 className="text-lg font-semibold mb-3">Pricing Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {material.price_per_unit && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Price per Unit</label>
                          <p className="text-lg">${material.price_per_unit}</p>
                        </div>
                      )}
                      {material.price_per_sqft && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Price per Sq Ft</label>
                          <p className="text-lg">${material.price_per_sqft}</p>
                        </div>
                      )}
                      {material.unit_type && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Unit Type</label>
                          <p className="text-lg">{material.unit_type}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {material.notes && (
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <p className="text-gray-700 mt-1">{material.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <EditMaterialForm material={material} onMaterialUpdated={handleMaterialUpdated} />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <ApplyToProjectForm 
                          material={material} 
                          onMaterialUpdated={handleMaterialUpdated}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Apply to Project</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>

            {/* Related Materials Section */}
            {relatedMaterials.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Related Materials
                  </CardTitle>
                  <CardDescription>Similar materials in your library</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {relatedMaterials.map((relatedMaterial) => (
                      <div key={relatedMaterial.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex-shrink-0">
                          {relatedMaterial.photo_url || relatedMaterial.thumbnail_url ? (
                            <img 
                              src={relatedMaterial.thumbnail_url || relatedMaterial.photo_url} 
                              alt={relatedMaterial.name}
                              className="h-10 w-10 object-cover rounded border"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-coral-100 rounded flex items-center justify-center">
                              <Package className="h-5 w-5 text-coral-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {relatedMaterial.isConsidered ? (
                            <div>
                              <p className="font-medium text-sm truncate">{relatedMaterial.name}</p>
                              <p className="text-xs text-gray-500">From Outtakes</p>
                            </div>
                          ) : (
                            <Link to={`/materials/${relatedMaterial.id}`} className="hover:text-coral">
                              <p className="font-medium text-sm truncate hover:underline">{relatedMaterial.name}</p>
                              <p className="text-xs text-gray-500">{relatedMaterial.manufacturers?.name || 'No manufacturer'}</p>
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {/* Usage Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-2xl font-bold">{projects.length}</div>
                  <p className="text-sm text-gray-500">Projects Using This Material</p>
                </div>
              </CardContent>
            </Card>

            {/* Activity Log */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-3 w-3" />
                    <span>Created on {new Date(material.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                {createdByUser && (
                  <div className="text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="h-3 w-3" />
                      <span>
                        Added by {createdByUser.first_name} {createdByUser.last_name}
                      </span>
                    </div>
                  </div>
                )}
                <div className="text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Edit className="h-3 w-3" />
                    <span>Last updated {new Date(material.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
                {projects.length > 0 && (
                  <div className="text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Package className="h-3 w-3" />
                      <span>Used in {projects.length} project{projects.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add Information Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Info className="h-4 w-4" />
                      Add Information
                    </CardTitle>
                    <CardDescription className="text-xs">Additional specialist details</CardDescription>
                  </div>
                  <EditMaterialForm 
                    material={material} 
                    onMaterialUpdated={handleMaterialUpdated}
                    editMode="additional"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Certifications</label>
                    <p className="text-sm">{material.certifications || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Finish/Color</label>
                    <p className="text-sm">{material.finish_color || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Fire Rating</label>
                    <p className="text-sm">{material.fire_rating || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  {material.product_url ? (
                    <Button variant="outline" size="sm" className="h-7 text-xs flex-1" asChild>
                      <a href={material.product_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Product Page
                      </a>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="h-7 text-xs flex-1" disabled>
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Product Page
                    </Button>
                  )}
                  {material.product_sheet_url ? (
                    <Button variant="outline" size="sm" className="h-7 text-xs flex-1" asChild>
                      <a href={material.product_sheet_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-3 w-3 mr-1" />
                        Product Sheet
                      </a>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="h-7 text-xs flex-1" disabled>
                      <Download className="h-3 w-3 mr-1" />
                      Product Sheet
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Projects Using This Material */}
        <Card>
          <CardHeader>
            <CardTitle>Projects Using This Material</CardTitle>
            <CardDescription>All projects that have used this material</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.map((projMaterial) => (
                <div key={projMaterial.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <Link to={`/projects/${projMaterial.projects.id}`} className="hover:text-coral">
                      <h3 className="font-semibold text-lg">{projMaterial.projects.name}</h3>
                    </Link>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>Type: {projMaterial.projects.type}</span>
                      <Badge className={getStatusColor(projMaterial.projects.status)}>
                        {projMaterial.projects.status}
                      </Badge>
                      {projMaterial.quantity && (
                        <span>Qty: {projMaterial.quantity} {projMaterial.unit || ''}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      {projMaterial.location && (
                        <span>Location: {projMaterial.location}</span>
                      )}
                      {projMaterial.tag && (
                        <span>• Tag: {projMaterial.tag}</span>
                      )}
                    </div>
                    {projMaterial.notes && (
                      <p className="text-sm text-gray-600 mt-1">{projMaterial.notes}</p>
                    )}
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  This material hasn't been used in any projects yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default MaterialDetails;
