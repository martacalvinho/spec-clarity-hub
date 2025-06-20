import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Package, Building } from 'lucide-react';
import DuplicateMaterialDetector from './DuplicateMaterialDetector';
import DuplicateManufacturerDetector from './DuplicateManufacturerDetector';

interface MaterialToImport {
  name: string;
  category: string;
  subcategory?: string;
  notes?: string;
  reference_sku?: string;
  dimensions?: string;
  location?: string;
  manufacturer_id?: string;
  manufacturer_name?: string;
  tag?: string;
}

interface ManufacturerToImport {
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  notes?: string;
}

interface ExistingMaterial {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  notes?: string;
  reference_sku?: string;
  dimensions?: string;
  location?: string;
  manufacturer_id?: string;
  manufacturer_name?: string;
  tag?: string;
  similarity_score: number;
}

interface ExistingManufacturer {
  id: string;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  notes?: string;
  similarity_score: number;
}

interface MaterialResolution {
  materialToImport: MaterialToImport;
  existingMaterials: ExistingMaterial[];
  action: 'create' | 'link';
  selectedExistingId?: string;
}

interface ManufacturerResolution {
  manufacturerToImport: ManufacturerToImport;
  existingManufacturers: ExistingManufacturer[];
  action: 'create' | 'link' | 'replace';
  selectedExistingId?: string;
}

interface JSONDataInputProps {
  studioId: string;
  projectId?: string;
  pdfSubmissionId?: string;
}

const JSONDataInput = ({ studioId, projectId, pdfSubmissionId }: JSONDataInputProps) => {
  const { toast } = useToast();
  const [materialsData, setMaterialsData] = useState<MaterialToImport[]>([]);
  const [manufacturersData, setManufacturersData] = useState<ManufacturerToImport[]>([]);
  const [showMaterialDuplicateDetector, setShowMaterialDuplicateDetector] = useState(false);
  const [showManufacturerDuplicateDetector, setShowManufacturerDuplicateDetector] = useState(false);
  const [materialDuplicatesChecked, setMaterialDuplicatesChecked] = useState(false);
  const [manufacturerDuplicatesChecked, setManufacturerDuplicatesChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const processMaterials = async (materialsToProcess: MaterialToImport[], materialResolutions?: MaterialResolution[]) => {
    console.log('Processing materials:', materialsToProcess.length);
    
    try {
      const materialsToCreate = materialResolutions 
        ? materialResolutions
            .filter(resolution => resolution.action === 'create')
            .map(resolution => resolution.materialToImport)
        : materialsToProcess;

      console.log('Materials to create:', materialsToCreate.length);

      if (materialsToCreate.length === 0) {
        console.log('No materials to create');
        return { success: true, created: 0, errors: [] };
      }

      const errors: string[] = [];
      let created = 0;

      // Process materials one by one to handle potential duplicates gracefully
      for (const material of materialsToCreate) {
        try {
          // Check if material already exists to prevent duplicate key violation
          const { data: existingMaterial } = await supabase
            .from('materials')
            .select('id, name')
            .eq('studio_id', studioId)
            .eq('name', material.name)
            .maybeSingle();

          if (existingMaterial) {
            console.log(`Material "${material.name}" already exists, skipping...`);
            continue;
          }

          const materialData = {
            studio_id: studioId,
            name: material.name,
            category: material.category,
            subcategory: material.subcategory || null,
            notes: material.notes || null,
            reference_sku: material.reference_sku || null,
            dimensions: material.dimensions || null,
            location: material.location || null,
            manufacturer_id: material.manufacturer_id || null,
            tag: material.tag || null
          };

          const { error } = await supabase
            .from('materials')
            .insert(materialData);

          if (error) {
            console.error(`Error creating material "${material.name}":`, error);
            errors.push(`${material.name}: ${error.message}`);
          } else {
            created++;
            console.log(`Successfully created material: ${material.name}`);
          }
        } catch (error) {
          console.error(`Unexpected error processing material "${material.name}":`, error);
          errors.push(`${material.name}: Unexpected error`);
        }
      }

      return { success: errors.length === 0, created, errors };
    } catch (error) {
      console.error('Error in processMaterials:', error);
      return { success: false, created: 0, errors: [error.message || 'Unknown error'] };
    }
  };

  const processManufacturers = async (manufacturersToProcess: ManufacturerToImport[], manufacturerResolutions?: ManufacturerResolution[]) => {
    console.log('Processing manufacturers:', manufacturersToProcess.length);
    
    try {
      if (!manufacturerResolutions) {
        // No duplicates found, create all manufacturers
        const manufacturerPromises = manufacturersToProcess.map(async (manufacturer) => {
          const { data, error } = await supabase
            .from('manufacturers')
            .insert({
              studio_id: studioId,
              name: manufacturer.name,
              contact_name: manufacturer.contact_name || null,
              email: manufacturer.email || null,
              phone: manufacturer.phone || null,
              website: manufacturer.website || null,
              notes: manufacturer.notes || null
            })
            .select('id, name')
            .single();

          if (error) throw error;
          return { name: manufacturer.name, id: data.id };
        });

        const results = await Promise.all(manufacturerPromises);
        console.log('Created manufacturers:', results);
        return results;
      }

      const results: { name: string; id: string }[] = [];

      for (const resolution of manufacturerResolutions) {
        if (resolution.action === 'create') {
          // Create new manufacturer
          const { data, error } = await supabase
            .from('manufacturers')
            .insert({
              studio_id: studioId,
              name: resolution.manufacturerToImport.name,
              contact_name: resolution.manufacturerToImport.contact_name || null,
              email: resolution.manufacturerToImport.email || null,
              phone: resolution.manufacturerToImport.phone || null,
              website: resolution.manufacturerToImport.website || null,
              notes: resolution.manufacturerToImport.notes || null
            })
            .select('id, name')
            .single();

          if (error) throw error;
          results.push({ name: resolution.manufacturerToImport.name, id: data.id });
        } else if (resolution.action === 'replace' && resolution.selectedExistingId) {
          // Update existing manufacturer with new details
          const { error } = await supabase
            .from('manufacturers')
            .update({
              name: resolution.manufacturerToImport.name,
              contact_name: resolution.manufacturerToImport.contact_name || null,
              email: resolution.manufacturerToImport.email || null,
              phone: resolution.manufacturerToImport.phone || null,
              website: resolution.manufacturerToImport.website || null,
              notes: resolution.manufacturerToImport.notes || null
            })
            .eq('id', resolution.selectedExistingId)
            .eq('studio_id', studioId);

          if (error) throw error;
          results.push({ name: resolution.manufacturerToImport.name, id: resolution.selectedExistingId });
        } else if (resolution.action === 'link' && resolution.selectedExistingId) {
          // Use existing manufacturer
          results.push({ name: resolution.manufacturerToImport.name, id: resolution.selectedExistingId });
        }
      }

      return results;
    } catch (error) {
      console.error('Error processing manufacturers:', error);
      throw error;
    }
  };

  const checkForMaterialDuplicates = async () => {
    if (materialsData.length === 0) return;
    
    setLoading(true);
    try {
      const duplicateChecks = await Promise.all(
        materialsData.map(async (material) => {
          const { data: similarMaterials } = await supabase
            .rpc('find_similar_materials', {
              studio_id_param: studioId,
              material_name_param: material.name,
              category_param: material.category,
              similarity_threshold: 0.7
            });
          
          return {
            material,
            duplicates: similarMaterials || []
          };
        })
      );

      const materialsWithDuplicates = duplicateChecks.filter(check => check.duplicates.length > 0);
      
      if (materialsWithDuplicates.length === 0) {
        // No duplicates found, show success message and proceed
        toast({
          title: "No Duplicates Found",
          description: `All ${materialsData.length} materials appear to be new. They will all be added to your library.`,
        });
        
        setMaterialDuplicatesChecked(true);
        
        // Auto-process materials since no duplicates
        const result = await processMaterials(materialsData);
        if (result.success) {
          toast({
            title: "Materials Added",
            description: `Successfully added ${result.created} materials to your library.`,
          });
          setMaterialsData([]);
        } else {
          toast({
            title: "Import Completed with Issues",
            description: `Added ${result.created} materials. ${result.errors.length} had issues.`,
            variant: "destructive"
          });
        }
      } else {
        setShowMaterialDuplicateDetector(true);
      }
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      toast({
        title: "Error",
        description: "Failed to check for duplicates. Proceeding with import.",
        variant: "destructive"
      });
      setMaterialDuplicatesChecked(true);
    } finally {
      setLoading(false);
    }
  };

  const checkForManufacturerDuplicates = async () => {
    if (manufacturersData.length === 0) return;
    
    setLoading(true);
    try {
      const duplicateChecks = await Promise.all(
        manufacturersData.map(async (manufacturer) => {
          const { data: similarManufacturers } = await supabase
            .rpc('find_similar_manufacturers', {
              studio_id_param: studioId,
              manufacturer_name_param: manufacturer.name,
              similarity_threshold: 0.6
            });
          
          return {
            manufacturer,
            duplicates: similarManufacturers || []
          };
        })
      );

      const manufacturersWithDuplicates = duplicateChecks.filter(check => check.duplicates.length > 0);
      
      if (manufacturersWithDuplicates.length === 0) {
        // No duplicates found, proceed with creation
        toast({
          title: "No Duplicates Found",
          description: `All ${manufacturersData.length} manufacturers appear to be new. They will all be added.`,
        });
        
        setManufacturerDuplicatesChecked(true);
        
        // Auto-process manufacturers since no duplicates
        const results = await processManufacturers(manufacturersData);
        toast({
          title: "Manufacturers Added",
          description: `Successfully added ${results.length} manufacturers.`,
        });
        setManufacturersData([]);
      } else {
        setShowManufacturerDuplicateDetector(true);
      }
    } catch (error) {
      console.error('Error checking for manufacturer duplicates:', error);
      toast({
        title: "Error",
        description: "Failed to check for duplicates. Proceeding with import.",
        variant: "destructive"
      });
      setManufacturerDuplicatesChecked(true);
    } finally {
      setLoading(false);
    }
  };

  const handleManufacturerResolution = async (resolutions: ManufacturerResolution[]) => {
    setLoading(true);
    try {
      const results = await processManufacturers(manufacturersData, resolutions);
      
      toast({
        title: "Manufacturers Processed",
        description: `Successfully processed ${results.length} manufacturers.`,
      });

      setShowManufacturerDuplicateDetector(false);
      setManufacturerDuplicatesChecked(true);
      setManufacturersData([]);
    } catch (error) {
      console.error('Error processing manufacturer resolutions:', error);
      toast({
        title: "Error",
        description: "Failed to process manufacturers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMaterialResolution = async (resolutions: MaterialResolution[]) => {
    setLoading(true);
    try {
      const result = await processMaterials(materialsData, resolutions);
      
      if (result.success) {
        toast({
          title: "Materials Processed",
          description: `Successfully processed ${result.created} materials.`,
        });
      } else {
        toast({
          title: "Import Completed with Issues",
          description: `Added ${result.created} materials. ${result.errors.length} had issues: ${result.errors.slice(0, 3).join(', ')}${result.errors.length > 3 ? '...' : ''}`,
          variant: "destructive"
        });
      }

      setShowMaterialDuplicateDetector(false);
      setMaterialDuplicatesChecked(true);
      setMaterialsData([]);
    } catch (error) {
      console.error('Error processing material resolutions:', error);
      toast({
        title: "Error",
        description: "Failed to process materials",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (showMaterialDuplicateDetector) {
    return (
      <DuplicateMaterialDetector
        materialsToImport={materialsData}
        studioId={studioId}
        projectId={projectId}
        onResolutionComplete={handleMaterialResolution}
        onCancel={() => {
          setShowMaterialDuplicateDetector(false);
          setMaterialsData([]);
        }}
      />
    );
  }

  if (showManufacturerDuplicateDetector) {
    return (
      <DuplicateManufacturerDetector
        manufacturersToImport={manufacturersData}
        studioId={studioId}
        onResolutionComplete={handleManufacturerResolution}
        onCancel={() => {
          setShowManufacturerDuplicateDetector(false);
          setManufacturersData([]);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {pdfSubmissionId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <p className="text-blue-800 font-medium">
              Materials from PDF submission will be automatically linked
            </p>
          </div>
        </div>
      )}

      {/* Materials Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Materials Import
          </CardTitle>
          <CardDescription>
            Add your materials data in JSON format. Each material should include name, category, and any additional details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {materialsData.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-800 font-medium">
                    {materialsData.length} materials ready for import
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {materialsData.slice(0, 5).map((material, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {material.name}
                      </Badge>
                    ))}
                    {materialsData.length > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        +{materialsData.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  onClick={checkForMaterialDuplicates}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? 'Checking...' : 'Import Materials'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manufacturers Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Manufacturers Import
          </CardTitle>
          <CardDescription>
            Add your manufacturers data in JSON format. Each manufacturer should include name and contact details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {manufacturersData.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-800 font-medium">
                    {manufacturersData.length} manufacturers ready for import
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {manufacturersData.slice(0, 5).map((manufacturer, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {manufacturer.name}
                      </Badge>
                    ))}
                    {manufacturersData.length > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        +{manufacturersData.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  onClick={checkForManufacturerDuplicates}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Checking...' : 'Import Manufacturers'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JSONDataInput;
