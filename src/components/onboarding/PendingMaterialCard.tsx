
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Edit, AlertTriangle, Link2, FileText, User, Building, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SimilarMaterial {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  reference_sku: string;
  similarity_score: number;
  manufacturer_name: string;
  projects: Array<{
    id: string;
    name: string;
  }>;
}

interface PendingMaterialCardProps {
  material: any;
  onApprove: (materialId: string) => void;
  onReject: (materialId: string, reason?: string) => void;
  onEdit: (material: any, duplicates: SimilarMaterial[]) => void;
}

const PendingMaterialCard = ({ material, onApprove, onReject, onEdit }: PendingMaterialCardProps) => {
  const [similarMaterials, setSimilarMaterials] = useState<SimilarMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');

  useEffect(() => {
    findSimilarMaterials();
    fetchAssociatedInfo();
  }, [material]);

  const fetchAssociatedInfo = async () => {
    try {
      // Fetch project name if project_id exists
      if (material.project_id) {
        const { data: projectData } = await supabase
          .from('projects')
          .select('name')
          .eq('id', material.project_id)
          .single();
        
        if (projectData) {
          setProjectName(projectData.name);
        }
      }

      // Fetch client name if client_id exists
      if (material.client_id) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('name')
          .eq('id', material.client_id)
          .single();
        
        if (clientData) {
          setClientName(clientData.name);
        }
      }
    } catch (error) {
      console.error('Error fetching associated info:', error);
    }
  };

  const findSimilarMaterials = async () => {
    try {
      console.log('=== DUPLICATE DETECTION DEBUG ===');
      console.log('Searching for duplicates with:', {
        manufacturer_name: material.manufacturer_name,
        reference_sku: material.reference_sku,
        studio_id: material.studio_id
      });

      if (!material.manufacturer_name || !material.reference_sku) {
        console.log('Missing manufacturer or SKU, skipping duplicate check');
        setSimilarMaterials([]);
        setLoading(false);
        return;
      }

      // First, let's see what manufacturers exist in the database
      const { data: allManufacturers } = await supabase
        .from('manufacturers')
        .select('id, name')
        .eq('studio_id', material.studio_id);
      
      console.log('All manufacturers in database:', allManufacturers);

      // Let's also check what materials exist with any SKU
      const { data: allMaterialsWithSku } = await supabase
        .from('materials')
        .select(`
          id,
          name,
          reference_sku,
          manufacturers(name)
        `)
        .eq('studio_id', material.studio_id)
        .not('reference_sku', 'is', null);
      
      console.log('All materials with SKUs:', allMaterialsWithSku);

      // Direct query for exact manufacturer + SKU match
      const { data: duplicateData, error } = await supabase
        .from('materials')
        .select(`
          id,
          name,
          category,
          subcategory,
          reference_sku,
          manufacturers!inner(name)
        `)
        .eq('studio_id', material.studio_id)
        .eq('reference_sku', material.reference_sku)
        .ilike('manufacturers.name', material.manufacturer_name);

      console.log('Duplicate query result:', { duplicateData, error });

      if (error) {
        console.error('Error finding duplicates:', error);
        setSimilarMaterials([]);
        setLoading(false);
        return;
      }

      console.log('Found potential duplicates:', duplicateData);

      if (!duplicateData || duplicateData.length === 0) {
        console.log('No duplicates found');
        setSimilarMaterials([]);
        setLoading(false);
        return;
      }

      // For each duplicate, get the projects it's associated with
      const materialsWithProjects = await Promise.all(
        duplicateData.map(async (duplicate: any) => {
          const { data: projectData } = await supabase
            .from('proj_materials')
            .select(`
              project_id,
              projects(id, name)
            `)
            .eq('material_id', duplicate.id);

          return {
            id: duplicate.id,
            name: duplicate.name,
            category: duplicate.category,
            subcategory: duplicate.subcategory,
            reference_sku: duplicate.reference_sku,
            manufacturer_name: duplicate.manufacturers?.name || 'No Manufacturer',
            similarity_score: 0.99, // Exact match
            projects: projectData?.map(p => p.projects).filter(Boolean) || []
          };
        })
      );

      setSimilarMaterials(materialsWithProjects);
      console.log('Final duplicates with projects:', materialsWithProjects);
      console.log('=== END DUPLICATE DETECTION DEBUG ===');

    } catch (error) {
      console.error('Error finding similar materials:', error);
      setSimilarMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Processing' },
      ready_for_review: { color: 'bg-purple-100 text-purple-800', label: 'Ready for Review' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.label}
      </Badge>
    );
  };

  const handleEdit = () => {
    onEdit(material, similarMaterials);
  };

  const handleReject = () => {
    const reason = window.prompt('Please provide a reason for rejection (optional):');
    onReject(material.id, reason || undefined);
  };

  return (
    <Card className="border-orange-200">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Material Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{material.name}</h3>
              <div className="flex items-center gap-4 mt-2">
                {getStatusBadge(material.status)}
                {material.tag && (
                  <Badge variant="outline" className="text-xs">
                    {material.tag}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Material Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Category:</span>
              <p className="text-gray-600">{material.category}</p>
            </div>
            {material.subcategory && (
              <div>
                <span className="font-medium text-gray-700">Subcategory:</span>
                <p className="text-gray-600">{material.subcategory}</p>
              </div>
            )}
            {material.manufacturer_name && (
              <div>
                <span className="font-medium text-gray-700">Manufacturer:</span>
                <p className="text-gray-600">{material.manufacturer_name}</p>
              </div>
            )}
            {material.reference_sku && (
              <div>
                <span className="font-medium text-gray-700">SKU:</span>
                <p className="text-gray-600">{material.reference_sku}</p>
              </div>
            )}
            {material.dimensions && (
              <div>
                <span className="font-medium text-gray-700">Dimensions:</span>
                <p className="text-gray-600">{material.dimensions}</p>
              </div>
            )}
            {material.location && (
              <div>
                <span className="font-medium text-gray-700">Location:</span>
                <p className="text-gray-600">{material.location}</p>
              </div>
            )}
            {material.model && (
              <div>
                <span className="font-medium text-gray-700">Model:</span>
                <p className="text-gray-600">{material.model}</p>
              </div>
            )}
          </div>

          {/* Source Information */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">Source Information</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
              {material.pdf_submissions?.file_name && (
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3 text-blue-600" />
                  <span>PDF: {material.pdf_submissions.file_name}</span>
                </div>
              )}
              {projectName && (
                <div className="flex items-center gap-1">
                  <Building className="h-3 w-3 text-blue-600" />
                  <span>Project: {projectName}</span>
                </div>
              )}
              {clientName && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3 text-blue-600" />
                  <span>Client: {clientName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Simple Duplicate Detection Alert */}
          {!loading && similarMaterials.length > 0 && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium text-orange-800">
                    Found {similarMaterials.length} exact duplicate{similarMaterials.length > 1 ? 's' : ''} (same manufacturer + SKU):
                  </p>
                  {similarMaterials.map((similar, index) => (
                    <div key={similar.id} className="text-sm">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-3 w-3 text-orange-600" />
                        <span className="font-medium">{similar.name}</span>
                        {similar.reference_sku && (
                          <Badge variant="outline" className="text-xs">
                            {similar.reference_sku}
                          </Badge>
                        )}
                        <Badge className="text-xs bg-red-100 text-red-800">
                          Exact Match
                        </Badge>
                      </div>
                      <div className="ml-5 text-xs text-orange-700">
                        {similar.category}{similar.subcategory && ` • ${similar.subcategory}`} • {similar.manufacturer_name}
                      </div>
                      {similar.projects.length > 0 && (
                        <div className="ml-5 mt-1">
                          <span className="text-orange-700">Used in projects: </span>
                          {similar.projects.map((project, projIndex) => (
                            <span key={project.id} className="text-orange-800 font-medium">
                              {project.name}
                              {projIndex < similar.projects.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="mt-3 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                    <p className="text-xs text-blue-800">
                      <strong>Note:</strong> This material appears to already exist in your database with the same manufacturer and SKU. 
                      Consider linking to the existing material instead of creating a new one.
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Notes */}
          {material.notes && (
            <div>
              <span className="font-medium text-gray-700">Notes:</span>
              <p className="text-gray-600 text-sm mt-1">{material.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={() => onApprove(material.id)}
              className="bg-green-600 hover:bg-green-700 flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {similarMaterials.length > 0 ? 'Approve as New Material' : 'Approve'}
            </Button>
            <Button 
              onClick={handleEdit}
              variant="outline"
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
              {similarMaterials.length > 0 && (
                <span className="ml-1 text-xs text-orange-600">(Has Duplicates)</span>
              )}
            </Button>
            <Button 
              onClick={handleReject}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingMaterialCard;
